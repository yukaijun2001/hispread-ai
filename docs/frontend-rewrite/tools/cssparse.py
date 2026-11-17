import re
def parse(s,ctx=''):
    out=[];i=0;n=len(s)
    while i<n:
        j=s.find('{',i)
        if j<0:break
        sel=s[i:j].strip()
        if sel.startswith('@'):
            d=1;k=j+1
            while d:
                if s[k]=='{':d+=1
                elif s[k]=='}':d-=1
                k+=1
            if sel.startswith(('@media','@supports','@container','@layer')):
                out+=parse(s[j+1:k-1],(ctx+' '+sel).strip())
            i=k;continue
        k=s.find('}',j)
        out.append((ctx,sel,s[j+1:k]));i=k+1
    return out
