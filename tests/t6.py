import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
Q="""()=>{let slant=[],unc=[];for(const c of CL){if(!c._want||!c._caps)continue;const r=c._r;
  for(const q of c._pts){let best=1e9;for(const cp of c._caps){const a=cp[0],b=cp[cp.length-1];best=Math.min(best,segDist(q[0],q[1],a[0],a[1],b[0],b[1]))}if(best>r+1.5)unc.push(c.name+':'+best.toFixed(1))}
  for(const cp of c._caps){if(cp.length<2)continue;const ax=cp[1][0]-cp[0][0],ay=cp[1][1]-cp[0][1],l=Math.hypot(ax,ay);let worst=0;for(const q of c._pts){const d=Math.abs((ax*q[2]+ay*q[3])/l);worst=Math.max(worst,Math.acos(Math.min(1,d))*57.3)}if(worst>12)slant.push(c.name+':'+Math.round(worst))}}
  return {slanted:slant,uncovered:unc}}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        m=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
        m.on('pageerror',lambda e:errs.append(str(e)))
        await m.goto(U);await m.wait_for_timeout(900)
        for mode in ['map','metro']:
            if mode=='metro': await m.click('#mode');await m.wait_for_timeout(900)
            await m.evaluate("fitBox(BOX,false)");await m.wait_for_timeout(300)
            await m.evaluate("zoomAt(9/(sc/fitS),195,230);draw()");await m.wait_for_timeout(500)
            # sweep whole network
            res={'slanted':set(),'uncovered':set()}
            box=await m.evaluate("BOX")
            for iy in range(6):
                for ix in range(8):
                    cx=box[0]+(box[2]-box[0])*(ix+.5)/8;cy=box[1]+(box[3]-box[1])*(iy+.5)/6
                    await m.evaluate(f"flyTo(sc,195-{cx}*sc,230-{cy}*sc,false)");await m.wait_for_timeout(260)
                    r=await m.evaluate(Q);res['slanted']|=set(x.split(':')[0] for x in r['slanted']);res['uncovered']|=set(x.split(':')[0] for x in r['uncovered'])
            print(mode,'slanted markers',len(res['slanted']),sorted(res['slanted'])[:30]);print(mode,'lines not through marker',len(res['uncovered']),sorted(res['uncovered'])[:30])
        print(errs);await b.close()
asyncio.run(main())
