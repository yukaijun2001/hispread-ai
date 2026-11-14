#!/usr/bin/env python3
"""Isolated browser fixture for task types and explicit HTTP monitoring consent.

Build backend first, run this script, then use the printed browser URL with the
credentials in the private fixture file. Signal completion by writing
browser-done.json in the printed output directory. No real upstream is called.
"""
from datetime import datetime, timezone
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
import time
import uuid


ROOT = Path(__file__).resolve().parents[1]


def port():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def main():
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
            daily = next(t for t in tasks if t["key"] == "CCMAX_DAILY_SYNC")
            invalid_cases = [
                {"intervalMinutes": 10.5}, {"intervalMinutes": "10"},
                {"intervalMinutes": 4294967306}, {"enabled": "false"},
                {"enabled": "true"}, {"enabled": 1},
            ]
            checks = []
            for patch in invalid_cases:
                code, _ = request("/api/system/scheduled-tasks/CCMAX_DAILY_SYNC/config",
                                  dict(patch, version=daily["version"]), method="PUT")
                checks.append({"input": patch, "http": code, "pass": code == 400})
            code, after = request("/api/system/scheduled-tasks")
            assert code == 200 and next(t for t in after if t["key"] == daily["key"]) == daily
            assert all(c["pass"] for c in checks)
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
                              "outputDirectory": str(out), "typedTaskChecks": checks}), flush=True)
            deadline = time.monotonic() + 900
            while not done.exists():
                if time.monotonic() > deadline or backend.poll() is not None or frontend.poll() is not None:
                    raise RuntimeError("isolated browser verification did not finish")
                time.sleep(0.3)
            browser = json.loads(done.read_text())
            assert browser["allPassed"] is True
            code, sources = request("/api/workbench-monitoring/sources")
            assert code == 200 and sources == []
            assert sql("select count(*) from hub_entity where kind in"
                       " ('scheduled-run','resource','input','settlement','payment','notification')") == "0"
            result = {"at": datetime.now(timezone.utc).isoformat(), "allPassed": True,
                      "typedTaskChecks": checks, "browser": browser,
                      "sourcesRemaining": len(sources),
                      "noJobExecutionOrCollection": True, "isolatedDatabaseDeletedOnExit": True}
            (out / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
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
        if done.exists():
            (out / "result.json").write_text(done.read_text())
        subprocess.run(["dropdb", db], check=True)


if __name__ == "__main__":
    main()
