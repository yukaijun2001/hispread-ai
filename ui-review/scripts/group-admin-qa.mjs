/** Local reversible group-admin role test. Never contacts the production page. */
const fs=await import('node:fs/promises');
const root='/Users/yukaijun/account-booster/hispread-ai';
const text=await fs.readFile(root+'/backend/.env','utf8');
const env=Object.fromEntries(text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1).replace(/^(["'])(.*)\1$/,'$2')]}));
const task=await taskSpace(1),page=task.page('p2'),base='http://127.0.0.1:5173';
async function request(path,method='GET',body){return page.evaluate(async({path,method,body})=>{
 const headers={};if(method!=='GET'){const csrf=await(await fetch('/api/auth/csrf')).json();headers[csrf.headerName]=csrf.token;headers['Content-Type']='application/json';}
 const response=await fetch('/api'+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();if(!response.ok)throw Error(method+' '+path+' '+response.status+' '+(data.message||''));return data;
},{path,method,body});}
async function login(username,password){
 await page.goto(base+'/');await request('/auth/logout','POST',{}).catch(()=>{});await page.reload();await page.waitForSelector('.login-card');
 await page.fill('input[placeholder="输入账号"]',username);await page.fill('input[placeholder="输入密码"]',password);await page.click('.login-card button[type=submit]');await page.waitForSelector('.app-shell');
 return request('/auth/me');
}
const report={date:'2026-11-09',scope:'local only',before:null,temporary:null,views:[],restored:false};
await login(env.MEMBER_USERNAME,env.MEMBER_PASSWORD);const member=await request('/auth/me');
await login(env.SEED_USERNAME,env.SEED_PASSWORD);const groups=await request('/supplier-team-groups');
const group=groups.find(g=>(g.memberIds||[]).includes(member.id));if(!group)throw Error('Seeded member has no group to test reversibly.');
report.before={memberId:member.id,teamAdminGroup:member.teamAdminGroup,groupId:group.id,adminUserId:group.adminUserId,memberIds:group.memberIds};
let changed=false;
try{
 const patch={name:group.name,adminUserId:member.id,memberIds:group.memberIds,allowPro:group.allowPro,version:group.version};
 await request('/supplier-team-groups/'+encodeURIComponent(group.id),'PUT',patch);changed=true;
 const promoted=await login(env.MEMBER_USERNAME,env.MEMBER_PASSWORD);report.temporary={role:promoted.role,teamAdminGroup:promoted.teamAdminGroup,permissions:promoted.permissions};
 for(const route of ['settlements?tab=departments','supplier-agents']){
  await page.goto(base+'/#/'+route);await page.waitForFunction(()=>!document.querySelector('.page-content .loading-state,.page-content .spinner'),undefined,{timeout:10000}).catch(()=>{});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1000,deviceScaleFactor:1,mobile:false});
  const screenshot=root+'/ui-review/screenshots/role-group-admin-'+route.replace('?tab=','-')+'.png';
  await page.screenshot({path:screenshot,raw:true});
  report.views.push(await page.evaluate(route=>({route,title:document.querySelector('.topbar h1')?.textContent,text:document.querySelector('.page-content')?.innerText,denied:document.querySelector('.page-content')?.innerText.includes('当前账号无权访问此页面'),navigation:[...document.querySelectorAll('.sidebar nav button')].map(n=>n.getAttribute('aria-label')||n.textContent.trim())}),route));
  report.views.at(-1).screenshot=screenshot;
 }
}catch(error){report.error=String(error);throw error;}
finally{
 if(changed){
  await login(env.SEED_USERNAME,env.SEED_PASSWORD);const current=(await request('/supplier-team-groups')).find(g=>g.id===group.id);
  await request('/supplier-team-groups/'+encodeURIComponent(group.id),'PUT',{name:group.name,adminUserId:group.adminUserId??null,memberIds:group.memberIds,allowPro:group.allowPro,version:current.version});
  const restoredGroups=await request('/supplier-team-groups');report.restoredGroup=restoredGroups.find(g=>g.id===group.id);const restored=await login(env.MEMBER_USERNAME,env.MEMBER_PASSWORD);report.restored=JSON.stringify(restored.teamAdminGroup||{})===JSON.stringify(member.teamAdminGroup||{});report.restoredMember={teamAdminGroup:restored.teamAdminGroup,permissions:restored.permissions};
 }
 await login(env.SEED_USERNAME,env.SEED_PASSWORD);await page.goto(base+'/#/workbench');
 await fs.writeFile(root+'/docs/group-admin-qa.json',JSON.stringify(report,null,2));
 console.log({views:report.views.map(v=>({route:v.route,denied:v.denied})),restored:report.restored,error:report.error});
}
