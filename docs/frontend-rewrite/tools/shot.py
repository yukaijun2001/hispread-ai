# usage: shot.py <outdir> <role> <route>... ; logs in with sandbox creds and screenshots routes
import sys, asyncio
from playwright.async_api import async_playwright
CREDS={'supplier':('local_supplier','Sandbox_Seed1!'),'admin':('sandbox_admin','Sandbox_Admin1!'),'finance':('sandbox_finance','Sandbox_Fin1!'),'operator':('sandbox_operator','Sandbox_Oper1!')}
async def main():
    out,role,routes=sys.argv[1],sys.argv[2],sys.argv[3:]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
        logs=[]
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type=='error' and 'Failed to load resource' not in m.text else None)
        pg.on('response', lambda r: logs.append(f'[http {r.status}] {r.url}') if r.status>=400 else None)
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await pg.goto('http://127.0.0.1:5173/'+__import__('os').environ.get('QS',''))
        await pg.wait_for_selector('input[type=password]', timeout=90000); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{out}/login.png')
        u,pw=CREDS[role]
        await pg.fill('input[autocomplete=username], input[name=username], input[type=text]',u)
        await pg.fill('input[type=password]',pw)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(3500)
        for r in routes:
            name,_,path=r.partition('=')
            path,*clicks=path.split('!')
            if path: await pg.goto('http://127.0.0.1:5173/'+__import__('os').environ.get('QS','')+path.lstrip('/'))
            await pg.wait_for_timeout(2500)
            for click in clicks:
                if click.startswith('row:'):
                    await pg.locator(click[4:]).first.click()
                else:
                    await pg.get_by_text(click,exact=True).first.click()
                await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f'{out}/{role}-{name}.png',full_page=False)
            print('shot',name,pg.url)
        await b.close()
        for l in logs[:30]: print(l)
asyncio.run(main())
