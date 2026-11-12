import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
ONL="""()=>{const g=cv.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.lineWidth=1.6;let n=0,bad=[];
 for(const [r,p] of window.__paths){for(const sid in r._sp){const q=r._sp[sid];n++;if(!g.isPointInStroke(p,q[0],q[1]))bad.push(r.k+':'+S[sid].name)}}g.restore();return [n,bad.length,bad.slice(0,8)]}"""
OV="""()=>{const {dots,boxes}=window.__dbg;const ov=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
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
        for mode in ['map','metro']:
            if mode=='metro': await m.evaluate("setMode('metro',true);reframe(false)");await m.wait_for_timeout(900);await m.screenshot(path='m0.png')
            miss=[]
            for k in await m.evaluate("R.map(r=>r.k)"):
                await m.evaluate(f"selectRoute('{k}')");await m.wait_for_timeout(750)
                r=await m.evaluate(f"[...RK['{k}'].term].filter(sid=>!CL[S[sid].cl]._want).map(sid=>S[sid].name)")
                if r: miss.append((k,r))
                if k=='oya': await m.screenshot(path=f'{mode}_oya.png')
                await m.evaluate("pop()");await m.wait_for_timeout(150)
            print(mode,'line ends without a visible dot:',miss)
            await m.wait_for_timeout(600)
            for z in [2,6,14]:
                await m.evaluate(f"zoomAt({z}/(sc/fitS),195,230);draw()");await m.wait_for_timeout(600)
                print(mode,'z',z,'on-line',await m.evaluate(ONL),'overlap',await m.evaluate(OV),'multi-marker stops',await m.evaluate("CL.filter(c=>c._want&&c._caps&&c._caps.length>1).map(c=>c.name)"))
            await m.evaluate("fitBox(BOX,false)");await m.wait_for_timeout(400)
        await m.evaluate("zoomAt(3.2/(sc/fitS),195,230);draw()");await m.wait_for_timeout(800);await m.screenshot(path='m1.png')
        print(errs);await b.close()
asyncio.run(main())
