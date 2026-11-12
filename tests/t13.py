import asyncio,sys
from playwright.async_api import async_playwright
U='file:///home/claude/out/sakado-bus-map.html'
JS="""(()=>{const out=[];const W=VW,H=VH;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d',{willReadFrequently:true});
for(const [r,p] of window.__paths){g.clearRect(0,0,W,H);g.lineWidth=3;g.lineCap='round';g.lineJoin='round';g.strokeStyle='#000';g.stroke(p);
 const d=g.getImageData(0,0,W,H).data;const lab=new Int32Array(W*H);let n=0;const comps=[];
 for(let i=0;i<W*H;i++){if(d[i*4+3]<40||lab[i])continue;n++;let st=[i],cnt=0,x0=1e9,y0=1e9,x1=-1,y1=-1;lab[i]=n;
  while(st.length){const j=st.pop();cnt++;const x=j%W,y=(j-x)/W;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(d[q*4+3]>=40&&!lab[q]){lab[q]=n;st.push(q)}}}
  comps.push([cnt,x0,y0,x1,y1])}
 if(comps.length>1)out.push([r.k,comps.sort((a,b)=>b[0]-a[0]).slice(0,5)])}
return out})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        m=await b.new_page(viewport={'width':2400,'height':1300},device_scale_factor=1)
        await m.goto(U);await m.wait_for_timeout(900)
        for mode in ['map','metro']:
            if mode=='metro': await m.evaluate("setMode('metro',true);reframe(false)");await m.wait_for_timeout(900)
            for z in [0.001,1.6,2.5]:
                await m.evaluate(f"zoomAt({z},VW/2+200,VH/2);render()");await m.wait_for_timeout(700)
                r=await m.evaluate(JS);print(mode,z,await m.evaluate("[VW,VH,sc/fitS]"))
                for x in r:print('   ',x)
            await m.screenshot(path=f'big_{mode}.png')
        await b.close()
asyncio.run(main())
