/** Inventory actual HTTP call sites in recovered frontend modules. No target code executes. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const require=createRequire(path.join(root,'frontend/package.json'));
const {parse}=require('@babel/parser');
const dir=path.join(root,'frontend/src/recovered');
const calls=[];
const names={ '$':'REQUEST', 'S':'GET', 'rt':'POST', 'it':'PUT', 'at':'UPLOAD', 'et':'EXPORT_GET', 'tt':'EXPORT_POST', 'nt':'LOGOUT' };
function walk(node,fn){if(!node||typeof node!=='object')return;if(node.type)fn(node);for(const[k,v]of Object.entries(node)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function render(node,src,vars,seen=new Set()){
 if(!node)return null;
 if(node.type==='StringLiteral')return node.value;
 if(node.type==='TemplateLiteral')return node.quasis.map((x,i)=>x.value.cooked+(i<node.expressions.length?'{'+src.slice(node.expressions[i].start,node.expressions[i].end)+'}':'')).join('');
 if(node.type==='BinaryExpression'&&node.operator==='+'){let a=render(node.left,src,vars,seen),b=render(node.right,src,vars,seen);return a===null&&b===null?null:(a??'{'+src.slice(node.left.start,node.left.end)+'}')+(b??'{'+src.slice(node.right.start,node.right.end)+'}');}
 if(node.type==='Identifier'&&vars.has(node.name)&&!seen.has(node.name)){const next=new Set(seen);next.add(node.name);return render(vars.get(node.name),src,vars,next);}
 return null;
}
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js'))){
 const src=fs.readFileSync(path.join(dir,file),'utf8'),ast=parse(src,{sourceType:'module'}),imports=new Map(),vars=new Map();
 walk(ast,n=>{if(n.type==='ImportDeclaration'&&/index-Dnr0i-H9\.js$/.test(n.source.value))for(const s of n.specifiers)if(s.type==='ImportSpecifier'&&names[s.imported.name])imports.set(s.local.name,names[s.imported.name]);if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&n.init)vars.set(n.id.name,n.init);});
 // The core module's own request wrappers have stable recovered names.
 if(file==='index-Dnr0i-H9.js')for(const [id,method]of [['fe','REQUEST'],['pe','POST'],['me','PUT'],['be','EXPORT_GET']])imports.set(id,method);
 walk(ast,n=>{
  if(n.type!=='CallExpression')return;
  let callee=n.callee.type==='Identifier'?n.callee.name:null;
  if(!callee||!imports.has(callee))return;
  let method=imports.get(callee),arg=n.arguments[0];if(!arg)return;
  let endpoint=render(arg,src,vars);if(method==='LOGOUT')endpoint='/auth/logout';
  if(method==='REQUEST'&&n.arguments[1]?.type==='ObjectExpression'){
   const prop=n.arguments[1].properties.find(x=>x.type==='ObjectProperty'&&(x.key.name||x.key.value)==='method');method=prop&&prop.value.type==='StringLiteral'?prop.value.value:'GET';
  }else if(method==='REQUEST')method='GET';
  if(method==='UPLOAD'){method='POST';endpoint='/documents';}
  if(method==='EXPORT_GET')method='GET';if(method==='EXPORT_POST')method='POST';if(method==='LOGOUT')method='POST';
  if(endpoint&&endpoint.startsWith('/api'))endpoint=endpoint.slice(4);
  if(endpoint&&!endpoint.startsWith('/'))endpoint=null;
  calls.push({module:file,line:n.loc.start.line,method,path:endpoint,expression:src.slice(arg.start,arg.end),dynamic:endpoint?.includes('{')??true});
 });
}
const unique=[...new Map(calls.filter(x=>x.path).map(x=>[x.method+' '+x.path.split('?')[0],x])).values()];
const out={generatedAt:new Date().toISOString(),basis:'Babel static call-site inventory; imported recovered request functions only. Dynamic or conditional values remain explicit unknowns, not proof of absence.',callSites:calls.length,uniqueLiteralTemplates:unique.length,unresolved:calls.filter(x=>!x.path),endpoints:unique,allCallSites:calls};
fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs/frontend-api-inventory.json'),JSON.stringify(out,null,2));
console.log({callSites:calls.length,uniqueTemplates:unique.length,unresolved:out.unresolved.length});
