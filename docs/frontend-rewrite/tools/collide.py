# Report classes used in new SFC styles that legacy CSS can match standalone or via element-qualified selectors.
import re,glob,sys
sys.path.insert(0,'/tmp/an')
from cssparse import parse
root='/sessions/youthful-inspiring-hypatia/mnt/hispread-ai/frontend/'
risky=set()
for f in glob.glob(root+'public/assets/*.css')+glob.glob(root+'src/runtime/*.css'):
    for m,sel,b in parse(open(f).read()):
        for s in sel.split(','):
            for c in re.split(r'\s*[ >+~]\s*',s.strip()):
                cls=re.findall(r'\.([\w-]+)',c)
                base=re.sub(r'(::?[\w-]+(\([^)]*\))?)+$','',c)
                # compound with exactly one class and optional element/attr → can match a new element alone
                if len(cls)==1 and re.fullmatch(r'[a-z]*\.'+re.escape(cls[0])+r'(\[[^\]]*\])*',base): risky.add(cls[0])
for f in sorted(glob.glob(root+'src/**/*.vue',recursive=True)):
    if '/legacy/' in f: continue
    s=open(f).read(); st=s.split('<style')[1] if '<style' in s else ''
    mine=set(re.findall(r'\.([a-zA-Z][\w-]*)',st))
    hit=sorted(mine & risky)
    if hit: print(f.replace(root,''),hit)
