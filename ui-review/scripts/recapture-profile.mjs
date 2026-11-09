const fs=await import('node:fs/promises'),root='/Users/yukaijun/account-booster/hispread-ai',task=await taskSpace(1);
const envText=await fs.readFile(root+'/backend/.env','utf8');const env=Object.fromEntries(envText.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).replace(/^(["'])(.*)\1$/,'$2')]}));
const records=JSON.parse(await fs.readFile(root+'/ui-review/captures-desktop.json','utf8')),pair=records.find(p=>p.slug==='desktop-profile-dialog');
for(const [side,label,origin]of[['source','p1','https://supplier.hispread.com'],['local','p2','http://127.0.0.1:5173']]){
 const page=task.page(label);await page.cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1000,deviceScaleFactor:1,mobile:false});
 await page.goto(origin+'/');await page.reload();await page.waitForSelector('.login-card');
 await page.fill('input[placeholder="输入账号"]',side==='source'?'wutong':env.SEED_USERNAME);await page.fill('input[placeholder="输入密码"]',side==='source'?'wutong@Qq1.':env.SEED_PASSWORD);await page.click('.login-card button[type=submit]');await page.waitForSelector('.workbench-tasks');
 await page.click('button[aria-label="账号菜单"]');await page.click('.profile-dropdown button:has-text("个人信息")');await page.waitForSelector('dialog[open] input');await page.waitForFunction(()=>!document.querySelector('dialog[open] .loading-state'),undefined,{timeout:12000});
 await page.screenshot({path:pair.sides[side].file,raw:true});
 pair.sides[side].geometry=await page.evaluate(previous=>{for(const e of previous.elements){const node=[...document.querySelectorAll(e.selector)].filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'})[e.index];if(node){const r=node.getBoundingClientRect();e.rect={x:r.x,y:r.y,width:r.width,height:r.height};e.text=node.textContent.trim().replace(/\s+/g,' ').slice(0,160);}}previous.text=document.querySelector('.page-content').innerText;return previous;},pair.sides[side].geometry);
}
await fs.writeFile(root+'/ui-review/captures-desktop.json',JSON.stringify(records,null,2));console.log('desktop-profile-dialog loaded pair recaptured');
