import fs from 'node:fs/promises';
const root='/Users/yukaijun/account-booster/hispread-ai';
const groups=await Promise.all(['desktop','mobile','public'].map(async phase=>JSON.parse(await fs.readFile(`${root}/ui-review/captures-${phase}.json`,'utf8'))));
const pairs=groups.flat();
const pages=[];
const geometry=[];
for(const pair of pairs){
 const source=pair.sides.source,local=pair.sides.local;
 const entry={view:pair.slug,name:pair.name,width:pair.width,height:pair.height,sourceUrl:'https://supplier.hispread.com/#/'+pair.route,localUrl:'http://127.0.0.1:5173/#/'+pair.route,coverage:source?.geometry&&local?.geometry?'compared':'failed',errors:[source?.error,local?.error].filter(Boolean),structuralIssues:[],comparisons:[]};
 if(source?.file&&local?.file)pages.push({name:pair.name+' · '+pair.slug,target:local.file,design:source.file,viewport:pair.width,height:pair.height,designWidth:pair.width,designHeight:pair.height});
 if(source?.geometry&&local?.geometry){
  entry.source={viewport:source.geometry.viewport,document:source.geometry.document,headings:source.geometry.headings};
  entry.local={viewport:local.geometry.viewport,document:local.geometry.document,headings:local.geometry.headings};
  for(const [side,value] of [['source',source.geometry],['local',local.geometry]]){
   if(value.document.width>value.viewport.width+1)entry.structuralIssues.push({side,kind:'document-horizontal-overflow',excess:value.document.width-value.viewport.width});
   if(value.brokenImages.length)entry.structuralIssues.push({side,kind:'broken-images',images:value.brokenImages});
  }
  for(const a of source.geometry.elements){
   const b=local.geometry.elements.find(el=>el.selector===a.selector&&el.index===a.index);if(!b)continue;
   const delta=Object.fromEntries(Object.keys(a.rect).map(key=>[key,Math.round((b.rect[key]-a.rect[key])*100)/100]));
   const styleDifferences=Object.entries(a.style).filter(([key,value])=>b.style[key]!==value).map(([key,value])=>({property:key,source:value,local:b.style[key]}));
   entry.comparisons.push({selector:a.selector,index:a.index,sourceRect:a.rect,localRect:b.rect,delta,styleDifferences,textIdentical:a.text===b.text});
  }
  entry.matchedElements=entry.comparisons.length;
  entry.exactGeometry=entry.comparisons.filter(el=>Object.values(el.delta).every(v=>Math.abs(v)<.1)).length;
  entry.styleDifferenceCount=entry.comparisons.reduce((n,v)=>n+v.styleDifferences.length,0);
 }
 geometry.push(entry);
}
let roleAudit;try{roleAudit=JSON.parse(await fs.readFile(root+'/docs/role-browser-qa.json','utf8'));}catch{}
if(roleAudit){for(const role of roleAudit.roles){if(role.role==='SUPPLIER')continue;for(const view of role.routes){if(view.denied||!view.screenshot)continue;pages.push({name:role.role+' · '+view.title+' · '+view.route,target:view.screenshot,viewport:1920,height:1000});geometry.push({role:role.role,view:view.route,name:view.title,coverage:'local-structural-only',sourceVisualBaseline:false,limitations:['No online administrator/member account was supplied. No visual fidelity verdict is possible.'],local:{viewport:view.viewport,document:view.document,elements:view.geometry},runtimeErrors:view.errors,failedRequests:view.failedRequests,structuralIssues:view.document.width>view.viewport.width+1?[{kind:'document-horizontal-overflow',excess:view.document.width-view.viewport.width}]:[]});}}}
let groupAudit;try{groupAudit=JSON.parse(await fs.readFile(root+'/docs/group-admin-qa.json','utf8'));}catch{}
if(groupAudit){for(const view of groupAudit.views||[]){if(view.denied||!view.screenshot)continue;pages.push({name:'GROUP_ADMIN · '+view.title,target:view.screenshot,viewport:1920,height:1000});geometry.push({role:'SUPPLIER_AGENT_GROUP_ADMIN',view:view.route,name:view.title,coverage:'local-structural-only',sourceVisualBaseline:false,restored:groupAudit.restored});}}
await fs.writeFile(root+'/ui-review/pages.json',JSON.stringify({height:1000,wait:0,pages},null,2));
await fs.writeFile(root+'/docs/ui-geometry.json',JSON.stringify({date:'2026-11-09',basis:'Actual DOM bounding boxes and computed styles from paired browser captures; image-layer report is separate.',viewsDiscovered:geometry.length,pairedVisualViews:pairs.length,localStructuralOnlyViews:geometry.filter(v=>v.coverage==='local-structural-only').length,viewsCompared:geometry.filter(v=>v.coverage==='compared').length,viewsFailed:geometry.filter(v=>v.coverage==='failed').length,limitations:['Repeated selectors are paired by DOM occurrence within the same route and viewport. Data-driven row counts and dynamic text can change positions.','No claim of complete element-level design alignment; the supplied ui-review report uses paired image screenshots, tier B.','Animations, text caret and transitions are frozen equally. Login particle canvas uses reduced-motion where supported.','Current source RPM, refresh times, notifications and independently persisted local data can differ; these differences remain visible.'],views:geometry},null,2));
console.log({views:pairs.length,paired:pages.length,geometryMatched:geometry.reduce((n,v)=>n+(v.matchedElements||0),0),styleDifferences:geometry.reduce((n,v)=>n+(v.styleDifferenceCount||0),0)});
