import fs from 'node:fs/promises';
const root='/Users/yukaijun/account-booster/hispread-ai';
const qa=JSON.parse(await fs.readFile(root+'/docs/five-role-browser-qa.json','utf8'));
const pages=[];
for(const role of qa.roles){
 for(const view of role.routes)if(view.screenshot)pages.push({name:role.role+' · '+view.title+' · '+view.route,target:view.screenshot,viewport:1920,height:1000});
 for(const dialog of role.dialogs)if(dialog.screenshot)pages.push({name:role.role+' · '+dialog.name,target:dialog.screenshot,viewport:1920,height:1000});
}
try{const account=JSON.parse(await fs.readFile(root+'/docs/five-role-account-review-qa.json','utf8'));if(account.screenshot)pages.push({name:'FINANCE · 临时账户审核控件',target:account.screenshot,viewport:1920,height:1000});}catch{}
await fs.writeFile(root+'/ui-review/five-role/pages.json',JSON.stringify({height:1000,pages},null,2));
const summary={basis:'Local runtime/navigation/dialog QA only; no online OPERATOR/FINANCE visual baseline.',pixelScore:null,viewsDiscovered:pages.length,roles:qa.roles.map(role=>({role:role.role,permissionCount:role.user.permissions.length,landing:role.landing,routes:role.routes.length,allowed:role.routes.filter(v=>!v.denied).length,denied:role.routes.filter(v=>v.denied).length,accessMismatches:role.routes.filter(v=>!v.accessMatches).map(v=>v.route),runtimeErrors:role.routes.flatMap(v=>v.errors),failedRequests:role.routes.flatMap(v=>v.failedRequests),dialogs:role.dialogs.map(d=>({name:d.name,status:d.status,reason:d.reason})),workbenchPermissionChecks:role.routes.find(v=>v.route==='workbench')?.workbenchPermissionChecks,quoteReviewDenied:role.quoteReviewDenied,forbiddenWrites:role.forbiddenWrites}))};
await fs.writeFile(root+'/ui-review/five-role/summary.json',JSON.stringify(summary,null,2));
console.log(summary);
