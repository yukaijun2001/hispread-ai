/** Run with ego-browser nodejs < this file. Uses the existing task space 1. */
const fs = await import('node:fs/promises');
const root='/Users/yukaijun/account-booster/hispread-ai';
const task=await taskSpace(1), source=task.page('p1'), local=task.page('p2');
const phase=JSON.parse(await fs.readFile(root+'/ui-review/capture-phase.json','utf8')).phase;
const screenshots=root+'/ui-review/screenshots';
const records=[];
const routes=[
 ['workbench','工作台'],['quotes','我的报价'],['settlements?tab=daily','日账'],
 ['settlements?tab=departments','部门账单'],['settlements?tab=statements','金额确认'],
 ['settlements?tab=payments','收款记录'],['settlements?tab=rates','参考汇率'],
 ['deliveries','交付列表'],['deliveries-pending','NewAPI 待分配'],
 ['outbound-proxies','代理配置'],['supplier-agents','团队成员'],['reports','应收报表'],
 ['api-docs','API 文档'],['suppliers','我的资料'],
];
async function metrics(page,width,height){await page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});}
async function stable(page,selector='.page-content'){
 await page.waitForSelector(selector,{state:'visible',timeout:12000});
 await page.waitForFunction(()=>{
  const pending=document.querySelector('.page-content .loading-state,.page-content .data-table-skeleton,.page-content .spinner');
  const assets=[...document.querySelectorAll('link[rel=stylesheet]')].every(link=>link.sheet);
  return !pending&&assets;
 },undefined,{timeout:15000}).catch(()=>{});
 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';document.head.append(style);});
}
async function geometry(page){return page.evaluate(()=>{
 const selectors=['.sidebar','.brand','.brand-logo--full','.main-layout','.topbar','.topbar h1','.page-content','.page-actions','.panel','.panel-section-head','.tabs','.query-filters','.filter-toolbar','.table-scroll','.pagination','.workbench-date','.workbench-onboarding','.workbench-guide','.workbench-monitoring','.workbench-tasks','.workbench-bottom','.workbench-finance','.workbench-shortcuts','.login-toolbar','.login-main','.login-hero-copy','.login-card','.login-form-heading','.login-card .field','.login-card .btn.primary','dialog[open]','.dropdown-menu','.date-range-popover'];
 const elements=[];for(const selector of selectors){let index=0;for(const node of document.querySelectorAll(selector)){const r=node.getBoundingClientRect(),s=getComputedStyle(node);if(!r.width||!r.height||s.display==='none'||s.visibility==='hidden')continue;elements.push({selector,index:index++,tag:node.tagName.toLowerCase(),rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:{fontFamily:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,backgroundColor:s.backgroundColor,borderRadius:s.borderRadius,padding:s.padding,gap:s.gap},text:node.textContent.trim().replace(/\s+/g,' ').slice(0,160)});}}
 const brokenImages=[...document.querySelectorAll('img')].filter(n=>n.complete&&!n.naturalWidth).map(n=>n.currentSrc);
 return {viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},elements,brokenImages,headings:[...document.querySelectorAll('h1,h2,h3')].map(n=>n.textContent.trim()),text:document.querySelector('.page-content,.login-page')?.innerText.slice(0,12000)};
});}
async function shot(page,slug,side,width,height){
 await metrics(page,width,height);
 const file=screenshots+'/'+slug+'-'+side+'.png';
 await page.screenshot({path:file,raw:true});
 return {file,geometry:await geometry(page)};
}
async function enter(page,origin,route,width,height){
 await metrics(page,width,height);await page.goto(origin+'/#/'+route);await page.reload();await stable(page);
}
async function pair(slug,name,route,width=1920,height=1000,action){
 const pair={slug,name,route,width,height,basis:'image-layer',sides:{}};
 for(const [side,page,origin] of [['source',source,'https://supplier.hispread.com'],['local',local,'http://127.0.0.1:5173']]){
  try{await enter(page,origin,route,width,height);if(action)await action(page);pair.sides[side]=await shot(page,slug,side,width,height);}
  catch(error){pair.sides[side]={error:String(error)};}
 }
 records.push(pair);console.log({slug,sides:Object.fromEntries(Object.entries(pair.sides).map(([key,value])=>[key,value.error||'captured']))});
 await fs.writeFile(root+'/ui-review/captures-'+phase+'.json',JSON.stringify(records,null,2));
}
if(phase==='desktop'){
 for(const [route,name] of routes)await pair('desktop-'+route.replace('?tab=','-'),name,route);
 await pair('desktop-quote-edit','新增报价行','quotes',1920,1000,async page=>{await page.click('button:has-text("新增报价行")');await page.waitForSelector('.own-quote-edit-row input, input[aria-label="报价折扣"]');});
 await pair('desktop-proxy-dialog','新增代理','outbound-proxies',1920,1000,async page=>{await page.click('.page-actions button:has-text("新增代理")');await page.waitForSelector('dialog[open]');});
 await pair('desktop-profile-dialog','个人信息','workbench',1920,1000,async page=>{await page.click('button[aria-label="账号菜单"]');await page.click('.profile-dropdown button:has-text("个人信息")');await page.waitForSelector('dialog[open] input');await page.waitForFunction(()=>!document.querySelector('dialog[open] .loading-state'),undefined,{timeout:12000});});
}
if(phase==='mobile'){
 await pair('mobile-workbench','移动端工作台','workbench',390,844);
 await pair('mobile-quotes','移动端报价','quotes',390,844);
 await pair('mobile-navigation','移动端导航','workbench',390,844,async page=>{await page.click('button[aria-label="打开导航"],button[aria-label="展开导航"]');await page.waitForSelector('dialog.mobile-navigation[open]');});
}
if(phase==='public'){
 // Authentication screenshots are taken last: signing out changes only the
 // supplied account's session, and never submits registration or business forms.
 for(const [side,page,origin] of [['source',source,'https://supplier.hispread.com'],['local',local,'http://127.0.0.1:5173']]){
  await enter(page,origin,'workbench',1920,1000);
  await page.click('button[aria-label="账号菜单"]');await page.click('.profile-dropdown button:has-text("退出登录")');await stable(page,'.login-card');
 }
 for(const [width,height,prefix] of [[1920,1000,'desktop'],[390,844,'mobile']]){
  for(const register of [false,true]){
   const name=register?'注册':'登录',slug=prefix+'-'+(register?'register':'login'),pair={slug,name:prefix+' '+name,route:register?'register':'login',width,height,basis:'image-layer',sides:{}};
   for(const [side,page] of [['source',source],['local',local]]){
    await metrics(page,width,height);await page.reload();await stable(page,'.login-card');
    if(register){await page.click('button:has-text("没有账号？立即注册")');await page.waitForFunction(()=>document.querySelector('.login-password-hint')?.textContent.includes('密码需为'),undefined,{timeout:12000});}
    pair.sides[side]=await shot(page,slug,side,width,height);
   }
   records.push(pair);console.log({slug,status:'captured'});await fs.writeFile(root+'/ui-review/captures-'+phase+'.json',JSON.stringify(records,null,2));
  }
 }
}
