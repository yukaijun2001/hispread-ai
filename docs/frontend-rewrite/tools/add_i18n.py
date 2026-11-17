# Usage: python3 add_i18n.py '<json object>' — append entries not already in the dictionary.
import json, re, sys
p='/sessions/youthful-inspiring-hypatia/mnt/hispread-ai/frontend/src/i18n/en-US.js'
s=open(p,encoding='utf8').read()
add=json.loads(sys.argv[1])
existing=set()
for line in s.split('\n'):
    m=re.match(r'\s{2}(?:"((?:[^"\\]|\\.)*)"|([^\s:"`]+)):\s',line)
    if m: existing.add(json.loads('"'+m.group(1)+'"') if m.group(1) is not None else m.group(2))
new=[(k,v) for k,v in add.items() if k not in existing]
s=s.rstrip()[:-2].rstrip()
if not s.endswith(','): s+=','
s+='\n'+'\n'.join(f'  {json.dumps(k,ensure_ascii=False)}: {json.dumps(v,ensure_ascii=False)},' for k,v in new)+'\n};\n'
open(p,'w',encoding='utf8').write(s)
print(len(new),'added; skipped',[k for k in add if k in existing])
