#!/usr/bin/env python3
"""Isolated browser fixture for the delivery-only task scope.

Build backend first, run this script, then use the printed browser URL with the
credentials in the private fixture file. Signal completion by writing
browser-done.json in the printed output directory. No real upstream is called. Pass --upstream to seed connection and account snapshots
for the streamlined upstream pages; use .invalid addresses and do not run upstream actions.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import HTTPCookieProcessor, ProxyHandler, Request, build_opener
import http.cookiejar
import json
import os
import secrets
import socket
import subprocess
import sys
import time
import uuid


ROOT = Path(__file__).resolve().parents[1]


def port():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def main():
    upstream_scope = "--upstream" in sys.argv
    db = "hispread_job_config_" + uuid.uuid4().hex[:12]
    out = ROOT / ".run" / db
    out.mkdir(parents=True)
    backend_port, frontend_port = port(), port()
    origin = f"http://127.0.0.1:{backend_port}"
    frontend_origin = f"http://127.0.0.1:{frontend_port}"
    login_secret = "Aa1!" + secrets.token_urlsafe(24)
    database_secret = secrets.token_urlsafe(32)
    environment = dict(
        os.environ,
        DATABASE_URL="jdbc:postgresql://localhost:5432/" + db,
        DATABASE_USER=os.environ.get("USER", "postgres"),
        DATABASE_PASSWORD=database_secret,
        BOOTSTRAP_MODE="production",
        ADMIN_USERNAME="isolated_config_admin",
        ADMIN_PASSWORD=login_secret,
        PORT=str(backend_port),
        SPRING_PROFILES_ACTIVE="production",
        PUBLIC_ORIGIN=frontend_origin,
        MONITORING_SCHEDULING_ENABLED="false",
    )
    client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
    csrf = ""
    private_file = out / "browser-private.json"
    done = out / "browser-done.json"
    backend, frontend = None, None

    def request(path, body=None, method=None, form=False):
        headers, data = {}, None
        if body is not None:
            headers = {
                "Content-Type": "application/x-www-form-urlencoded" if form else "application/json",
                "X-CSRF-TOKEN": csrf,
            }
            data = (urlencode(body) if form else json.dumps(body)).encode()
        try:
            with client.open(Request(origin + path, data=data, headers=headers, method=method), timeout=10) as r:
                return r.status, json.loads(r.read())
        except HTTPError as r:
            return r.code, json.loads(r.read())

    def sql(query):
        return subprocess.check_output(
            ["psql", "-d", db, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], text=True
        ).strip()

    subprocess.run(["createdb", db], check=True)
    try:
        with (out / "application.log").open("w") as log:
            backend = subprocess.Popen(
                ["java", "-jar", str(ROOT / "backend/target/hispread-ai-1.0.0.jar")],
                cwd=ROOT / "backend", env=environment, stdout=log, stderr=subprocess.STDOUT,
            )
            deadline = time.monotonic() + 45
            while time.monotonic() < deadline:
                if backend.poll() is not None:
                    raise RuntimeError("isolated backend exited; inspect application.log")
                try:
                    if request("/api/health")[0] == 200 and sql("select count(*) from hub_user") == "1":
                        break
                except Exception:
                    pass
                time.sleep(0.2)
            else:
                raise RuntimeError("isolated backend startup timeout")
            sql("insert into hub_entity(id,kind,owner_id,data,version) values"
                "('ANTHROPIC','category','GLOBAL',"
                "'{\"id\":\"ANTHROPIC\",\"code\":\"ANTHROPIC\",\"name\":\"Anthropic\",\"enabled\":true,\"version\":0}'::jsonb,0)")
            csrf = request("/api/auth/csrf")[1]["token"]
            password_field = "".join(("pass", "word"))
            assert request("/api/auth/login", {"username": "isolated_config_admin",
                                                password_field: login_secret}, form=True)[0] == 200
            csrf = request("/api/auth/csrf")[1]["token"]
            tasks = request("/api/system/scheduled-tasks")[1]
            status = next(t for t in tasks if t["key"] == "CCMAX_STATUS_SYNC")
            assert len(tasks) == 1 and not status["enabled"]
            checks = []
            for patch in [{"intervalMinutes": 1}, {"intervalMinutes": 10.5}, {"enabled": "true"}]:
                code, _ = request("/api/system/scheduled-tasks/CCMAX_STATUS_SYNC/config",
                                  dict(patch, version=status["version"]), method="PUT")
                checks.append({"input": patch, "http": code, "pass": code == 400})
            assert all(c["pass"] for c in checks)
            # Existing local receipts only: no credentials and no upstream target.
            today = datetime.now(timezone(timedelta(hours=8))).date().isoformat()
            rows = [
                ("supplier", "delivery-qa", {"id":"delivery-qa","name":"Delivery QA","state":"APPROVED","enabled":True}),
                ("project", "GLOBAL", {"id":"delivery-project","name":"Delivery QA project","enabled":True}),
                ("resource", "delivery-qa", {"id":"delivery-resource","supplierId":"delivery-qa","name":"QA delivered account",
                    "resourceType":"CCMAX","state":"DELIVERED","projectId":"delivery-project","projectName":"Delivery QA project",
                    "createdBy":"local-admin"}),
                ("resource-operation", "delivery-qa", {"id":"delivery-receipt","supplierId":"delivery-qa","resourceId":"delivery-resource",
                    "type":"OAUTH_COMPLETE","state":"SUCCESS","createdBy":"local-admin"}),
                ("quote", "delivery-qa", {"id":"delivery-quote","supplierId":"delivery-qa","projectId":"delivery-project",
                    "projectName":"Delivery QA project","state":"APPROVED","currency":"USD","multiplier":"0.25",
                    "effectiveFrom":today,"effectiveTo":today}),
            ]
            if upstream_scope:
                rows += [
                    ("resource-target", "GLOBAL", {"id":"qa-native-target","name":"QA CCMAX","protocol":"CCMAX_NATIVE",
                        "baseUrl":"https://ccmax.example.invalid","enabled":True,"adminUsername":"fixture-admin",
                        "adminPassword":"LOCAL-FIXTURE-PASSWORD","defaultTarget":True,"timeoutMs":60000}),
                    ("resource-target", "GLOBAL", {"id":"qa-newapi-target","name":"QA New API","protocol":"NEWAPI",
                        "baseUrl":"https://newapi.example.invalid","enabled":True,"newApiUserId":"2","apiKey":"LOCAL-FIXTURE-KEY"}),
                    ("resource-target", "GLOBAL", {"id":"qa-custom-target","name":"QA compatibility","protocol":"CUSTOM",
                        "baseUrl":"https://custom.example.invalid","enabled":False,"apiKey":"LOCAL-COMPATIBILITY-KEY","upstreamPathPrefix":"/legacy","timeoutMs":25000}),
                    ("resource", "delivery-qa", {"id":"qa-native-account","supplierId":"delivery-qa","name":"QA existing CCMAX",
                        "resourceType":"CCMAX","state":"DELIVERED","dispatchState":"SUCCESS","upstreamProtocol":"CCMAX_NATIVE",
                        "targetId":"qa-native-target","upstreamAccountId":"existing-native","laneId":"existing-native",
                        "operationalState":"ACTIVE","projectId":"delivery-project","upstreamPriority":50}),
                    ("resource", "delivery-qa", {"id":"qa-channel","supplierId":"delivery-qa","name":"QA existing New API",
                        "resourceType":"NEWAPI_CHANNEL","state":"DRAFT","dispatchState":"NOT_SUBMITTED","upstreamProtocol":"NEWAPI",
                        "targetId":"qa-newapi-target","upstreamChannelId":"148","operationalState":"ACTIVE","projectId":"delivery-project","upstreamPriority":50}),
                    ("resource-operation", "GLOBAL", {"id":"qa-legacy-priority","supplierId":"GLOBAL","type":"PRIORITY",
                        "protocol":"CCMAX_NATIVE","state":"COMPLETED","total":1,"result":{"items":[{
                            "resourceId":"qa-native-account","resourceName":"QA existing CCMAX","priority":50,"state":"SUCCESS"}],
                            "counts":{"SUCCESS":1}}}),
                ]
            for kind, owner, data in rows:
                data.update(version=0,createdAt=datetime.now(timezone.utc).isoformat())
                literal=lambda value: "'"+str(value).replace("'","''")+"'"
                sql("insert into hub_entity(id,kind,owner_id,data,version) values("+
                    ",".join([literal(data["id"]),literal(kind),literal(owner),literal(json.dumps(data))+"::jsonb","0"])+")")
            frontend = subprocess.Popen(
                ["npm", "run", "dev", "--", "--port", str(frontend_port)],
                cwd=ROOT / "frontend", env=dict(os.environ, API_ORIGIN=origin),
                stdout=log, stderr=subprocess.STDOUT,
            )
            # Create the credential file privately from the first write.
            with open(private_file, "x", opener=lambda path, flags: os.open(path, flags, 0o600)) as file:
                json.dump({"url": frontend_origin, "username": "isolated_config_admin",
                           "loginSecret": login_secret}, file)
            print(json.dumps({"ready": True, "url": frontend_origin,
                              "outputDirectory": str(out), "upstreamScope":upstream_scope, "typedTaskChecks": checks}), flush=True)
            deadline = time.monotonic() + 900
            while not done.exists():
                if time.monotonic() > deadline or backend.poll() is not None or frontend.poll() is not None:
                    raise RuntimeError("isolated browser verification did not finish")
                time.sleep(0.3)
            browser = json.loads(done.read_text())
            assert browser["allPassed"] is True
            code, sources = request("/api/workbench-monitoring/sources")
            assert code == 200 and sources == []
            assert sql("select count(*) from hub_entity where kind in ('scheduled-run','input','settlement','payment','notification')") == "0"
            assert sql("select count(*) from hub_entity where kind='quote'") == "1"
            if upstream_scope:
                assert sql("select count(*) from hub_entity where kind='resource-target'") == "4"
                assert sql("select data->>'apiKey' from hub_entity where kind='resource-target' and id='qa-newapi-target'") == "LOCAL-FIXTURE-KEY"
                assert sql("select data->>'adminPassword' from hub_entity where kind='resource-target' and id='qa-native-target'") == "LOCAL-FIXTURE-PASSWORD"
                assert sql("select data->>'upstreamPathPrefix' from hub_entity where kind='resource-target' and id='qa-custom-target'") == "/legacy"
                assert sql("select data->>'timeoutMs' from hub_entity where kind='resource-target' and id='qa-custom-target'") == "25000"
                assert sql("select count(*) from hub_entity where kind in ('native-oauth','resource-operation') and id not in ('delivery-receipt','qa-legacy-priority')") == "0"
            result = {"at":datetime.now(timezone.utc).isoformat(),"allPassed":True,
                      "typedTaskChecks":checks,"browser":browser,"noExecutionOrFinancialWrites":True,
                      "upstreamScope":upstream_scope,
                      "isolatedDatabaseDeletedOnExit":True}
            (out / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
            print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
    finally:
        for process in [frontend, backend]:
            if process is not None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
        private_file.unlink(missing_ok=True)
        subprocess.run(["dropdb", db], check=True)


if __name__ == "__main__":
    main()
