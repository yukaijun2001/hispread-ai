#!/usr/bin/env python3
"""Exercise the deployed same-origin login/session/role APIs without printing credentials."""
import argparse, http.cookiejar, json, time, urllib.request, urllib.parse, urllib.error
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://localhost:8088');parser.add_argument('--env-file',default='.env.production');parser.add_argument('--out',default='docs/docker-smoke.json');args=parser.parse_args()
values={}
for line in Path(args.env_file).read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key,value=line.split('=',1);value=value.strip()
        # deploy.sh emits JSON-compatible double quotes and Compose's $$ dollar escape.
        if value.startswith('"'):value=json.loads(value).replace('$$','$')
        elif value.startswith("'"):value=value[1:-1].replace("\\'", "'")
        values[key]=value
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));results=[]
def request(path,method='GET',data=None,content_type='application/json',csrf=True):
    headers={}
    if method!='GET' and csrf:
        token=request('/api/auth/csrf')[1];headers[token['headerName']]=token['token']
    if data is not None:headers['Content-Type']=content_type
    raw=urllib.parse.urlencode(data).encode() if content_type=='application/x-www-form-urlencoded' else (json.dumps(data).encode() if data is not None else None)
    req=urllib.request.Request(args.url+path,data=raw,method=method,headers=headers)
    try:
        with client.open(req,timeout=15) as response:status=response.status;body=response.read()
    except urllib.error.HTTPError as error:status=error.code;body=error.read()
    try:body=json.loads(body)
    except Exception:body={'bytes':len(body)}
    return status,body
for endpoint in ['/healthz','/api/health/live','/api/health/ready']:
    status,body=request(endpoint);assert status==200,(endpoint,status);results.append({'path':endpoint,'status':status})
status,_=request('/api/workbench');assert status==401
status,_=request('/api/auth/login','POST',{'username':values['ADMIN_USERNAME'],'password':values['ADMIN_PASSWORD']},'application/x-www-form-urlencoded');assert status==200
status,me=request('/api/auth/me');assert status==200 and me['role']=='ADMIN' and me.get('supplierId') is None
for endpoint in ['/api/system/roles','/api/system/settings','/api/workbench','/api/projects?size=100','/api/system/users','/api/system/api-routes']:
    status,body=request(endpoint);assert status==200,(endpoint,status);results.append({'path':endpoint,'status':status,'shape':type(body).__name__})
status,_=request('/api/auth/profile','PUT',{'displayName':'must-not-write'},csrf=False);assert status==403
status,_=request('/api/auth/csrf');assert status==200
out={'url':args.url,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'results':results,'authenticatedRole':me['role'],'csrfEnforced':True,'cookieCount':len(jar),'secretsPrinted':False}
Path(args.out).parent.mkdir(parents=True,exist_ok=True);Path(args.out).write_text(json.dumps(out,indent=2));print(json.dumps({'healthy':True,'role':'ADMIN','checks':len(results),'csrfEnforced':True}))
