#!/usr/bin/env python3
"""Opt-in isolated acceptance: requires local PostgreSQL + packaged Java application.

Never points to the deployed service. Fake OAuth codes stay inside two localhost processes.
All temporary databases, credentials and application processes are removed on exit.
"""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, build_opener, ProxyHandler, HTTPCookieProcessor
from urllib.error import HTTPError
from urllib.parse import urlencode
import argparse
import http.cookiejar
import json
import os
import secrets
import socket
import subprocess
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".run/intake-policy-acceptance"
OUT.mkdir(parents=True, exist_ok=True)
DB = "hispread_intake_" + uuid.uuid4().hex[:16]
ACCOUNT = {"id": "existing-fixture", "status": "disabled", "weight": 10,
           "subscription_info": {"plan": "max"}, "health_status": "healthy"}
COUNTS = {"exchange": 0, "activation": 0, "reads": 0}
BLOCKED, RELEASE = threading.Event(), threading.Event()
STAGE = ""


class Native(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def body(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or "{}")

    def do_POST(self):
        value = self.body()
        if self.path == "/api/auth/admin-login":
            self.reply(200, {"access_token": "LOCAL-FIXTURE-SESSION", "user": {"role": "admin"}})
        elif self.path == "/api/admin/oauth-accounts/exchange":
            COUNTS["exchange"] += 1
            assert value["status"] == "disabled"
            ACCOUNT.update(status=value["status"], weight=value["weight"])
            if STAGE == "exchange":
                BLOCKED.set()
                RELEASE.wait(25)
            self.reply(200, {"id": ACCOUNT["id"], "overwritten": False})
        else:
            self.reply(404, {})

    def do_PATCH(self):
        value = self.body()
        if self.path != "/api/admin/oauth-accounts/" + ACCOUNT["id"]:
            self.reply(404, {})
            return
        ACCOUNT.update(value)
        COUNTS["activation"] += 1
        if STAGE == "activation":
            BLOCKED.set()
            RELEASE.wait(25)
        self.reply(200, {"ok": True})

    def do_GET(self):
        COUNTS["reads"] += 1
        if self.path == "/api/admin/oauth-accounts/" + ACCOUNT["id"]:
            self.reply(200, {"account": ACCOUNT})
        elif self.path.startswith("/api/admin/oauth-accounts?"):
            self.reply(200, {"accounts": [], "pagination": {"total_rows": 0, "total_pages": 1}})
        elif self.path.startswith("/api/admin/request-logs"):
            self.reply(200, {"logs": [], "cursor": None})
        else:
            self.reply(404, {})


def sql(query):
    return subprocess.check_output(["psql", "-d", DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], text=True).strip()


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def seed(kind, owner, data):
    data = dict(data, version=0)
    sql("insert into hub_entity(id,kind,owner_id,data,version) values(" + ",".join([
        literal(data["id"]), literal(kind), literal(owner), literal(json.dumps(data)) + "::jsonb", "0"]) + ")")


def record(kind, id):
    return json.loads(sql("select data::text from hub_entity where kind=" + literal(kind) + " and id=" + literal(id)))


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    global STAGE
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=["exchange", "activation"], default="activation")
    parser.add_argument("--browser-check", action="store_true")
    args = parser.parse_args()
    STAGE = args.stage
    port = free_port()
    upstream = ThreadingHTTPServer(("127.0.0.1", 0), Native)
    upstream.daemon_threads = True
    threading.Thread(target=upstream.serve_forever, daemon=True).start()
    jar = ROOT / "backend/target/hispread-ai-1.0.0.jar"
    if not jar.exists():
        raise SystemExit("Run Java 17 mvn package first")
    secret = "Aa1!" + secrets.token_urlsafe(24)
    env = dict(os.environ, DATABASE_URL="jdbc:postgresql://localhost:5432/" + DB,
               PORT=str(port), BOOTSTRAP_MODE="production", ADMIN_USERNAME="isolated_intake_admin",
               ADMIN_PASSWORD=secret, INTEGRATION_ALLOW_PRIVATE_TARGETS="true",
               SPRING_PROFILES_ACTIVE="test", MONITORING_SCHEDULING_ENABLED="false")
    env.setdefault("DATABASE_USER", os.environ.get("USER", "postgres"))
    cookies = http.cookiejar.CookieJar()
    client = build_opener(ProxyHandler({}), HTTPCookieProcessor(cookies))
    csrf = ""
    backend, log = None, None
    created = False
    browser_config = OUT / "browser-private.json"
    browser_done = OUT / "browser-done.json"

    def request(path, body=None, form=False, method=None):
        headers, data = {}, None
        if body is not None:
            headers = {"Content-Type": "application/x-www-form-urlencoded" if form else "application/json", "X-CSRF-TOKEN": csrf}
            data = (urlencode(body) if form else json.dumps(body)).encode()
        req = Request(f"http://127.0.0.1:{port}" + path, data=data, headers=headers, method=method)
        try:
            with client.open(req, timeout=15) as response:
                return response.status, json.loads(response.read())
        except HTTPError as response:
            return response.code, json.loads(response.read())

    def start():
        nonlocal backend, log
        log = (OUT / ("packaged-" + args.stage + ".log")).open("a")
        backend = subprocess.Popen(["java", "-jar", str(jar)], cwd=ROOT / "backend", env=env, stdout=log, stderr=subprocess.STDOUT)
        until = time.monotonic() + 25
        while time.monotonic() < until:
            if backend.poll() is not None:
                raise RuntimeError("isolated application exited")
            try:
                if request("/api/health")[0] == 200 and sql("select count(*) from hub_user where username='isolated_intake_admin'") == "1":
                    return
            except Exception:
                pass
            time.sleep(.15)
        raise RuntimeError("isolated startup timeout")

    def stop(crash=False):
        nonlocal backend, log
        if backend and backend.poll() is None:
            backend.kill() if crash else backend.terminate()
            backend.wait(timeout=10)
        backend = None
        if log:
            log.close()

    def draft(rid):
        seed("resource", "fixture-owner", {"id": rid, "supplierId": "fixture-owner", "createdBy": "local-admin",
             "name": "额度验收现有测试资源", "resourceType": "CCMAX", "state": "DRAFT", "dispatchState": "NOT_SUBMITTED", "targetId": "fixture-target"})
        seed("native-oauth", "GLOBAL", {"id": rid + "-session", "targetId": "fixture-target", "localResourceId": rid,
             "state": "READY", "pendingState": "local-state", "expiresAt": "2099-01-01T00:00:00Z", "accountId": "", "existingAccountIds": []})
        seed("resource-operation", "fixture-owner", {"id": rid + "-auth", "supplierId": "fixture-owner", "resourceId": rid,
             "targetId": "fixture-target", "type": "OAUTH_AUTHORIZE", "protocol": "CCMAX_NATIVE", "upstreamId": rid + "-session", "state": "READY"})

    try:
        subprocess.run(["createdb", DB], check=True); created = True
        start()
        csrf = request("/api/auth/csrf")[1]["token"]
        assert request("/api/auth/login", {"username": "isolated_intake_admin", "password": secret}, form=True)[0] == 200
        csrf = request("/api/auth/csrf")[1]["token"]
        seed("supplier", "fixture-owner", {"id": "fixture-owner", "supplierId": "fixture-owner", "name": "隔离额度验收供应商", "state": "APPROVED", "enabled": True})
        seed("supplier-settings", "GLOBAL", {"id": "fixture-owner", "allowCcmax": True, "allowPro": True})
        seed("settings", "GLOBAL", {"id": "fixture-settings", "ccmaxIntakeConcurrencyLimit": 10, "ccmaxCreationTimeoutSeconds": 120})
        seed("resource-target", "GLOBAL", {"id": "fixture-target", "name": "本地隔离原生上游", "protocol": "CCMAX_NATIVE",
             "baseUrl": f"http://127.0.0.1:{upstream.server_port}", "adminUsername": "fixture", "adminPassword": "LOCAL-ONLY-PRIVATE",
             "enabled": True, "allowHttp": True, "timeoutMs": 15000})
        seed("intake-policy", "GLOBAL", {"id": "fixture-owner", "policy": {"nonProOpen": True, "tier": "NORMAL",
             "pro": {"mode": "LIMITED", "quantity": 2}, "nonPro": {"mode": "LIMITED", "quantity": 1}, "ranges": {"NORMAL": {"min": 37, "max": 37}}}})
        draft("first-resource"); draft("second-resource")
        payload = {"sessionId": "first-resource-auth", "code": "local-fixture-code#local-state"}
        initial = {}
        def send():
            try:
                initial["http"] = request("/api/resources/oauth/supplier-submit", payload)[0]
            except Exception as error:
                initial["connectionLost"] = type(error).__name__
        writer = threading.Thread(target=send, daemon=True); writer.start()
        assert BLOCKED.wait(15), "upstream did not reach fault boundary"
        stop(crash=True); writer.join(timeout=3)
        RELEASE.set()
        quota = json.loads(sql("select data::text from hub_entity where kind='intake-ledger'"))
        assert quota["state"] == ("CLASSIFIED" if args.stage == "activation" else "RESERVED")
        start()
        denied_http, denied = request("/api/resources/oauth/supplier-submit", {"sessionId": "second-resource-auth", "code": "other#local-state"})
        assert denied_http == 409 and denied.get("code") == "CCMAX_INTAKE_QUOTA_EXHAUSTED", (denied_http, denied)
        assert record("native-oauth", "second-resource-session")["state"] == "READY"
        replay_http, replay = request("/api/resources/oauth/supplier-submit", payload)
        assert replay_http == 200 and replay["state"] == "UNKNOWN"
        op_id = quota["id"]
        recovered_http, recovered = request("/api/resources/first-resource/operations/" + op_id + "/reconcile", {})
        expected = "SUCCESS" if args.stage == "activation" else "UNKNOWN"
        assert recovered_http == 200 and recovered["state"] == expected, (recovered_http, recovered)
        assert COUNTS["exchange"] == 1
        assert COUNTS["activation"] == (1 if args.stage == "activation" else 0)
        final = record("intake-ledger", op_id)
        report = {"fixtureOnly": True, "stage": args.stage, "backendKilled": True, "reservationBeforeRestart": quota["state"],
             "reservationAfterRestart": final["state"], "secondAdmissionHttp": denied_http, "secondAdmissionCode": denied["code"],
             "replayState": replay["state"], "recoveredState": recovered["state"], "exchanges": COUNTS["exchange"],
             "activations": COUNTS["activation"], "priority": ACCOUNT["weight"], "passed": True}
        (OUT / ("packaged-" + args.stage + "-result.json")).write_text(json.dumps(report, indent=2))
        print(json.dumps(report, indent=2), flush=True)
        if args.browser_check:
            # Only local role/profile data is changed for UI rendering; upstream is already stable.
            sql("update hub_user set supplier_id='fixture-owner',profile=profile || "
                "jsonb_build_object('supplierId','fixture-owner','role','SUPPLIER','permissions',"
                "(select data->'permissions' from hub_entity where kind='role' and id='SUPPLIER')) where id='local-admin'")
            seed("agent", "fixture-owner", {"id": "fixture-member", "supplierId": "fixture-owner", "username": "fixture_member", "displayName": "隔离验收成员", "enabled": False})
            seed("group", "fixture-owner", {"id": "fixture-group", "name": "隔离验收组", "allowPro": True, "memberIds": ["fixture-member"]})
            browser_config.write_text(json.dumps({"username": "isolated_intake_admin", "loginSecret": secret, "backendPort": port}))
            browser_config.chmod(0o600)
            print("Local browser checkpoint ready", flush=True)
            until = time.monotonic() + 600
            while not browser_done.exists():
                if time.monotonic() > until:
                    raise RuntimeError("local browser checkpoint timed out")
                time.sleep(.2)
    finally:
        RELEASE.set(); stop(); upstream.shutdown(); upstream.server_close()
        for path in [browser_config, browser_done]:
            path.unlink(missing_ok=True)
        if created:
            subprocess.run(["dropdb", DB], check=True)


if __name__ == "__main__":
    main()
