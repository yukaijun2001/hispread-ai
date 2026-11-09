/** Execute with ego-browser nodejs < this file after the backend is restarted. */
const fs=await import('node:fs/promises');
const root='/Users/yukaijun/account-booster/hispread-ai';
const envText=await fs.readFile(root+'/backend/.env','utf8');
const env=Object.fromEntries(envText.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^(["'])(.*)\1$/,'$2')]}));
const task=await taskSpace(1),page=task.page('p2');
const base='http://127.0.0.1:5173';
const roles=[
 {name:'ADMIN',user:env.ADMIN_USERNAME,password:env.ADMIN_PASSWORD,routes:['workbench','suppliers','operator-kpi','supplier-accounts','projects','quotes','settlements?tab=daily','settlements?tab=statements','settlements?tab=inputs','settlements?tab=payments','settlements?tab=rates','resources','resources-pending','outbound-proxies','resource-targets','ccmax-resource-analysis','reports','notifications','api-docs','notice-admin','users','roles','audits','settings','scheduled-tasks','scheduled-task-runs','payout-providers','payout-recipients','payout-calls']},
 {name:'SUPPLIER_AGENT',user:env.MEMBER_USERNAME,password:env.MEMBER_PASSWORD,routes:['workbench','deliveries','deliveries-pending','outbound-proxies','settlements?tab=daily','settlements?tab=departments','supplier-agents','api-docs','users','suppliers','quotes','reports','settings']},
 {name:'SUPPLIER',user:env.SEED_USERNAME,password:env.SEED_PASSWORD,routes:['workbench','quotes','settlements?tab=daily','settlements?tab=departments','settlements?tab=statements','settlements?tab=payments','settlements?tab=rates','deliveries','deliveries-pending','outbound-proxies','supplier-agents','reports','api-docs','suppliers']},
];
await fs.mkdir(root+'/ui-review/screenshots',{recursive:true});
const report={date:'2026-11-09',basis:'Browser runtime, DOM structure and loaded GET requests. ADMIN/member have no supplied online visual baseline.',roles:[],limitations:['No production business write was executed.','Forbidden routes are tested through navigation and remain subject to supplied permission sets.','Local data can differ from live source; dynamic values are not rewritten to inflate fidelity.']};
async function installObservation(){await page.evaluate(()=>{
 const capture={errors:[],warnings:[],requests:[],pending:0,lastRequestAt:Date.now()};window.__roleQA=capture;
 window.addEventListener('error',e=>capture.errors.push({kind:'error',message:e.message,stack:e.error?.stack}));
 window.addEventListener('unhandledrejection',e=>capture.errors.push({kind:'rejection',message:String(e.reason),stack:e.reason?.stack}));
 const warn=console.warn;console.warn=(...args)=>{capture.warnings.push(args.map(String).join(' '));warn(...args)};
 const error=console.error;console.error=(...args)=>{capture.errors.push({kind:'console',message:args.map(String).join(' ')});error(...args)};
 const original=window.fetch.bind(window);window.fetch=async(...args)=>{capture.pending++;capture.lastRequestAt=Date.now();try{const response=await original(...args);capture.requests.push({url:String(args[0]),method:args[1]?.method||'GET',status:response.status});return response}catch(error){capture.requests.push({url:String(args[0]),networkError:String(error)});throw error}finally{capture.pending--;capture.lastRequestAt=Date.now()}};
});}
async function login(role){
 await page.goto(base+'/');await page.reload();
 await page.evaluate(async()=>{const csrf=await(await fetch('/api/auth/csrf')).json();await fetch('/api/auth/logout',{method:'POST',headers:{[csrf.headerName]:csrf.token,'Content-Type':'application/json'},body:'{}'});});
 await page.reload();await page.waitForSelector('input[placeholder="输入账号"]');
 await page.fill('input[placeholder="输入账号"]',role.user);await page.fill('input[placeholder="输入密码"]',role.password);
 await page.click('.login-card button[type=submit]');await page.waitForSelector('.app-shell');
 await installObservation();
 return page.evaluate(async()=>{const me=await(await fetch('/api/auth/me')).json();return{id:me.id,username:me.username,role:me.role,supplierId:me.supplierId,permissions:me.permissions,teamAdminGroup:me.teamAdminGroup};});
}
async function auditRoute(route){
 await page.goto(base+'/#/'+route);
 await page.waitForFunction(()=>window.__roleQA.pending===0&&Date.now()-window.__roleQA.lastRequestAt>250&&!document.querySelector('.page-content .loading-state,.page-content .data-table-skeleton,.page-content .spinner'),undefined,{timeout:12000}).catch(()=>{});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 return page.evaluate(route=>{
 const main=document.querySelector('.page-content')||document.body,qa=window.__roleQA;
 const selectors=['.sidebar','.topbar','.topbar h1','.page-content','.page-actions','.panel','.panel-section-head','.tabs','.table-scroll','.pagination','.settings-section'];
 const geometry=[];for(const selector of selectors){let index=0;for(const node of document.querySelectorAll(selector)){const rect=node.getBoundingClientRect(),style=getComputedStyle(node);if(!rect.width||!rect.height||style.display==='none')continue;geometry.push({selector,index:index++,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},fontSize:style.fontSize,color:style.color,backgroundColor:style.backgroundColor,borderRadius:style.borderRadius});}}
 const result={route,geometry,viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},title:document.querySelector('.topbar h1')?.textContent,headings:[...main.querySelectorAll('h1,h2,h3')].map(n=>n.textContent.trim()),text:main.innerText.slice(0,5000),elementCount:main.querySelectorAll('*').length,denied:main.innerText.includes('当前账号无权访问此页面'),errors:qa.errors.splice(0),warnings:qa.warnings.splice(0),requests:qa.requests.splice(0),navigation:[...document.querySelectorAll('.sidebar nav button')].map(n=>({label:n.getAttribute('aria-label')||n.textContent.trim(),expanded:n.getAttribute('aria-expanded')}))};
 result.failedRequests=result.requests.filter(r=>r.networkError||r.status>=400);return result;
 },route);
}
for(const role of roles){
 if(!role.user||!role.password)throw Error('Missing '+role.name+' credential environment key; values not printed.');
 const entry={role:role.name,user:await login(role),routes:[]};
 await page.cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1000,deviceScaleFactor:1,mobile:false});
 for(const route of role.routes){
  entry.routes.push(await auditRoute(route));
  const result=entry.routes.at(-1);
  if(!result.denied){
   await page.cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1000,deviceScaleFactor:1,mobile:false});
   result.screenshot=root+'/ui-review/screenshots/role-'+role.name.toLowerCase()+'-'+route.replace('?tab=','-')+'.png';
   await page.screenshot({path:result.screenshot,raw:true});
  }
  console.log({role:role.name,route,title:result.title,denied:result.denied,errors:result.errors.length,failedGET:result.failedRequests.filter(r=>r.method==='GET').map(r=>({url:r.url,status:r.status}))});
  await fs.writeFile(root+'/docs/role-browser-qa.json',JSON.stringify({...report,roles:[...report.roles,entry]},null,2));
 }
 report.roles.push(entry);
 await fs.writeFile(root+'/docs/role-browser-qa.json',JSON.stringify(report,null,2));
}
await page.goto(base+'/#/workbench');
console.log({completedRoles:report.roles.length,views:report.roles.reduce((n,r)=>n+r.routes.length,0),runtimeErrors:report.roles.reduce((n,r)=>n+r.routes.reduce((m,v)=>m+v.errors.length,0),0)});
