import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
CHK="""()=>{const g=cv.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.lineWidth=1.6;let n=0,bad=[];
 for(const [r,p] of window.__paths){for(const sid in r._sp){const q=r._sp[sid];n++;if(!g.isPointInStroke(p,q[0],q[1]))bad.push(r.k+':'+S[sid].name)}}g.restore();return [n,bad.length,bad.slice(0,12)]}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        m=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
        m.on('pageerror',lambda e:errs.append(str(e)))
        await m.goto(U);await m.wait_for_timeout(900)
        for z in [1,2.5,5,10,18]:
            await m.evaluate(f"zoomAt({z}/(sc/fitS),195,230);draw()");await m.wait_for_timeout(600);print('z',z,await m.evaluate(CHK))
        await m.evaluate("selectRoute('oya')");await m.wait_for_timeout(1100);print('oya',await m.evaluate(CHK))
        await m.evaluate("pop()");await m.evaluate("(()=>{const s=S.find(s=>s.name==='坂戸駅北口');selectStop(s.id)})()");await m.wait_for_timeout(1200);await m.screenshot(path='p1.png')
        await m.emulate_media(color_scheme='dark');await m.evaluate("pop()");await m.evaluate("(()=>{const s=S.find(s=>s.name==='関越病院');const ns=fitS*12;flyTo(ns,195-s.x*ns,230-s.y*ns,false)})()");await m.wait_for_timeout(900);await m.screenshot(path='p2.png')
        print(errs);await b.close()
asyncio.run(main())
