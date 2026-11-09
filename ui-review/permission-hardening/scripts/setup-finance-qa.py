from pathlib import Path
import json,uuid,subprocess,datetime
root=Path('/Users/yukaijun/account-booster/hispread-ai');env={}
for line in (root/'backend/.env').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  k,v=line.split('=',1);env[k]=v.strip().strip('"\'')
sid='qa-ui-'+str(uuid.uuid4());marker='permission-hardening-ui-'+sid
statement={'id':sid,'qaMarker':marker,'version':0,'supplierName':'梧桐','code':'QA-MAKER-CHECKER','state':'PENDING','currency':'USD','total':'12.50','originalTotal':'12.50','paidAmount':'0','receivedAmount':'0','reservedAmount':'0','supplierConfirmed':False,'workflowVersion':2,'periodStart':'2026-11-09','periodEnd':'2026-11-09','confirmationDeadline':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat(),'lines':[],'adjustments':[]}
args=['psql',env.get('DATABASE_URL','').removeprefix('jdbc:'),'-U',env.get('DATABASE_USER','yukaijun'),'-X','-v','ON_ERROR_STOP=1','-tA']
query="SELECT supplier_id FROM hub_user WHERE username='"+env['SEED_USERNAME'].replace("'","''")+"';"
r=subprocess.run(args,input=query,text=True,capture_output=True);r.check_returncode();owner=r.stdout.strip();statement['supplierId']=owner
quoted=json.dumps(statement,ensure_ascii=False).replace("'","''")
r=subprocess.run(args,input=f"INSERT INTO hub_entity(id,kind,owner_id,data) VALUES('{sid}','settlement','{owner}','{quoted}'::jsonb);",text=True,capture_output=True);r.check_returncode()
state={'settlementId':sid,'supplierId':owner,'marker':marker,'paymentId':None,'checkerUserId':None,'documentIds':[],'supplierConfirmedThroughRealAPI':False,'cleanup':False}
(root/'docs/permission-hardening-finance-qa-state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2))
# Minimal local PDF for upload; never a real payment credential.
pdf=root/'ui-review/permission-hardening/qa-payment-proof.pdf';pdf.write_bytes(b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')
print(json.dumps({'temporaryStatementId':sid,'state':'PENDING','owner':'seed supplier','proof':str(pdf)}))
