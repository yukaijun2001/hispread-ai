#!/usr/bin/env python3
"""Verify PostgreSQL servlet sessions survive backend replacement in the Compose deployment."""
import http.cookiejar,json,subprocess,time,urllib.request,urllib.parse,urllib.error,os
from pathlib import Path
env_path=Path(os.environ.get('ENV_FILE','.env.production'));values=dict(line.split('=',1) for line in env_path.read_text().splitlines() if '=' in line and not line.startswith('#'))
base=values.get('PUBLIC_ORIGIN','http://localhost:8088');jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path,data=None):
    with opener.open(urllib.request.Request(base+path,data=data[0] if data else None,headers=data[1] if data else {}),timeout=10) as r:return json.load(r)
token=call('/api/auth/csrf');body=urllib.parse.urlencode({'username':values['ADMIN_USERNAME'],'password':values['ADMIN_PASSWORD']}).encode();call('/api/auth/login',(body,{'Content-Type':'application/x-www-form-urlencoded',token['headerName']:token['token']}));before=call('/api/auth/me')
subprocess.run(['docker','compose','--env-file',str(env_path),'restart','backend'],check=True)
for _ in range(40):
    try:
        if call('/api/health/ready')['status']=='UP':break
    except Exception:pass
    time.sleep(1)
after=call('/api/auth/me');assert before['id']==after['id'];out={'sessionSurvivedBackendRestart':True,'role':after['role'],'secretsPrinted':False};Path('docs/docker-session-persistence.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
