import asyncio
from playwright.async_api import async_playwright
from PIL import Image
U='file:///home/claude/repo/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        m=await ctx.new_page();m.on('pageerror',lambda e:errs.append(str(e)))
        await m.goto(U);await m.wait_for_timeout(900)
        cdp=await ctx.new_cdp_session(m)
        async def touch(t,pts):await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
        cam=lambda:m.evaluate("[+(sc/minS()).toFixed(3),Math.round(tx),Math.round(ty)]")
        print('start',await cam(),'limits',await m.evaluate("[minS().toFixed(3),maxS().toFixed(3),fitS.toFixed(3)]"))
        # drag far right: rubber band then spring back
        await touch('touchStart',[(200,200)])
        for i in range(1,16):await touch('touchMove',[(200+i*20,200)]);await m.wait_for_timeout(16)
        await m.wait_for_timeout(120);held=await m.evaluate("(()=>{const d=rubberCam();return [Math.round(tx),Math.round(d[1])]})()")
        await touch('touchEnd',[]);await m.wait_for_timeout(700);print('overdrag raw/shown',held,'after release',await cam())
        # pinch out past max then release
        await touch('touchStart',[(180,220),(210,220)])
        for i in range(1,25):await touch('touchMove',[(180-i*7,220),(210+i*7,220)]);await m.wait_for_timeout(16)
        await m.wait_for_timeout(100);print('pinch-out held',await m.evaluate("[+(sc/maxS()).toFixed(2),+(rubberCam()[0]/maxS()).toFixed(2)]"))
        await touch('touchEnd',[]);await m.wait_for_timeout(800);print('after',await m.evaluate("+(sc/maxS()).toFixed(3)"));await m.screenshot(path='g_max.png')
        # pinch in below min
        await touch('touchStart',[(20,220),(370,220)])
        for i in range(1,24):await touch('touchMove',[(20+i*7,220),(370-i*7,220)]);await m.wait_for_timeout(16)
        await m.wait_for_timeout(100);print('pinch-in held',await m.evaluate("[+(sc/minS()).toFixed(2),+(rubberCam()[0]/minS()).toFixed(2)]"))
        await touch('touchEnd',[]);await m.wait_for_timeout(800);print('after',await cam())
        # double-tap zoom, two-finger tap zoom out
        z0=await m.evaluate("sc")
        for _ in range(2):
            await touch('touchStart',[(200,250)]);await touch('touchEnd',[]);await m.wait_for_timeout(90)
        await m.wait_for_timeout(700);z1=await m.evaluate("sc");print('double tap x',round(z1/z0,2),'page',await m.evaluate("topPg().kind"))
        await touch('touchStart',[(150,250),(250,250)]);await m.wait_for_timeout(60);await touch('touchEnd',[]);await m.wait_for_timeout(700);print('two-finger tap x',round(await m.evaluate("sc")/z1,2))
        # swipe back
        await m.evaluate("popToRoot&&0;while(pages.length>1)pop();selectRoute('oya')");await m.wait_for_timeout(900)
        y=await m.evaluate("document.getElementById('panel').getBoundingClientRect().top+40")
        await touch('touchStart',[(8,y)])
        for i in range(1,12):await touch('touchMove',[(8+i*20,y)]);await m.wait_for_timeout(16)
        await m.screenshot(path='g_back.png')
        await touch('touchEnd',[]);await m.wait_for_timeout(700);print('swipe back ->',await m.evaluate("[topPg().kind,pages.length,sel]"))
        # settings
        await m.click('#mode');await m.wait_for_timeout(700);await m.screenshot(path='g_set.png')
        await m.click('[data-mode=metro]');await m.wait_for_timeout(800);print('mode',await m.evaluate("MODE"));await m.click('[data-th=dark]');await m.wait_for_timeout(500);await m.screenshot(path='g_set2.png')
        await m.click('[data-th=auto]');await m.click('[data-mode=map]');await m.wait_for_timeout(500);await m.click('.page:last-child [data-back]');await m.wait_for_timeout(600)
        # trip
        await m.evaluate("push(planPage(S.findIndex(s=>s.name==='坂戸駅北口'&&s.routes.length),S.findIndex(s=>s.name==='鶴ヶ島駅西口'&&s.routes.length)))");await m.wait_for_timeout(900);await m.screenshot(path='g_plan.png')
        await m.evaluate("document.querySelector('.page:last-child [data-trip]').click()");await m.wait_for_timeout(1500);await m.screenshot(path='g_trip.png')
        print('trip legs',await m.evaluate("plan.legs.map(l=>[l.k,l.stops.length, l.stops.slice(1).map((b,i)=>legSections(RK[l.k],l.stops[i],b).length).filter(n=>!n).length])"))
        await m.evaluate("popToRoot();selectStop(S.findIndex(s=>s.name==='若葉駅東口'&&s.routes.length))");await m.wait_for_timeout(1300);await m.screenshot(path='g_stop.png')
        print('errs',errs)
        ims=[Image.open(f'g_{n}.png').convert('RGB').resize((390,844),Image.LANCZOS) for n in ['max','back','set','set2','plan','trip','stop']]
        c=Image.new('RGB',(400*len(ims),866),(120,120,120))
        for i,im in enumerate(ims):c.paste(im,(i*400+5,11))
        c.crop((0,0,1600,866)).save('g_a.png');c.crop((1600,0,2800,866)).save('g_b.png');await b.close()
asyncio.run(main())
