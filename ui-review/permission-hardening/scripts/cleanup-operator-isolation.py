from pathlib import Path
import json,re,subprocess
root=Path('/Users/yukaijun/account-booster/hispread-ai');p=root/'docs/permission-hardening-operator-isolation.json';j=json.loads(p.read_text());env={}
for l in (root/'backend/.env').read_text().splitlines():
 if '=' in l and not l.startswith('#'):
  k,v=l.split('=',1);env[k]=v.strip().strip('"\'')
sid=j.get('supplierId');uid=j.get('otherUserId');name=j.get('otherUsername','')
if any(not re.fullmatch('[A-Za-z0-9-]+',x) for x in [sid,uid] if x):raise SystemExit('Unexpected identifier')
args=['psql',env['DATABASE_URL'].removeprefix('jdbc:'),'-U',env.get('DATABASE_USER','yukaijun'),'-X','-v','ON_ERROR_STOP=1','-tA'];q=['BEGIN;']
if sid:q.append(f"DELETE FROM hub_entity WHERE (kind='supplier' AND id='{sid}' AND data->>'name'='QA归属隔离供应商') OR (kind='owner-term' AND owner_id='{sid}') OR (kind='notification' AND data->>'targetPath' LIKE '%{sid}%');")
if uid:q.append(f"DELETE FROM hub_user WHERE id='{uid}' AND username='{name}'; DELETE FROM hub_login_attempt WHERE username='{name}';")
q.append('COMMIT;');r=subprocess.run(args,input='\n'.join(q),text=True,capture_output=True);r.check_returncode();r=subprocess.run(args,input=f"SELECT count(*) FROM hub_entity WHERE id='{sid}' OR owner_id='{sid}';",text=True,capture_output=True);r.check_returncode();j['cleanup']=r.stdout.strip()=='0';j['cleanupEvidence']={'remainingSupplierEntities':int(r.stdout.strip()),'temporaryUserDeleted':bool(uid)};p.write_text(json.dumps(j,ensure_ascii=False,indent=2));print(j['cleanupEvidence'])
