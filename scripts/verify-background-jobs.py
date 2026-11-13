#!/usr/bin/env python3
"""Isolated HTTP/browser acceptance; never connects to production integrations."""
from pathlib import Path
from urllib.request import Request, build_opener, HTTPCookieProcessor, ProxyHandler
from urllib.error import HTTPError
from urllib.parse import urlencode
import http.cookiejar
import json
import os
import secrets
import socket
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".run/background-jobs-followup"
OUT.mkdir(parents=True, exist_ok=True)
DB = "hispread_jobs_" + uuid.uuid4().hex[:12]


def port():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def sql(query):
    return subprocess.check_output(
        ["psql", "-d", DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], text=True
    ).strip()


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def seed(kind, owner, data):
    data = dict(data, version=0)
    sql("insert into hub_entity(id,kind,owner_id,data,version) values(" + ",".join([
        literal(data["id"]), literal(kind), literal(owner), literal(json.dumps(data)) + "::jsonb", "0"
    ]) + ")")


def main():
    backend_port, frontend_port = port(), port()
    secret = "Aa1!" + secrets.token_urlsafe(24)
    env = dict(os.environ, DATABASE_URL="jdbc:postgresql://localhost:5432/" + DB,
               PORT=str(backend_port), BOOTSTRAP_MODE="production",
               ADMIN_USERNAME="isolated_jobs_admin", ADMIN_PASSWORD=secret,
               MONITORING_SCHEDULING_ENABLED="false", SPRING_PROFILES_ACTIVE="test")
    env.setdefault("DATABASE_USER", os.environ.get("USER", "postgres"))
    client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
    csrf = ""
    backend, frontend, log = None, None, None
    config = OUT / "browser-private.json"
    done = OUT / "browser-done.json"

    def request(path, body=None, method=None, form=False):
        headers, data = {}, None
        if body is not None:
            headers = {"Content-Type": "application/x-www-form-urlencoded" if form else "application/json",
                       "X-CSRF-TOKEN": csrf}
            data = (urlencode(body) if form else json.dumps(body)).encode()
        try:
            with client.open(Request(f"http://127.0.0.1:{backend_port}" + path,
                                     data=data, headers=headers, method=method), timeout=20) as response:
                return response.status, json.loads(response.read())
        except HTTPError as response:
            return response.code, json.loads(response.read())

    try:
        if done.exists():
            done.unlink()
        subprocess.run(["createdb", DB], check=True)
        log = (OUT / "application.log").open("w")
        backend = subprocess.Popen(["java", "-jar", str(ROOT / "backend/target/hispread-ai-1.0.0.jar")],
                                   cwd=ROOT / "backend", env=env, stdout=log, stderr=subprocess.STDOUT)
        deadline = time.monotonic() + 35
        while time.monotonic() < deadline:
            if backend.poll() is not None:
                raise RuntimeError("isolated backend exited")
            try:
                if request("/api/health")[0] == 200 and sql("select count(*) from hub_user") == "1":
                    break
            except Exception:
                pass
            time.sleep(.2)
        else:
            raise RuntimeError("isolated startup timeout")
        csrf = request("/api/auth/csrf")[1]["token"]
        assert request("/api/auth/login", {"username": "isolated_jobs_admin", "password": secret}, form=True)[0] == 200
        csrf = request("/api/auth/csrf")[1]["token"]
        seed("resource-target", "GLOBAL", {"id": "jobs-qa-target", "name": "Isolated target", "protocol": "CCMAX_NATIVE",
                                          "baseUrl": "https://example.invalid", "enabled": False})
        daily = next(t for t in request("/api/system/scheduled-tasks")[1] if t["key"] == "CCMAX_DAILY_SYNC")
        assert request("/api/system/scheduled-tasks/CCMAX_DAILY_SYNC/config",
                       {"targetId": "jobs-qa-target", "version": daily["version"]}, method="PUT")[0] == 200
        from datetime import datetime, timedelta, timezone
        today = datetime.now(timezone(timedelta(hours=8))).date()
        seed("supplier", "jobs-owner", {"id": "jobs-owner", "name": "Isolated supplier", "state": "APPROVED", "enabled": True})
        seed("project", "GLOBAL", {"id": "jobs-project", "name": "Isolated project", "enabled": True})
        seed("quote", "jobs-owner", {"id": "jobs-quote", "code": "QA-RENEW", "supplierId": "jobs-owner",
             "supplierName": "Isolated supplier", "projectId": "jobs-project", "projectName": "Isolated project",
             "state": "APPROVED", "effectiveFrom": str(today - timedelta(days=5)), "effectiveTo": str(today),
             "currency": "USD", "pricingType": "DISCOUNT", "multiplier": "0.25"})
        seed("settlement", "jobs-owner", {"id": "jobs-deadline", "supplierId": "jobs-owner", "state": "PENDING",
             "sourceChanged": False, "confirmationDeadline": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),
             "total": "12", "paidAmount": "0", "currency": "USD"})
        code, run = request("/api/system/scheduled-tasks/SETTLEMENT_AUTO_CONFIRM/run", {}, method="POST")
        assert code == 200 and run["processedCount"] == 1
        code, replay = request("/api/system/scheduled-tasks/SETTLEMENT_AUTO_CONFIRM/run", {}, method="POST")
        assert code == 200 and replay["processedCount"] == 0
        frontend = subprocess.Popen(["npm", "run", "dev", "--", "--port", str(frontend_port)],
                                    cwd=ROOT / "frontend", env=dict(os.environ, API_ORIGIN=f"http://127.0.0.1:{backend_port}"),
                                    stdout=log, stderr=subprocess.STDOUT)
        config.write_text(json.dumps({"url": f"http://127.0.0.1:{frontend_port}", "username": "isolated_jobs_admin",
                                      "loginSecret": secret, "backendPort": backend_port}))
        config.chmod(0o600)
        print(json.dumps({"ready": True, "frontendPort": frontend_port, "deadlinePositive": True, "deadlineReplay": True}), flush=True)
        deadline = time.monotonic() + 1200
        while not done.exists():
            if time.monotonic() > deadline:
                raise RuntimeError("browser acceptance timed out")
            time.sleep(.3)
        result = json.loads(done.read_text())
        result.update(deadlinePositive=True, deadlineReplay=True)
        (OUT / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(json.dumps(result, ensure_ascii=False), flush=True)
    finally:
        for process in (frontend, backend):
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
        if log:
            log.close()
        if config.exists():
            config.unlink()
        subprocess.run(["dropdb", "--if-exists", DB], check=False)


if __name__ == "__main__":
    main()
