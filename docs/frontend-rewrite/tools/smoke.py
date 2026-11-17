import asyncio, sys, re
from playwright.async_api import async_playwright
OUT=sys.argv[1]; roles=sys.argv[2:]
CREDS={'supplier':('local_supplier','Sandbox_Seed1!'),'admin':('sandbox_admin','Sandbox_Admin1!'),'finance':('sandbox_finance','Sandbox_Fin1!'),'operator':('sandbox_operator','Sandbox_Oper1!'),'member':('sandbox_member','Sandbox_Member1!')}
BASE='http://127.0.0.1:5173/'
async def run(b, role):
    ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
    issues=[]; cur={'r':'login'}
    pg.on('pageerror', lambda e: issues.append(f"{cur['r']}: PAGEERROR {e}"))
    pg.on('console', lambda m: issues.append(f"{cur['r']}: console {m.text[:200]}") if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.on('response', lambda r: issues.append(f"{cur['r']}: HTTP {r.status} {r.request.method} {r.url.split('5173')[-1][:120]}") if r.status>=400 and '/auth/me' not in r.url and not re.search(r'/assets/[\w-]+\.js$', r.url) else None)
    await pg.goto(BASE); await pg.wait_for_selector('input[type=password]', timeout=90000)
    u,p=CREDS[role]
    await pg.fill('input[autocomplete=username], input[name=username], input[type=text]',u); await pg.fill('input[type=password]',p); await pg.keyboard.press('Enter')
    try: await pg.wait_for_selector('.hs-panel', timeout=30000)
    except Exception:
        await pg.screenshot(path=f'{OUT}/{role}-stuck.png'); print(role,'did not reach shell'); return
    hrefs=await pg.eval_on_selector_all('.rail .hs-sidebar nav a','els=>els.map(e=>e.getAttribute("href"))')
    print(role, len(hrefs), 'nav items')
    for h in hrefs:
        cur['r']=h
        await pg.goto(BASE+h); await pg.wait_for_timeout(2600)
        name=re.sub(r'[^\w-]+','_',h.strip('#/'))
        await pg.screenshot(path=f'{OUT}/{role}-{name}.png')
        legacy=await pg.locator('.legacy-page').count()
        txt=(await pg.locator('.hs-panel').inner_text())[:60].replace('\n',' | ')
        print(f'  {h:42} {"LEGACY" if legacy else "new   "} {txt}')
    for i in issues: print('  !!', i)
    await ctx.close()
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        for r in roles: await run(b,r)
        await b.close()
asyncio.run(main())
