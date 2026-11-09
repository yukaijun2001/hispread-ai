from pathlib import Path
import json,subprocess,re,os
root=Path('/Users/yukaijun/account-booster/hispread-ai');state_path=root/'docs/permission-hardening-finance-qa-state.json';state=json.loads(state_path.read_text());env={}
for line in (root/'backend/.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);env[k]=v.strip().strip('"\'')
sid=state['settlementId'];uid=state.get('checkerUserId');pid=state.get('paymentId');ids=[sid]+([uid] if uid else [])+([pid] if pid else [])
if any(not re.fullmatch('[A-Za-z0-9-]+',x) for x in ids):raise SystemExit('Unexpected QA identifier')
args=['psql',env['DATABASE_URL'].removeprefix('jdbc:'),'-U',env.get('DATABASE_USER','yukaijun'),'-X','-v','ON_ERROR_STOP=1','-tA']
# Resolve every uploaded document attached to only this temporary statement's payment.
query=f"SELECT id FROM hub_entity WHERE kind='payment' AND data->>'settlementId'='{sid}';"
r=subprocess.run(args,input=query,text=True,capture_output=True);r.check_returncode();payment_ids=[x.strip() for x in r.stdout.splitlines() if x.strip()]
query=f"SELECT DISTINCT jsonb_array_elements_text(data->'evidenceIds') FROM hub_entity WHERE kind='payment' AND data->>'settlementId'='{sid}';"
r=subprocess.run(args,input=query,text=True,capture_output=True);r.check_returncode();docs=sorted(set(state.get('documentIds',[])+[x.strip() for x in r.stdout.splitlines() if x.strip()]))
for doc in docs:
 if not re.fullmatch('[A-Za-z0-9-]+',doc):raise SystemExit('Unexpected document id')
q=['BEGIN;']
for doc in docs:q.append(f"DELETE FROM hub_entity WHERE kind='document' AND id='{doc}' AND data->>'category'='PAYMENT_PROOF';")
q.append(f"DELETE FROM hub_entity WHERE kind='payment' AND data->>'settlementId'='{sid}';")
q.append(f"DELETE FROM hub_entity WHERE kind='settlement' AND id='{sid}' AND data->>'qaMarker'='{state['marker']}';")
if uid:
 q.append(f"DELETE FROM hub_entity WHERE owner_id='{uid}' AND kind IN('notification','api-token','export');")
 q.append(f"DELETE FROM hub_user WHERE id='{uid}' AND username LIKE 'qa_fin_%';")
 q.append(f"DELETE FROM hub_login_attempt WHERE username='{state.get('checkerUsername','')}';")
q.append('COMMIT;')
r=subprocess.run(args,input='\n'.join(q),text=True,capture_output=True);r.check_returncode()
for doc in docs:
 file=root/'backend/data/uploads'/doc
 if file.is_file():file.unlink()
verify=f"SELECT count(*) FROM hub_entity WHERE id='{sid}' OR (kind='payment' AND data->>'settlementId'='{sid}')"+(f" OR id IN ({','.join(chr(39)+x+chr(39) for x in docs)})" if docs else '')+';'
r=subprocess.run(args,input=verify,text=True,capture_output=True);r.check_returncode();remaining=int(r.stdout.strip());state['cleanup']=remaining==0;state['cleanupEvidence']={'remainingEntities':remaining,'temporaryPaymentIds':payment_ids,'documentsDeleted':docs,'checkerUserDeleted':bool(uid),'filesRemoved':True};state_path.write_text(json.dumps(state,ensure_ascii=False,indent=2))
report_path=root/'docs/permission-hardening-finance-browser-qa.json';report=json.loads(report_path.read_text());report['cleanup']=state['cleanup'];report['cleanupEvidence']=state['cleanupEvidence'];report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(state['cleanupEvidence']))
