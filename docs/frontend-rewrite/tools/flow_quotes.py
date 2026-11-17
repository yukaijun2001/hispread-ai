import asyncio, json, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
CREDS={'supplier':('local_supplier','Sandbox_Seed1!'),'admin':('sandbox_admin','Sandbox_Admin1!')}
BASE='http://127.0.0.1:5173/'
async def login(b, role):
    ctx=await b.new_context(viewport={'width':1440,'height':900})
    pg=await ctx.new_page()
    writes=[]; errors=[]
    pg.on('request', lambda r: writes.append(f'{r.method} {r.url.split("/api")[-1]} {r.post_data or ""}') if '/api/' in r.url and r.method in ('POST','PUT') and 'csrf' not in r.url else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    await pg.goto(BASE); await pg.wait_for_selector('input[type=password]', timeout=90000)
    u,p=CREDS[role]
    await pg.fill('input[autocomplete=username], input[name=username], input[type=text]',u); await pg.fill('input[type=password]',p); await pg.keyboard.press('Enter')
    await pg.wait_for_selector('.hs-panel', timeout=30000)
    return pg, writes, errors
async def toast(pg):
    try:
        el=await pg.wait_for_selector('.hs-toast', timeout=8000); return await el.inner_text()
    except Exception: return '(no toast)'
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        # 1. supplier creates a quote
        pg,w,err=await login(b,'supplier')
        await pg.goto(BASE+'#/quotes'); await pg.wait_for_timeout(2500)
        await pg.get_by_role('button', name='新增报价行').click(); await pg.wait_for_timeout(800)
        await pg.locator('tr.edit .hs-select').first.click(); await pg.wait_for_timeout(500)
        opts=pg.locator('.hs-select-option:not([disabled])')
        print('project options:', await opts.count(), [await opts.nth(i).inner_text() for i in range(min(5,await opts.count()))])
        await opts.first.click(); await pg.wait_for_timeout(500)
        nums=pg.locator('tr.edit input[type=number]')
        for i in range(await nums.count()):
            label=await nums.nth(i).get_attribute('aria-label') or ''
            if label in ('报价折扣','单位价格'): continue
            await nums.nth(i).fill('12')
        await pg.screenshot(path=f'{OUT}/flow-1-draft.png')
        await pg.get_by_role('button', name='保存', exact=True).click()
        print('1 save toast:', await toast(pg)); await pg.wait_for_timeout(1500)
        err_row=pg.locator('tr.edit-error')
        if await err_row.count(): print('  row error:', await err_row.first.inner_text())
        await pg.screenshot(path=f'{OUT}/flow-1-saved.png')
        print('  writes:', w[-2:]); print('  pageerrors:', err)
        # 2. admin approves
        pa,wa,ea=await login(b,'admin')
        await pa.goto(BASE+'#/quotes'); await pa.wait_for_timeout(2500)
        rows=pa.locator('tr.row'); print('admin rows:', await rows.count())
        target=pa.locator('tr.row', has_text='待审核').first
        await target.click(); await pa.wait_for_timeout(1500)
        await pa.screenshot(path=f'{OUT}/flow-2-review.png')
        await pa.get_by_role('button', name='审核通过').click(); await pa.wait_for_timeout(500)
        await pa.get_by_role('button', name='确认通过').click()
        print('2 review toast:', await toast(pa)); print('  writes:', wa[-1:]); print('  pageerrors:', ea)
        # 3. supplier requests price change
        await pg.goto(BASE+'#/workbench'); await pg.wait_for_timeout(800); await pg.goto(BASE+'#/quotes'); await pg.wait_for_timeout(2500)
        await pg.locator('tr.row', has_text='已通过').first.get_by_role('button', name='调价').click(); await pg.wait_for_timeout(2000)
        price=pg.locator('input[aria-label="调整报价折扣"]'); await price.fill('75')
        await pg.screenshot(path=f'{OUT}/flow-3-adjust.png')
        await pg.get_by_role('button', name='提交调整审核').click()
        print('3 adjust toast:', await toast(pg)); print('  writes:', w[-1:]); print('  pageerrors:', err)
        # 4. admin reviews the change
        await pa.goto(BASE+'#/workbench'); await pa.wait_for_timeout(800); await pa.goto(BASE+'#/quotes'); await pa.wait_for_timeout(2500)
        await pa.screenshot(path=f'{OUT}/flow-4-list.png')
        await pa.locator('tr.row', has_text='调价待审').first.get_by_role('button', name='审核调价').click(); await pa.wait_for_timeout(2000)
        await pa.screenshot(path=f'{OUT}/flow-4-change.png')
        await pa.get_by_role('button', name='审核通过').click(); await pa.wait_for_timeout(500)
        await pa.get_by_role('button', name='确认通过').click()
        print('4 change toast:', await toast(pa)); print('  writes:', wa[-1:]); print('  pageerrors:', ea)
        await b.close()
asyncio.run(main())
