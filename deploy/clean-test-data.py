#!/usr/bin/env python3
"""Clear an acceptance-only installation without backups or upstream requests."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid


CONFIG_KINDS = {
    "role", "settings", "resource-target", "payout-provider", "exchange-rate",
    "resource-target-sync-settings", "resource-sync-settings",
}
BUSINESS_KINDS = {
    "supplier", "supplier-settings", "project", "quote", "resource", "resource-secret",
    "resource-operation", "native-oauth", "intake", "intake-ledger", "intake-review",
    "agent", "group", "allocation", "owner-term", "account", "account-secret",
    "document", "bill", "input", "settlement", "batch", "payment", "payout-call",
    "sandbox-payment", "sandbox-event", "notification", "notice", "notice-delivery",
    "export", "proxy", "audit", "turnover", "monitoring", "monitoring-source",
    "monitoring-multiplier", "scheduled-task", "scheduled-run", "priority-round",
    "rotation-settings",
}
BUILTIN_ROLES = {"ADMIN", "OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT"}
INVENTORY_SQL = """
SET TIME ZONE 'UTC';
SELECT jsonb_build_object(
 'entities', COALESCE((SELECT jsonb_agg(jsonb_build_object(
   'kind', e.kind, 'id', e.id, 'owner', e.owner_id,
   'data', e.data,
   'fingerprint', md5(to_jsonb(e)::text)) ORDER BY e.kind,e.id) FROM hub_entity e), '[]'::jsonb),
 'users', COALESCE((SELECT jsonb_agg(jsonb_build_object(
   'id', u.id, 'username', u.username, 'supplierId', u.supplier_id, 'enabled', u.enabled,
   'role', u.profile->>'role', 'fingerprint', md5(to_jsonb(u)::text))
   ORDER BY u.id) FROM hub_user u), '[]'::jsonb)
);
"""
LIST_UPLOADS = """set -eu
# hispread-clean-list-uploads
test -d /app/data/uploads
for path in /app/data/uploads/* /app/data/uploads/.[!.]* /app/data/uploads/..?*; do
  [ -e "$path" ] || [ -L "$path" ] || continue
  [ -f "$path" ] && [ ! -L "$path" ] || exit 56
  basename "$path"
done
"""


def quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def qa(value):
    return bool(re.search(r"(^qa[_-]|验收|测试|非生产)", value or "", re.IGNORECASE))


def make_plan(inventory, administrator, expected_supplier=None):
    users, entities = inventory["users"], inventory["entities"]
    admins = [u for u in users if u["username"] == administrator and u["enabled"]
              and not u["supplierId"] and u["role"] == "ADMIN"]
    if len(admins) != 1:
        raise ValueError("未找到唯一启用的平台管理员，拒绝清理")
    admin = admins[0]
    others = [u for u in users if u["id"] != admin["id"]]
    if any(not u["username"].lower().startswith("qa_") or u["role"] == "ADMIN" for u in others):
        raise ValueError("存在非验收账号或其他管理员，拒绝清理")
    keys = {(e["kind"], e["id"]) for e in entities}
    if ("settings", "default") not in keys or not all(("role", r) in keys for r in BUILTIN_ROLES):
        raise ValueError("系统参数或内置角色不完整，拒绝清理")
    suppliers = [e for e in entities if e["kind"] == "supplier"]
    user_ids = {u["id"] for u in users}
    if not suppliers:
        # A second invocation is harmless only when no business objects remain.
        allowed = CONFIG_KINDS | {"category", "api-token", "intake-policy", "scheduled-task", "monitoring-multiplier"}
        if others or any(e["kind"] not in allowed for e in entities):
            raise ValueError("没有供应商但仍有业务记录，范围不明确，拒绝清理")
        if any(e["kind"] == "intake-policy" and e["id"] != "system" or
               e["kind"] == "api-token" and e["owner"] != admin["id"] or
               e["kind"] == "scheduled-task" and (e["data"].get("enabled") or e["data"].get("running"))
               for e in entities):
            raise ValueError("仍有非默认规则或执行中任务，拒绝清理")
        return {"administrator": admin, "keep": entities, "remove": [], "removeUsers": [], "alreadyClean": True}
    if len(suppliers) != 1:
        raise ValueError("存在多个供应商，拒绝对混合环境执行验收清理")
    supplier = suppliers[0]
    supplier_id = supplier["id"]
    if expected_supplier and expected_supplier != supplier_id:
        raise ValueError("验收供应商ID与指定范围不一致")
    if not qa(supplier["data"].get("code")) or not qa(supplier["data"].get("name")):
        raise ValueError("供应商没有明确的验收标记，拒绝清理")
    if any(u["supplierId"] and u["supplierId"] != supplier_id for u in others):
        raise ValueError("测试账号关联了其他供应商，拒绝清理")
    kept, removed = [], []
    for entry in entities:
        kind, identity, owner, data = entry["kind"], entry["id"], entry["owner"], entry["data"]
        if kind in CONFIG_KINDS or kind == "intake-policy" and identity == "system":
            kept.append(entry)
            continue
        if kind == "api-token":
            if owner == admin["id"]:
                kept.append(entry)
            elif owner in user_ids:
                removed.append(entry)
            else:
                raise ValueError("API密钥存在未知所有者，拒绝清理")
            continue
        if kind == "category":
            (removed if qa(data.get("code", identity)) else kept).append(entry)
            continue
        if kind not in BUSINESS_KINDS and kind != "intake-policy":
            raise ValueError("未知数据类型，需先核对：" + kind)
        if data.get("supplierId") not in {None, "", supplier_id, "GLOBAL"}:
            raise ValueError("记录关联其他供应商，拒绝清理：" + kind)
        if owner not in {supplier_id, "GLOBAL"} | user_ids:
            raise ValueError("记录存在未知所有者，拒绝清理：" + kind)
        if kind == "project" and not (qa(data.get("code")) and qa(data.get("name"))):
            raise ValueError("存在非验收项目，拒绝清理")
        if kind == "scheduled-task" and (data.get("enabled") or data.get("running")):
            raise ValueError("任务仍在启用或执行，请先在控制台停止并等待结束")
        if kind == "intake-policy" and not (identity == supplier_id or identity.startswith(supplier_id + ":")):
            raise ValueError("存在其他供应商上号规则，拒绝清理")
        removed.append(entry)
    return {"administrator": admin, "keep": kept, "remove": removed, "removeUsers": others, "alreadyClean": False}


def summary(plan):
    def counts(rows):
        out = {}
        for row in rows:
            out[row["kind"]] = out.get(row["kind"], 0) + 1
        return dict(sorted(out.items()))
    return {"preserveAdministrator": plan["administrator"]["username"],
            "preserveKinds": counts(plan["keep"]), "deleteKinds": counts(plan["remove"]),
            "deleteTestUserCount": len(plan["removeUsers"]), "backupCreated": False,
            "upstreamRequests": 0, "alreadyClean": plan["alreadyClean"]}


def cleanup_sql(inventory, plan):
    kept = {(e["kind"], e["id"]) for e in plan["keep"]}
    entity_values = ",\n".join("(" + ",".join([quote(e["kind"]), quote(e["id"]),
        quote(e["fingerprint"]), "true" if (e["kind"], e["id"]) in kept else "false"]) + ")"
        for e in inventory["entities"])
    user_values = ",\n".join("(" + ",".join([quote(u["id"]), quote(u["fingerprint"]),
        "true" if u["id"] == plan["administrator"]["id"] else "false"]) + ")" for u in inventory["users"])
    return f"""
BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '120s';
LOCK TABLE hub_entity,hub_user,hub_login_attempt,spring_session,spring_session_attributes IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE cleanup_entity(kind text,id text,fingerprint text,keep boolean,PRIMARY KEY(kind,id)) ON COMMIT DROP;
INSERT INTO cleanup_entity VALUES {entity_values};
CREATE TEMP TABLE cleanup_user(id text PRIMARY KEY,fingerprint text,keep boolean) ON COMMIT DROP;
INSERT INTO cleanup_user VALUES {user_values};
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM hub_entity e FULL JOIN cleanup_entity x USING(kind,id)
   WHERE e.kind IS NULL OR x.kind IS NULL OR md5(to_jsonb(e)::text) <> x.fingerprint)
 OR EXISTS(SELECT 1 FROM hub_user u FULL JOIN cleanup_user x USING(id)
   WHERE u.id IS NULL OR x.id IS NULL OR md5(to_jsonb(u)::text) <> x.fingerprint)
 THEN RAISE EXCEPTION '数据库已变化，清理已回滚'; END IF;
END $$;
DELETE FROM spring_session_attributes;
DELETE FROM spring_session;
DELETE FROM hub_login_attempt;
DELETE FROM hub_entity e USING cleanup_entity x WHERE e.kind=x.kind AND e.id=x.id AND NOT x.keep;
DELETE FROM hub_user u USING cleanup_user x WHERE u.id=x.id AND NOT x.keep;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM hub_entity e FULL JOIN (SELECT * FROM cleanup_entity WHERE keep) x USING(kind,id)
   WHERE e.kind IS NULL OR x.kind IS NULL OR md5(to_jsonb(e)::text) <> x.fingerprint)
 OR EXISTS(SELECT 1 FROM hub_user u FULL JOIN (SELECT * FROM cleanup_user WHERE keep) x USING(id)
   WHERE u.id IS NULL OR x.id IS NULL OR md5(to_jsonb(u)::text) <> x.fingerprint)
 THEN RAISE EXCEPTION '保留数据校验失败，清理已回滚'; END IF;
END $$;
COMMIT;
"""


def fingerprints(inventory):
    return ({(e["kind"], e["id"]): e["fingerprint"] for e in inventory["entities"]},
            {u["id"]: u["fingerprint"] for u in inventory["users"]})


def verify_preserved(inventory, plan, restarted=False):
    actual, users = fingerprints(inventory)
    expected = {(e["kind"], e["id"]): e["fingerprint"] for e in plan["keep"]}
    if users != {plan["administrator"]["id"]: plan["administrator"]["fingerprint"]}:
        raise ValueError("管理员保留校验失败")
    if any(actual.get(key) != value for key, value in expected.items()):
        raise ValueError("配置保留校验失败")
    categories = {e["id"] for e in plan["keep"] if e["kind"] == "category"}
    for entry in inventory["entities"]:
        key, data = (entry["kind"], entry["id"]), entry["data"]
        if key in expected:
            continue
        default_task = entry["kind"] == "scheduled-task" and entry["id"] == "CCMAX_STATUS_SYNC" \
            and not data.get("enabled") and not data.get("running")
        default_multiplier = entry["kind"] == "monitoring-multiplier" and entry["id"] in categories
        if not restarted or not (default_task or default_multiplier):
            raise ValueError("发现未清除或重建的非预期业务记录")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="执行清理，不创建备份；默认只显示计划")
    parser.add_argument("--expect-supplier-id", help="可选，额外要求唯一验收供应商ID匹配")
    parser.add_argument("--admin", help="可选，默认保留生产配置中的管理员")
    parser.add_argument("--env-file", default=".env.production")
    parser.add_argument("--project", default="hispread")
    parser.add_argument("--deploy-lock-held", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--deploy-lock-owner", type=int, help=argparse.SUPPRESS)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    os.umask(0o077)
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", args.project):
        parser.error("无效Compose项目名")
    env_file = Path(args.env_file)
    if not env_file.is_absolute():
        env_file = root / env_file
    override = root / ".run/deploy/ports.yml"
    if not env_file.is_file() or not override.is_file():
        parser.error("缺少生产环境或端口覆盖文件，请先使用deploy.sh部署")
    compose = ["docker", "compose", "--project-name", args.project, "--env-file", str(env_file),
               "-f", str(root / "docker-compose.yml"), "-f", str(override)]
    environment = dict(os.environ)
    for key in ["DATABASE_PASSWORD", "ADMIN_USERNAME", "ADMIN_PASSWORD", "PUBLIC_ORIGIN", "COOKIE_SECURE",
                "PAYMENT_SANDBOX_ENABLED", "MONITORING_SCHEDULING_ENABLED", "HTTP_BIND", "HTTP_PORT",
                "IMAGE_TAG", "COMPOSE_FILE", "COMPOSE_PROFILES"]:
        environment.pop(key, None)

    def run(command, data=None):
        return subprocess.run(command, cwd=root, env=environment, input=data, stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE, check=True, timeout=240).stdout

    def sql(text):
        return run(compose + ["exec", "-T", "postgres", "psql", "-U", "hispread", "-d", "hispread_ai",
                              "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"], text.encode())

    def inventory():
        return json.loads(sql(INVENTORY_SQL))

    def upload(script, *names):
        return run(compose + ["run", "--rm", "--no-deps", "-T", "--entrypoint", "sh", "backend",
                              "-c", script, "clean-files"] + list(names))

    def start():
        run(compose + ["up", "-d", "--wait", "--wait-timeout", "180", "backend", "frontend"])

    def stop():
        run(compose + ["stop", "frontend", "backend"])

    config = json.loads(run(compose + ["config", "--format", "json"]))
    backend = config["services"]["backend"]
    settings = backend["environment"]
    if settings.get("SPRING_PROFILES_ACTIVE") != "production" or settings.get("BOOTSTRAP_MODE", "production") != "production":
        raise ValueError("仅允许production部署")
    if not any(v.get("type") == "volume" and v.get("target") == "/app/data/uploads" for v in backend.get("volumes", [])):
        raise ValueError("附件卷不符合标准部署，拒绝清理")
    administrator = args.admin or settings.get("ADMIN_USERNAME", "wutong")
    initial = inventory()
    plan = make_plan(initial, administrator, args.expect_supplier_id)
    print(json.dumps(summary(plan), ensure_ascii=False, indent=2), flush=True)
    if not args.apply or plan["alreadyClean"]:
        print("已经没有验收业务数据。" if plan["alreadyClean"] else "只读计划完成，没有删除或备份。")
        return
    lock = root.parent / (root.name + ".deploy-lock")
    owns_lock = False
    if args.deploy_lock_held:
        if not args.deploy_lock_owner or args.deploy_lock_owner != os.getppid() \
                or (lock / "pid").read_text().strip() != str(args.deploy_lock_owner):
            raise ValueError("部署锁所有者不匹配，拒绝清理")
    else:
        lock.mkdir()
        (lock / "pid").write_text(str(os.getpid()) + "\n")
        owns_lock = True
    stopped = False
    deletion_attempted = False
    snapshot = None
    try:
        stopped = True
        stop()
        snapshot = inventory()
        if fingerprints(initial) != fingerprints(snapshot):
            raise ValueError("数据在部署后发生变化，请重新核对清理范围")
        plan = make_plan(snapshot, administrator, args.expect_supplier_id)
        attachments = upload(LIST_UPLOADS).decode().splitlines()
        try:
            valid_names = all(str(uuid.UUID(name)) == name for name in attachments)
        except ValueError:
            valid_names = False
        documents = {e["id"] for e in plan["remove"] if e["kind"] == "document"}
        if not valid_names or set(attachments) != documents:
            raise ValueError("附件与数据库文件清单不一致，拒绝删除")
        if attachments:
            upload("test -w /app/data/uploads && test -x /app/data/uploads")
        deletion_attempted = True
        sql(cleanup_sql(snapshot, plan))
        for index in range(0, len(attachments), 100):
            upload('set -eu; for name do rm -f -- "/app/data/uploads/$name"; done', *attachments[index:index + 100])
        if upload(LIST_UPLOADS).strip():
            raise ValueError("附件未清理完整")
        verify_preserved(inventory(), plan)
        start()
        verify_preserved(inventory(), plan, restarted=True)
        stopped = False
        print("清理完成：未创建备份，管理员密码和配置保留，上游未改动。请用原管理员重新登录。")
    except Exception:
        unchanged = not deletion_attempted
        if deletion_attempted:
            try:
                unchanged = fingerprints(inventory()) == fingerprints(snapshot)
            except Exception:
                unchanged = False
        if stopped and unchanged:
            start()
            print("删除未提交，服务已恢复。", file=sys.stderr)
        elif stopped:
            try:
                stop()
            except Exception:
                pass
            print("清理已提交或结果未确认；未创建备份。服务保持停止，请检查附件和数据库后再启动。", file=sys.stderr)
        raise
    finally:
        if owns_lock:
            (lock / "pid").unlink(missing_ok=True)
            lock.rmdir()


if __name__ == "__main__":
    try:
        main()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print("清理命令失败，请检查Docker Compose状态；未输出连接凭据。", file=sys.stderr)
        sys.exit(1)
    except (ValueError, OSError, KeyError) as error:
        print("清理停止：" + str(error), file=sys.stderr)
        sys.exit(1)
