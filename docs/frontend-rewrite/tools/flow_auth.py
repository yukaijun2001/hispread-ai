import asyncio, sys, random
from playwright.async_api import async_playwright
OUT=sys.argv[1]; BASE='http://127.0.0.1:5173/'
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); pg=await (await b.new_context(viewport={'width':1440,'height':900})).new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        writes=[]; pg.on('request', lambda r: writes.append(f'{r.method} {r.url.split("/api")[-1]}') if '/api/auth' in r.url and r.method=='POST' else None)
        await pg.goto(BASE); await pg.wait_for_selector('input[type=password]', timeout=90000)
        await pg.get_by_text('没有账号？立即注册').click(); await pg.wait_for_timeout(1500)
        print('policy:', await pg.locator('.policy').inner_text())
        user=f'flowuser{random.randint(1000,9999)}'; pw_='Flow_Pass1!x'
        await pg.fill('input[name=username]',user); pwd=pg.locator('input[autocomplete=new-password]')
        await pwd.nth(0).fill(pw_); await pwd.nth(1).fill(pw_)
        await pg.screenshot(path=f'{OUT}/register.png')
        await pg.get_by_role('button', name='创建账号').click(); await pg.wait_for_timeout(2000)
        print('after register:', (await pg.locator('.hs-notice').all_inner_texts()))
        await pg.fill('input[type=password]',pw_); await pg.get_by_role('button', name='登录').click(); await pg.wait_for_timeout(3000)
        print('onboarding visible:', await pg.locator('.hs-onboarding').count())
        await pg.screenshot(path=f'{OUT}/onboarding.png')
        inputs=pg.locator('.hs-onboarding input')
        await inputs.nth(0).fill('流程测试')
        await pg.get_by_label('企业名称').fill('测试企业有限公司'); await pg.get_by_label('统一社会信用代码或注册编号').fill('91310000TEST0001')
        await pg.get_by_role('button', name='保存资料').click(); await pg.wait_for_timeout(3000)
        print('shell visible:', await pg.locator('.hs-panel').count(), '| errors in onboarding:', await pg.locator('.hs-onboarding .hs-notice').all_inner_texts())
        await pg.screenshot(path=f'{OUT}/after-onboarding.png')
        await pg.locator('button[aria-label="账号菜单"]').click(); await pg.get_by_text('修改密码', exact=True).click(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/password.png')
        print('writes:', writes); print('pageerrors:', errs)
        await b.close()
asyncio.run(main())
