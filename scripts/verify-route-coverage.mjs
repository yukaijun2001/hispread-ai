import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname),dir=path.join(root,'backend/src/main/java/com/hispread/ai');
const mappings=[];
function literals(text){return [...text.matchAll(/"([^"\n]*)"/g)].map(x=>x[1]);}
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('Controller.java'))){
 const src=fs.readFileSync(path.join(dir,file),'utf8');const pos=src.indexOf('public class');const header=src.slice(0,pos),prefixMatch=header.match(/@RequestMapping\(([^)]*)\)/s),prefixes=prefixMatch?literals(prefixMatch[1]):[''];
 const body=src.slice(pos);for(const m of body.matchAll(/@RequestMapping\(([^)]*)\)/gs)){const ps=literals(m[1]);const ms=[...m[1].matchAll(/RequestMethod\.(GET|POST|PUT|PATCH|DELETE)/g)].map(x=>x[1]);for(const prefix of prefixes)for(const p of ps)for(const method of ms)mappings.push({method,path:(prefix+p).replace(/\/$/,'')||'/',controller:file});}for(const match of body.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?/gs)){
  const paths=match[2]?literals(match[2]):[''];
  for(const prefix of prefixes)for(const p of paths)mappings.push({method:match[1].toUpperCase(),path:(prefix+p).replace(/\/$/,'')||'/',controller:file});
 }
}
function norm(p){return p.replace(/^\/api(?=\/)/,'').replace(/\/$/,'').replace(/\{[^}]*\}/g,'{}');}
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/frontend-api-inventory.json'),'utf8'));const calls=input.endpoints.filter(e=>e.path&&!e.path.startsWith('/api{'));
const overrides=JSON.parse(fs.readFileSync(path.join(root,'scripts/api-manual-contracts.json'),'utf8'));
const checks=calls.map(e=>{let p=e.path.split('?')[0];const manual=overrides.find(x=>x.source===e.module+':'+e.line);if(manual){e={...e,originalMethod:e.method,originalPath:e.path,method:manual.method,path:manual.path,manualResolution:manual.reason};p=e.path;}const found=mappings.filter(m=>m.method===e.method&&norm(m.path)===norm(p));return {...e,routeMatches:found.map(m=>m.controller),state:found.length?'route-present':'manual-review-required'};});
const out={generatedAt:new Date().toISOString(),limitations:['Literal/template path equality is a routing check only, not proof of functional behavior.','Dynamic expressions and helper calls are manually classified in domain audit files.','Frontend controls intentionally denied by role policy remain denied; a 403 is not a missing interface.'],controllerMappings:mappings.length,literalTemplates:checks.length,routePresent:checks.filter(x=>x.routeMatches.length).length,manualReview:checks.filter(x=>!x.routeMatches.length),checks,mappings};
fs.writeFileSync(path.join(root,'docs/api-route-coverage.json'),JSON.stringify(out,null,2));console.log({backendMappings:mappings.length,literalTemplates:checks.length,present:out.routePresent,manualReview:out.manualReview.length});
