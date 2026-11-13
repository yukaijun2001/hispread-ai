#!/usr/bin/env python3
"""Kill an isolated backend after a CUSTOM priority write, then verify restoration."""
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, build_opener, ProxyHandler, HTTPCookieProcessor
import http.cookiejar
import importlib.util
import json
import os
import secrets
import subprocess
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("jobs_fixture", ROOT / "scripts/verify-background-jobs.py")
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
OUT = fixture.OUT
entered, release = threading.Event(), threading.Event()
state = {"priority": 70, "writes": [], "block": True}


class Upstream(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        if self.path == "/api/jobs/ccmax/priority/read":
            result = {"state": "SUCCESS", "priorities": [{"resourceId": "rotation-resource",
                      "supplierId": "rotation-owner", "priority": state["priority"]}]}
        elif self.path == "/api/resources/rotation-resource/priority":
            state["priority"] = body["priority"]
            state["writes"].append({"priority": body["priority"], "key": self.headers.get("Idempotency-Key")})
            if state["block"]:
                entered.set()
                release.wait(30)
            result = {"state": "SUCCESS", "resourceId": "rotation-resource",
                      "supplierId": "rotation-owner", "priority": state["priority"]}
        else:
            self.send_error(404)
            return
        raw = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass


def main():
    port = fixture.port()
    server = ThreadingHTTPServer(("127.0.0.1", 0), Upstream)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    secret = "Aa1!" + secrets.token_urlsafe(24)
    env = dict(os.environ, DATABASE_URL="jdbc:postgresql://localhost:5432/" + fixture.DB,
               PORT=str(port), BOOTSTRAP_MODE="production", ADMIN_USERNAME="rotation_qa_admin",
               ADMIN_PASSWORD=secret, SPRING_PROFILES_ACTIVE="test",
               INTEGRATION_ALLOW_PRIVATE_TARGETS="true", MONITORING_SCHEDULING_ENABLED="false")
    env.setdefault("DATABASE_USER", os.environ.get("USER", "postgres"))
    cookies = http.cookiejar.CookieJar()
    client = build_opener(ProxyHandler({}), HTTPCookieProcessor(cookies))
    csrf = ""
    backend, log = None, None

    def request(path, body=None, method=None, form=False):
        headers, data = {}, None
        if body is not None:
            headers = {"Content-Type": "application/x-www-form-urlencoded" if form else "application/json", "X-CSRF-TOKEN": csrf}
            data = (urlencode(body) if form else json.dumps(body)).encode()
        try:
            with client.open(Request(f"http://127.0.0.1:{port}" + path, data=data,
                                     headers=headers, method=method), timeout=25) as response:
                return response.status, json.loads(response.read())
        except HTTPError as response:
            return response.code, json.loads(response.read())

    def start():
        nonlocal backend, log
        log = (OUT / "rotation-restart.log").open("a")
        backend = subprocess.Popen(["java", "-jar", str(ROOT / "backend/target/hispread-ai-1.0.0.jar")],
                                   cwd=ROOT / "backend", env=env, stdout=log, stderr=subprocess.STDOUT)
        until = time.monotonic() + 30
        while time.monotonic() < until:
            if backend.poll() is not None:
                raise RuntimeError("isolated backend exited")
            try:
                if request("/api/health")[0] == 200 and fixture.sql("select count(*) from hub_user") == "1":
                    return
            except Exception:
                pass
            time.sleep(.2)
        raise RuntimeError("startup timeout")

    def stop(crash=False):
        nonlocal backend, log
        if backend and backend.poll() is None:
            backend.kill() if crash else backend.terminate()
            backend.wait(timeout=15)
        backend = None
        if log:
            log.close()
            log = None

    try:
        subprocess.run(["createdb", fixture.DB], check=True)
        start()
        csrf = request("/api/auth/csrf")[1]["token"]
        assert request("/api/auth/login", {"username": "rotation_qa_admin", "password": secret}, form=True)[0] == 200
        csrf = request("/api/auth/csrf")[1]["token"]
        fixture.seed("resource-target", "GLOBAL", {"id": "rotation-target", "name": "CUSTOM local fixture",
                     "protocol": "CUSTOM", "baseUrl": f"http://127.0.0.1:{server.server_port}", "enabled": True, "allowHttp": True})
        fixture.seed("supplier", "rotation-owner", {"id": "rotation-owner", "name": "Isolated supplier", "enabled": True, "state": "APPROVED"})
        fixture.seed("resource", "rotation-owner", {"id": "rotation-resource", "supplierId": "rotation-owner",
                     "resourceType": "CCMAX", "state": "DELIVERED", "operationalState": "READY",
                     "targetId": "rotation-target", "priority": 70})
        code, task = request("/api/system/scheduled-tasks/priority-support", {"name": "Crash recovery fixture", "intervalMinutes": 10,
            "settings": {"mode": "ROTATION", "scope": "SELECTED", "supplierIds": ["rotation-owner"],
                         "basisPoints": 10000, "maxAccounts": 1, "priority": 10, "tiers": []}})
        assert code == 200
        key = task["id"]
        path = "/api/system/scheduled-tasks/" + key
        pool = ThreadPoolExecutor(max_workers=1)
        sending = pool.submit(request, path + "/run", {}, "POST")
        assert entered.wait(15), "did not reach post-write crash boundary"
        assert request(path + "/run", {}, "POST")[0] == 409
        assert request(path + "/config", {"name": "Blocked"}, "PUT")[0] == 409
        assert request(path + "/rotation-settings/retry-restore", {}, "POST")[0] == 409
        stop(crash=True)
        try:
            sending.result(timeout=3)
        except Exception:
            pass
        pool.shutdown(wait=False)
        state["block"] = False
        release.set()
        saved = json.loads(fixture.sql("select data::text from hub_entity where kind='priority-round'"))
        assert saved["state"] == "BOOSTING" and saved["items"][0]["originalPriority"] == 70
        assert state["priority"] == 10
        start()
        assert request("/api/auth/me")[0] == 200
        code, restored = request(path + "/rotation-settings/retry-restore", {}, "POST")
        assert code == 200 and restored["restored"] == 1 and state["priority"] == 70
        assert request(path + "/rotation-settings/retry-restore", {}, "POST")[1]["restored"] == 0
        code, next_run = request(path + "/run", {}, "POST")
        assert code == 200 and next_run["state"] == "SUCCESS"
        current = next(t for t in request("/api/system/scheduled-tasks")[1] if t["key"] == key)
        assert request(path + "/config", {"enabled": False, "version": current["version"]}, "PUT")[0] == 200
        assert state["priority"] == 70
        code, history = request(path + "/runs?page=1&size=20")
        assert code == 200 and any(r["state"] == "TIMED_OUT" and r["resultCode"] == "LEASE_LOST" for r in history["items"])
        assert [item["priority"] for item in state["writes"]] == [10, 70, 10, 70]
        assert len({item["key"] for item in state["writes"]}) == 4
        result = {"fixtureOnly": True, "passed": True, "crashAfterAppliedBoost": True,
                  "committedOriginalPriority": 70, "writes": [item["priority"] for item in state["writes"]],
                  "sessionSurvivedRestart": True, "concurrentRunConfigRestoreRejected": True,
                  "restoreRetryIdempotent": True, "abandonedRunMarkedTimedOut": True, "finalPriority": state["priority"]}
        (OUT / "rotation-restart-result.json").write_text(json.dumps(result, indent=2))
        print(json.dumps(result), flush=True)
    finally:
        release.set()
        stop()
        server.shutdown()
        server.server_close()
        subprocess.run(["dropdb", "--if-exists", fixture.DB], check=False)


if __name__ == "__main__":
    main()
