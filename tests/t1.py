import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        m=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
        m.on('pageerror',lambda e:errs.append(str(e)));m.on('console',lambda c:errs.append(c.text) if c.type=='error' else None)
        await m.goto(U);await m.wait_for_timeout(900);await m.screenshot(path='u0.png')
        await m.click('.row[data-r="oya"]');await m.wait_for_timeout(1100);await m.screenshot(path='u1.png')
        await m.click('li[data-stop]:nth-child(3)');await m.wait_for_timeout(1100);await m.screenshot(path='u2.png')
        await m.click('.page:last-child [data-act=fav]');await m.wait_for_timeout(300);await m.screenshot(path='u2.png');await m.click('.page:last-child [data-act=to]');await m.wait_for_timeout(700)
        await m.click('[data-act=pick-o]');await m.wait_for_timeout(700);await m.fill('input','わかばえき');await m.wait_for_timeout(300);await m.screenshot(path='u3.png')
        await m.click('.page:last-child [data-stop]');await m.wait_for_timeout(1100);await m.screenshot(path='u4.png')
        n=await m.locator('.page:last-child [data-trip]').count();print('trips',n)
        if n: await m.click('.page:last-child [data-trip]');await m.wait_for_timeout(1300);await m.screenshot(path='u5.png')
        for i in range(6): await m.evaluate("pop()");await m.wait_for_timeout(120)
        await m.wait_for_timeout(600);print('pages',await m.evaluate("pages.length"),await m.evaluate("[sel,pick,!!plan]"))
        await m.click('#theme');await m.click('#theme');await m.wait_for_timeout(900);await m.screenshot(path='u6.png')
        print(errs);await b.close()
asyncio.run(main())
