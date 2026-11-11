import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
CHK="""()=>{const {dots,boxes}=window.__dbg;const ov=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
 const L=boxes.slice(isSheet()?2:3);let dd=0,ll=0,ld=0;
 for(let i=0;i<dots.length;i++)for(let j=i+1;j<dots.length;j++)if(ov(dots[i],dots[j]))dd++;
 for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(ov(L[i],L[j]))ll++;
 for(const l of L)for(const d of dots)if(ov(l,d))ld++;return [dots.length,L.length,dd,ll,ld]}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        m=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
        m.on('pageerror',lambda e:errs.append(str(e)))
        await m.goto(U);await m.wait_for_timeout(900)
        for z in [1,2,3,5,8]:
            await m.evaluate(f"zoomAt({z}/(sc/fitS),195,230);draw()");await m.wait_for_timeout(700);print('z',z,await m.evaluate(CHK))
        for k in ['oya','matsugaoka']:
            await m.evaluate(f"selectRoute('{k}')");await m.wait_for_timeout(1100);print(k,await m.evaluate(CHK));await m.evaluate("pop()");await m.wait_for_timeout(300)
        # sheet drag up via touch on grab
        cdp=await m.context.new_cdp_session(m)
        async def touch(t,pts): await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
        h0=await m.evaluate("sheetPx")
        y=844-h0+30;await touch('touchStart',[(195,y)])
        for k in range(1,12): await touch('touchMove',[(195,y-k*30)]);await m.wait_for_timeout(16)
        await touch('touchEnd',[]);await m.wait_for_timeout(700);print('sheet',h0,'->',await m.evaluate("[sheetState,sheetPx]"))
        y=60;await touch('touchStart',[(195,y)])
        for k in range(1,14): await touch('touchMove',[(195,y+k*50)]);await m.wait_for_timeout(16)
        await touch('touchEnd',[]);await m.wait_for_timeout(700);print('sheet ->',await m.evaluate("[sheetState,sheetPx]"))
        s0=await m.evaluate('sc');await touch('touchStart',[(170,250),(220,250)])
        for k in range(1,8): await touch('touchMove',[(170-k*10,250),(220+k*10,250)]);await m.wait_for_timeout(16)
        await touch('touchEnd',[]);await m.wait_for_timeout(400);print('pinch x',round(await m.evaluate('sc')/s0,2))
        # map tap on a stop
        await m.evaluate("setSheet('mid')");await m.evaluate("(()=>{const s=S.find(s=>s.name==='坂戸駅北口');const ns=fitS*8;flyTo(ns,195-s.x*ns,220-s.y*ns,false)})()");await m.wait_for_timeout(800)
        await m.touchscreen.tap(195,220);await m.wait_for_timeout(900);print('tap ->',await m.evaluate("[topPg().kind,pick!=null?S[pick].name:null,location.hash]"))
        d=await b.new_page(viewport={'width':1180,'height':820},device_scale_factor=2);d.on('pageerror',lambda e:errs.append(str(e)))
        await d.emulate_media(color_scheme='dark');await d.goto(U+'#line-sakado');await d.wait_for_timeout(1500);await d.screenshot(path='d1.png')
        print('deeplink',await d.evaluate("[topPg().kind,sel]"))
        print(errs);await b.close()
asyncio.run(main())
