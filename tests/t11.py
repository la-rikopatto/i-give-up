import asyncio,sys
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
JS="""(()=>{const shown=CL.filter(c=>c._want&&c._P);const out=[];
for(const r of R){const conn={};for(const x of r.cx){conn[x[0]+'_'+x[1]]=1;conn[x[2]+'_'+x[3]]=1}
 for(const [e] of r.ch)for(const end of [0,1]){if(conn[e+'_'+end])continue;const p=CHN[e].p,q=end?p[p.length-1]:p[0];const X=q[0]*sc+tx,Y=q[1]*sc+ty;
  if(X<0||X>VW||Y<0||Y>VH)continue;let bd=1e9;for(const c of shown)for(const P of c._P)bd=Math.min(bd,Math.hypot(P[0]-X,P[1]-Y));
  if(bd>9+ (r.off[e]?Math.abs(r.off[e])*4:0)){let bs=null,b2=1e9;for(const [sid,e2,s] of r.st){if(e2!==e)continue;const L=CHN[e].cum[CHN[e].cum.length-1];const d=Math.abs(s-(end?L:0));if(d<b2){b2=d;bs=sid}}
   out.push([r.k,e,end,Math.round(X),Math.round(Y),Math.round(bd),bs!=null?S[bs].name:null,Math.round(b2*sc),bs!=null&&r.term.has(bs)])}}}
return out})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vp in [(390,844),(1900,1000)]:
            m=await b.new_page(viewport={'width':vp[0],'height':vp[1]},device_scale_factor=1,has_touch=vp[0]<500)
            await m.goto(U);await m.wait_for_timeout(900)
            for mode in ['map','metro']:
                if mode=='metro': await m.evaluate("setMode('metro',true);reframe(false)");await m.wait_for_timeout(900)
                for z in [0.001,2,4]:
                    await m.evaluate(f"zoomAt({z},VW/2,VH/3);render()");await m.wait_for_timeout(700)
                    r=await m.evaluate(JS);print(vp[0],mode,z,len(r))
                    if '-v' in sys.argv:
                        for x in r:print('   ',x)
            await m.close()
        await b.close()
asyncio.run(main())
