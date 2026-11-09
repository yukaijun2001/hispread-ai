const fs=await import('node:fs/promises'),root='/Users/yukaijun/account-booster/hispread-ai',task=await taskSpace(1);
const records=JSON.parse(await fs.readFile(root+'/ui-review/captures-public.json','utf8')),pair=records.find(p=>p.slug==='mobile-register');
for(const [side,label]of[['source','p1'],['local','p2']]){
 const page=task.page(label);await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await page.waitForFunction(()=>document.querySelector('.login-password-hint')?.textContent.includes('密码需为'),undefined,{timeout:12000});
 await page.screenshot({path:pair.sides[side].file,raw:true});
 pair.sides[side].geometry=await page.evaluate(previous=>{for(const e of previous.elements){const node=[...document.querySelectorAll(e.selector)].filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'})[e.index];if(node){const r=node.getBoundingClientRect();e.rect={x:r.x,y:r.y,width:r.width,height:r.height};e.text=node.textContent.trim().replace(/\s+/g,' ').slice(0,160);}}previous.text=document.querySelector('.login-page').innerText;previous.document={width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight};return previous;},pair.sides[side].geometry);
}
await fs.writeFile(root+'/ui-review/captures-public.json',JSON.stringify(records,null,2));console.log('mobile-register policy-loaded pair recaptured');
