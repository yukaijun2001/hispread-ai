import json,subprocess,re,os
from pathlib import Path
root=Path('/Users/yukaijun/account-booster/hispread-ai');report_path=root/'docs/five-role-account-review-qa.json';j=json.loads(report_path.read_text());identifier=j.get('tempAccountId')
if not identifier:raise SystemExit('No temporary account was created')
if not re.fullmatch(r'[A-Za-z0-9-]{10,100}',identifier):raise SystemExit('Unexpected temporary account identifier')
env={}
for line in (root/'backend/.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);env[k]=v.strip().strip('"\'')
database=env.get('DATABASE_URL','').removeprefix('jdbc:')
connection_env=os.environ.copy();connection_env['PGPASSWORD']=env.get('DATABASE_PASSWORD','')
args=['psql',database,'-U',env.get('DATABASE_USER','yukaijun'),'-X','-v','ON_ERROR_STOP=1','-tA']
query="""BEGIN;
SELECT count(*) FROM hub_entity WHERE id='{id}' AND kind IN ('account','account-secret');
DELETE FROM hub_entity WHERE kind='account-secret' AND id='{id}' AND EXISTS (SELECT 1 FROM hub_entity a WHERE a.kind='account' AND a.id='{id}' AND a.data->>'qaMarker'='operator-finance-ui-account-review');
DELETE FROM hub_entity WHERE kind='account' AND id='{id}' AND data->>'qaMarker'='operator-finance-ui-account-review';
SELECT count(*) FROM hub_entity WHERE id='{id}' AND kind IN ('account','account-secret');
COMMIT;""".format(id=identifier)
r=subprocess.run(args,input=query,text=True,capture_output=True,env=connection_env)
if r.returncode:raise SystemExit(r.stderr)
lines=[s.strip() for s in r.stdout.splitlines() if s.strip()]
j['cleanup']=lines[-2]=='0';j['cleanupEvidence']={'rowsBefore':int(lines[1]),'rowsAfter':int(lines[-2]),'removedKinds':['account','account-secret'],'scope':'exact temporary ID plus qaMarker guard'}
report_path.write_text(json.dumps(j,ensure_ascii=False,indent=2));print(json.dumps(j['cleanupEvidence']))
