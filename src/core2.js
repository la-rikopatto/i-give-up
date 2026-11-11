const NET=__NET__;
const BASE=__BASE__;
// ---------- data prep
const Q=5;
function dec(str){if(!str)return[];return str.split(';').map(s=>{const a=s.split(',').map(Number);const o=[];let x=0,y=0;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];o.push(x/Q,y/Q)}return o})}
function toPath(paths,close){const p=new Path2D();for(const a of paths){p.moveTo(a[0],a[1]);for(let i=2;i<a.length;i+=2)p.lineTo(a[i],a[i+1]);if(close)p.closePath()}return p}
const P={water:toPath(dec(BASE.water),true),creek:toPath(dec(BASE.creek)),rail:toPath(dec(BASE.rail)),hw:toPath(dec(BASE.hw))};
const ROAD=toPath(dec(BASE.road),true);
const R=NET.routes, S=NET.stops, RK={}, CL=NET.clusters;
const ENDSTOP={};let CHN=[],MODE='map',BOX=[0,0,1,1],ZONES=[];
R.forEach(r=>{RK[r.k]=r;const a=S[r.order[0]].name,b=S[r.order[r.order.length-1]].name;r.ends=r.loop?`${a} 発着・循環`:`${a} ⇄ ${b}`});
function setGeo(name){MODE=name;const G=NET.geos[name];for(const k in ENDSTOP)delete ENDSTOP[k];
  CHN=G.chains.map(p=>{const cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return {p,cum}});
  S.forEach((s,i)=>{s.x=G.sp[i][0];s.y=G.sp[i][1]});CL.forEach((c,i)=>{c.c=G.cp[i];c._lv=null;c._side=null});
  let W0=1e9,H0=1e9,W1=-1e9,H1=-1e9;
  R.forEach(r=>{const g=G.r[r.k];r.ch=g.ch;r.cx=g.cx;r.st=g.st;r.segs=r.ch.map(c=>CHN[c[0]].p);r.off={};for(const [e,o] of r.ch)r.off[e]=o;
    const conn={};for(const x of r.cx){conn[x[0]+'_'+x[1]]=1;conn[x[2]+'_'+x[3]]=1}
    r.term=new Set([r.order[0],r.order[r.order.length-1]]);r.trim={};
    for(const [e] of r.ch)for(const end of [0,1]){if(conn[e+'_'+end])continue;const C=CHN[e].cum,L=C[C.length-1],E=end?L:0,seg=end?L-C[C.length-2]:C[1];let bd=1e9,bs=null;
      for(const [sid,e2,s] of r.st)if(e2===e&&Math.abs(s-E)<bd){bd=Math.abs(s-E);bs=sid}
      if(bs!=null&&bd>.05&&bd<seg/2){r.trim[e+'_'+end]=bd/seg;r.term.add(bs)}}
    for(const [sid,e,s] of r.st){const L=CHN[e].cum[CHN[e].cum.length-1];if(s<.05){ENDSTOP[e+'_0']=1;if(!conn[e+'_0'])r.term.add(sid)}if(s>L-.05){ENDSTOP[e+'_1']=1;if(!conn[e+'_1'])r.term.add(sid)}}
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const s of r.segs)for(const [x,y] of s){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}r.box=[x0,y0,x1,y1];
    W0=Math.min(W0,x0);H0=Math.min(H0,y0);W1=Math.max(W1,x1);H1=Math.max(H1,y1)});
  BOX=[W0-10,H0-10,W1+10,H1+10];ZONES=[];
  if(name==='metro'){const hull=P=>{P=[...P].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[];for(const p of P){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}const up=[];for(const p of P.slice().reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}return lo.slice(0,-1).concat(up.slice(0,-1))};
    const mkz=(f,pad,both)=>{const pts=[];R.filter(f).forEach(r=>r.segs.forEach(s=>s.forEach(p=>pts.push(p))));if(pts.length<3)return;const h=hull(pts),path=new Path2D();h.forEach((p,i)=>i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]));path.closePath();ZONES.push({path,pad,both})};
    mkz(()=>true,150,false);mkz(r=>r.city==='sk',70,true);mkz(r=>r.city==='tg',70,true)}}
setGeo('map');
const GROUPS=[['さかっちバス','坂戸市'],['さかっちワゴン','坂戸市'],['つるバス','鶴ヶ島市'],['つるワゴン','鶴ヶ島市']];
// same-name nearby stops act as one place for transfers
S.forEach(s=>{s.sib=S.filter(o=>o!==s&&((o.name===s.name&&Math.hypot(o.x-s.x,o.y-s.y)<70)||o.cl===s.cl)).map(o=>o.id);s.allR=[...new Set([...s.routes,...s.sib.flatMap(i=>S[i].routes)])]});
CL.forEach(c=>{c.routes=[...new Set(c.m.flatMap(i=>S[i].routes))];c.city=c.m.some(i=>S[i].city==='both')||new Set(c.m.map(i=>S[i].city)).size>1?'both':S[c.m[0]].city});
const BUS='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a3 3 0 0 1 3 3v10.5a2 2 0 0 1-1.5 1.94V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.5h-9V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.56A2 2 0 0 1 3 16.5V6a3 3 0 0 1 3-3Zm0 2.2a.8.8 0 0 0-.8.8V11h13.6V6a.8.8 0 0 0-.8-.8H6Zm1 9.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm10 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"/></svg>';
const VAN='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8.3a2.5 2.5 0 0 1 2 1l3.7 4.9c.33.43.5.96.5 1.5V16a2 2 0 0 1-2 2h-.6a2.6 2.6 0 0 1-5.1 0H8.7a2.6 2.6 0 0 1-5.1 0H3.5A1.5 1.5 0 0 1 2 16.5v-2A1.5 1.5 0 0 1 3.5 13H4V6.5ZM6 6v4.5h4V6H6Zm6 0v4.5h6.2L15.1 6.4a.9.9 0 0 0-.7-.4H12ZM6.15 16.7a1 1 0 1 0 0 .01Zm9.8 0a1 1 0 1 0 0 .01Z"/></svg>';
const icon=r=>r.g.includes('バス')?BUS:VAN;
// ---------- canvas & camera
const cv=document.getElementById('map'),cx=cv.getContext('2d');
let DPR=1,VW=0,VH=0,sc=1,tx=0,ty=0,fitS=1;
const panelEl=document.getElementById('panel');
function isSheet(){return innerWidth<=720}
function resize(){DPR=Math.min(devicePixelRatio||1,3);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR;cv.height=VH*DPR;base.valid=false;draw()}
function fitBox(b,anim=true,pad=36,maxZ=10){const i=insets();const aw=VW-i.l-i.r-2*pad,ah=VH-i.t-i.b-2*pad;
  let s=Math.min(aw/(b[2]-b[0]),ah/(b[3]-b[1]));s=Math.min(s,fitS*maxZ);
  const cxw=(b[0]+b[2])/2,cyw=(b[1]+b[3])/2;flyTo(s,i.l+pad+aw/2-cxw*s,i.t+pad+ah/2-cyw*s,anim)}
function computeFit(){const i=insets();fitS=Math.min((VW-i.l-i.r-48)/(BOX[2]-BOX[0]),(VH-i.t-i.b-48)/(BOX[3]-BOX[1]))}
let anim=null;
function flyTo(s,x,y,a){anim=null;if(!a){sc=s;tx=x;ty=y;draw();return}const s0=sc,x0=tx,y0=ty,t0=performance.now(),D=520;
  // interpolate in world-center space for nicer motion
  const c0=[(VW/2-x0)/s0,(VH/2-y0)/s0],c1=[(VW/2-x)/s,(VH/2-y)/s];
  anim=t=>{let k=Math.min(1,(t-t0)/D);const e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;const ss=s0*Math.pow(s/s0,e);const c=[c0[0]+(c1[0]-c0[0])*e,c0[1]+(c1[1]-c0[1])*e];sc=ss;tx=VW/2-c[0]*ss;ty=VH/2-c[1]*ss;if(k>=1){sc=s;tx=x;ty=y;anim=null}};
  loop()}
const MAPB=[0,-27,1251,873];
const camIn=()=>typeof camInsets==='function'?camInsets():{l:0,t:0,r:0,b:0};
const curB=()=>{const b=MODE==='map'?MAPB:BOX,m=(MODE==='map'?.05:.07)*Math.max(b[2]-b[0],b[3]-b[1]);return [b[0]-m,b[1]-m,b[2]+m,b[3]+m]};
const coverS=()=>{const i=camIn(),B=curB();return Math.min((VW-i.l-i.r)/(B[2]-B[0]),(VH-i.t-i.b)/(B[3]-B[1]))};
const minS=()=>coverS(),maxS=()=>Math.max(fitS*22,minS()*8);
function clampCam(){const B=curB();const i=camIn(),vw=VW-i.l-i.r,vh=VH-i.t-i.b,sm=coverS();
  if(sc<sm){const X=i.l+vw/2,Y=i.t+vh/2,f=sm/sc;tx=X-(X-tx)*f;ty=Y-(Y-ty)*f;sc=sm}
  const w=(B[2]-B[0])*sc,h=(B[3]-B[1])*sc;
  tx=w<=vw?i.l+(vw-w)/2-B[0]*sc:Math.min(i.l-B[0]*sc,Math.max(i.l+vw-B[2]*sc,tx));
  ty=h<=vh?i.t+(vh-h)/2-B[1]*sc:Math.min(i.t-B[1]*sc,Math.max(i.t+vh-B[3]*sc,ty))}
function zoomAt(f,px,py){const ns=Math.max(minS(),Math.min(maxS(),sc*f));f=ns/sc;tx=px-(px-tx)*f;ty=py-(py-ty)*f;sc=ns}
let raf=0;function draw(){if(!raf)raf=requestAnimationFrame(frame)}
function loop(){draw()}
let needMore=false;
function frame(t){raf=0;needMore=false;if(anim){anim(t||performance.now());raf=requestAnimationFrame(frame)}if(inertia){inertia(t||performance.now());if(!raf)raf=requestAnimationFrame(frame)}render();if(needMore&&!raf)raf=requestAnimationFrame(frame)}
// ---------- base cache
const base={c:document.createElement('canvas'),valid:false,s:0,tx:0,ty:0,m:0};
let idleT=0;function scheduleBase(){clearTimeout(idleT);idleT=setTimeout(()=>{base.valid=false;draw()},140)}
const THEMES={light:{land:'#f0ede7',water:'#a8d2f2',waterLine:'#9fcbee',road:'#ffffff',roadCase:'#e2ded6',hw:'#f9d675',hwCase:'#e8b75a',rail:'#9aa0a8',railDash:'#ffffff',casing:'#ffffff',ink:'#2c2c2e',halo:'rgba(255,255,255,.96)',label:'#3a3a3c',labelBig:'#000',stn:'#636a75',stnText:'#5b636e',mbg:'#eef1f5',zone:'#e1e6ed',zone2:'#eaeef3'},
 dark:{land:'#1d222d',water:'#152447',waterLine:'#1b2d58',road:'#323a4b',roadCase:'#3a4356',hw:'#4a556f',hwCase:'#3b455b',rail:'#6f7789',railDash:'#1d222d',casing:'#1d222d',ink:'#0b0d12',halo:'rgba(22,26,34,.94)',label:'#e5e5ea',labelBig:'#fff',stn:'#8a93a6',stnText:'#aeb6c6',mbg:'#141920',zone:'#1e2530',zone2:'#161b24'}};
let COL=THEMES.light;
function renderBase(){const m=0.2;const ox=Math.round(VW*m),oy=Math.round(VH*m);const bw=VW+2*ox,bh=VH+2*oy;
  const bd=Math.min(DPR,Math.sqrt(7e6/(bw*bh)));base.d=bd;const c=base.c;const W=Math.round(bw*bd),H=Math.round(bh*bd);if(c.width!==W||c.height!==H){c.width=W;c.height=H}
  const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.fillStyle=(MODE==='metro'?COL.mbg:COL.land);g.fillRect(0,0,c.width,c.height);
  g.setTransform(bd*sc,0,0,bd*sc,bd*(tx+ox),bd*(ty+oy));
  const z=sc/fitS,px=1/sc;
  g.lineJoin='round';g.lineCap='round';
  if(MODE==='metro'){let st=30;while(st*sc<14)st*=2;const x0=Math.floor((-tx-ox)/sc/st)*st,x1=(-tx-ox+bw)/sc,y0=Math.floor((-ty-oy)/sc/st)*st,y1=(-ty-oy+bh)/sc;
    g.beginPath();for(let x=x0;x<=x1;x+=st){g.moveTo(x,y0);g.lineTo(x,y1)}for(let y=y0;y<=y1;y+=st){g.moveTo(x0,y);g.lineTo(x1,y)}g.strokeStyle=COL.zone;g.lineWidth=1/sc;g.stroke();
    base.valid=true;base.s=sc;base.tx=tx;base.ty=ty;base.ox=ox;base.oy=oy;return}
  // water
  g.fillStyle=COL.water;g.fill(P.water);
  if(z>1.2){g.globalAlpha=Math.min(1,(z-1.2)/1.2)*.9;g.strokeStyle=COL.waterLine;g.lineWidth=Math.min(1.3,.5+z*.12)*px;g.stroke(P.creek);g.globalAlpha=1}
  // roads
  const ra=Math.min(1,.5+z*.2);g.globalAlpha=ra;if(z>3.2){g.strokeStyle=COL.roadCase;g.lineWidth=Math.max(.6,Math.min(1.6,z*.3))*px;g.stroke(ROAD)}g.fillStyle=COL.road;g.fill(ROAD);g.globalAlpha=1;
  // highways
  g.strokeStyle=COL.hwCase;g.lineWidth=Math.max(4,Math.min(9,3+z*.9))*px;g.stroke(P.hw);g.strokeStyle=COL.hw;g.lineWidth=Math.max(2.4,Math.min(6.5,1.8+z*.75))*px;g.stroke(P.hw);
  // rail
  const rw=Math.max(2.6,Math.min(5,2+z*.4));g.strokeStyle=COL.rail;g.lineWidth=rw*px;g.stroke(P.rail);g.strokeStyle=COL.railDash;g.lineWidth=(rw-1.6)*px;g.setLineDash([6*px,6*px]);g.stroke(P.rail);g.setLineDash([]);
  base.valid=true;base.s=sc;base.tx=tx;base.ty=ty;base.ox=ox;base.oy=oy}
// ---------- state
let sel=null,pick=null,filter='all',plan=null;
const routeOn=k=>plan?plan.r.has(k):sel?k===sel:pick!=null?S[pick].allR.includes(k):true;
// ---------- label measurement
const mcache=new Map();function tw(txt,font){const k=font+'|'+txt;let w=mcache.get(k);if(w==null){cx.font=font;w=cx.measureText(txt).width;mcache.set(k,w)}return w}
const FONT='600 11.5px '+getComputedStyle(document.body).fontFamily, FONTB='700 13px '+getComputedStyle(document.body).fontFamily, FONTS='600 11px '+getComputedStyle(document.body).fontFamily, FONTC='600 15px '+getComputedStyle(document.body).fontFamily;
// ---------- render
function render(){
  clampCam();
  const g=cx;g.setTransform(DPR,0,0,DPR,0,0);
  const moving=dragging||anim||inertia||pinching||ptrs.size>0;
  if(!moving&&(!base.valid||base.s!==sc||base.tx!==tx||base.ty!==ty))renderBase();
  // draw cached base with relative transform
  g.fillStyle=(MODE==='metro'?COL.mbg:COL.land);g.fillRect(0,0,VW,VH);
  if(base.s){const k=sc/base.s;g.save();
    if(k===1&&base.tx===tx&&base.ty===ty&&base.d===DPR){g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.drawImage(base.c,-base.ox*DPR,-base.oy*DPR)}
    else{g.imageSmoothingQuality='high';g.setTransform(k,0,0,k,DPR*(tx-base.tx*k)-base.ox*DPR*k,DPR*(ty-base.ty*k)-base.oy*DPR*k);g.scale(DPR/base.d,DPR/base.d);g.drawImage(base.c,0,0)}
    g.restore()}
  if(moving)scheduleBase();
  g.setTransform(DPR*sc,0,0,DPR*sc,DPR*tx,DPR*ty);
  const z=sc/fitS,px=1/sc,fade=!!(plan||sel||pick!=null);
  g.lineJoin='round';g.lineCap='round';
  // ---- animated state helpers
  const now=performance.now(),dt=Math.min(80,now-(render.last||now));render.last=now;
  const step=(o,key,target,spd)=>{const v=o[key]??target;const k=1-Math.pow(.5,dt/spd);const nv=Math.abs(target-v)<.01?target:v+(target-v)*k;o[key]=nv;if(nv!==target)needMore=true;return nv};
  const sm=(e0,e1,x)=>{const k=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return k*k*(3-2*k)};
  // routes as parallel lanes (constant pixel spacing)
  const MT=MODE==='metro';const lw=MT?Math.max(2.2,Math.min(5,1.3+z*.6)):Math.max(1.4,Math.min(3.2,0.9+z*.36)),selW=Math.max(3.2,Math.min(6,2.2+z*.55))+(MT?1.2:0);const spread=MT?sm(.8,1.8,z):sm(1.2,2.6,z);const SP=lw*(.35+.65*spread)+(MT?.9:.2)*spread;const CAS=1.5+.7*spread;
  g.setTransform(DPR,0,0,DPR,0,0);g.lineJoin='round';g.lineCap='round';
  const vis=R.filter(r=>filter==='all'||r.city===filter);
  for(const r of R){const on=routeOn(r.k);step(r,'_a',vis.includes(r)?(fade&&!on?(sel||plan?.12:.18):1):0,70);step(r,'_w',(sel===r.k||(plan&&plan.r.has(r.k)))?1:0,80)}
  const PX=CHN.map(c=>c.p.map(q=>[q[0]*sc+tx,q[1]*sc+ty]));const Rc0=MODE==='metro'?Math.max(5*sc,8):Math.max(3.2*sc,7);
  const sN=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1e-6;return [dx/l,dy/l,l]};
  const corner=(p,A,V,B,o1,o2,tight)=>{const Rc=tight?2.5:Rc0;const [ux,uy,la]=sN(A,V),[vx,vy,lc]=sN(V,B);const cr=ux*vy-uy*vx,dt=ux*vx+uy*vy,th=Math.atan2(Math.abs(cr),dt);
    const s=[(A[0]+V[0])/2-uy*o1,(A[1]+V[1])/2+ux*o1],e=[(V[0]+B[0])/2-vy*o2,(V[1]+B[1])/2+vx*o2];p.moveTo(s[0],s[1]);
    if(Math.abs(o1-o2)>.05){const D=Math.min(Math.max(Rc*Math.tan(th/2)+Math.abs(o1-o2)*2.5,12),la/2,lc/2),h=D*.62;const q1=[V[0]-ux*D-uy*o1,V[1]-uy*D+ux*o1],q2=[V[0]+vx*D-vy*o2,V[1]+vy*D+vx*o2];p.lineTo(q1[0],q1[1]);p.bezierCurveTo(q1[0]+ux*h,q1[1]+uy*h,q2[0]-vx*h,q2[1]-vy*h,q2[0],q2[1]);p.lineTo(e[0],e[1]);return {T:D,bz:[q1,[q1[0]+ux*h,q1[1]+uy*h],[q2[0]-vx*h,q2[1]-vy*h],q2]}}
    const o=o1;if(th<.02){p.lineTo(e[0],e[1]);return}
    if(th>2.7){p.lineTo(V[0]-uy*o,V[1]+ux*o);p.lineTo(V[0]-vy*o,V[1]+vx*o);p.lineTo(e[0],e[1]);return}
    const tn=Math.tan(th/2),sg=Math.sign(cr),k0=o/(1+dt),M=[V[0]+(-uy-vy)*k0,V[1]+(ux+vx)*k0];
    const Tc=Math.min(Rc*tn,la/2,lc/2),tl=Tc-sg*o*tn;
    if(tl<.4){p.lineTo(M[0],M[1]);p.lineTo(e[0],e[1]);return {T:1.5,bz:[M,M,M,M]}}
    const rad=tl/tn,k=4/3*Math.tan(th/4)*rad,p1=[M[0]-ux*tl,M[1]-uy*tl],p2=[M[0]+vx*tl,M[1]+vy*tl];
    p.lineTo(p1[0],p1[1]);p.bezierCurveTo(p1[0]+ux*k,p1[1]+uy*k,p2[0]-vx*k,p2[1]-vy*k,p2[0],p2[1]);p.lineTo(e[0],e[1]);return {T:Tc,bz:[p1,[p1[0]+ux*k,p1[1]+uy*k],[p2[0]-vx*k,p2[1]-vy*k],p2]}};
  const bez=(b,u)=>{const v=1-u,a=v*v*v,c=3*v*v*u,d=3*v*u*u,e=u*u*u;return [a*b[0][0]+c*b[1][0]+d*b[2][0]+e*b[3][0],a*b[0][1]+c*b[1][1]+d*b[2][1]+e*b[3][1]]};
  const lanePath=r=>{const p=new Path2D();r._sp={};r._spc={};const FI={},FE={};const has={};for(const x of r.cx){has[x[0]+'_'+x[1]]=1;has[x[2]+'_'+x[3]]=1}
    for(const [e,of] of r.ch){const P=PX[e],n=P.length-1,o=of*SP;
      for(let i=1;i<n;i++)FI[e+'_'+i]=corner(p,P[i-1],P[i],P[i+1],o,o);
      for(const end of [0,1]){if(has[e+'_'+end])continue;const a=end?P[n]:P[0],b=end?P[n-1]:P[1];const [ux,uy]=sN(P[end?n-1:0],P[end?n:1]);
        const f=r.trim[e+'_'+end]||0,ax=a[0]+(b[0]-a[0])*f,ay=a[1]+(b[1]-a[1])*f;p.moveTo(ax-uy*o,ay+ux*o);p.lineTo((a[0]+b[0])/2-uy*o,(a[1]+b[1])/2+ux*o)}}
    for(const [ca,ea,cb,eb] of r.cx){const Pa=PX[ca],na=Pa.length-1,Pb=PX[cb],nb=Pb.length-1;
      const fi=corner(p,ea?Pa[na-1]:Pa[1],ea?Pa[na]:Pa[0],eb?Pb[nb-1]:Pb[1],r.off[ca]*SP*(ea?1:-1),r.off[cb]*SP*(eb?-1:1),ENDSTOP[ca+'_'+ea]||ENDSTOP[cb+'_'+eb]);if(fi){if(!FE[ca+'_'+ea])FE[ca+'_'+ea]={T:fi.T,bz:fi.bz,B:0};if(!FE[cb+'_'+eb])FE[cb+'_'+eb]={T:fi.T,bz:fi.bz,B:1}}}
    for(const [sid,e,s] of r.st){const C=CHN[e],P=PX[e],n=P.length-1;let i=1;while(i<C.cum.length-1&&C.cum[i]<s)i++;const f=(s-C.cum[i-1])/((C.cum[i]-C.cum[i-1])||1);const [ux,uy,len]=sN(P[i-1],P[i]);const o=r.off[e]*SP;
      let pt=[P[i-1][0]+(P[i][0]-P[i-1][0])*f-uy*o,P[i-1][1]+(P[i][1]-P[i-1][1])*f+ux*o];const dS=f*len,dE=(1-f)*len;
      const fe=i<n?FI[e+'_'+i]:FE[e+'_1'],fs=i-1>0?FI[e+'_'+(i-1)]:FE[e+'_0'];
      if(fe&&dE<fe.T)pt=bez(fe.bz,(i<n||!fe.B)?(fe.T-dE)/(2*fe.T):.5+dE/(2*fe.T));
      else if(fs&&dS<fs.T)pt=bez(fs.bz,(i-1>0||fs.B)?.5+dS/(2*fs.T):(fs.T-dS)/(2*fs.T));
      pt.push(-uy,ux);r._sp[sid]=pt;r._spc[sid]=e}
    return p};
  const drawn=R.filter(r=>r._a>.02).sort((a,b)=>(a._a-b._a)||(a._w-b._w));
  const paths=new Map(drawn.map(r=>[r,lanePath(r)]));window.__paths=paths;
  for(const r of drawn){const w=lw+(selW-lw)*r._w;g.globalAlpha=r._a;g.strokeStyle=COL.casing;g.lineWidth=w+CAS;g.stroke(paths.get(r))}
  for(const r of drawn){const w=lw+(selW-lw)*r._w;g.globalAlpha=r._a;g.strokeStyle=r.c;g.lineWidth=w;g.stroke(paths.get(r))}
  g.globalAlpha=1;
  const boxes=[],dots=[];const ov=(b,o,p)=>b[0]-p<o[2]&&b[2]+p>o[0]&&b[1]-p<o[3]&&b[3]+p>o[1];
  const hit=(b,p=0,own=null)=>{for(const o of boxes)if(ov(b,o,p))return true;for(const o of dots)if(o!==own&&ov(b,o,3))return true;return false};
  // ---- stops (small, native-style)
  for(const el of [document.getElementById('ctrl'),document.getElementById('scale')]){const r=el.getBoundingClientRect();boxes.push([r.left-4,r.top-4,r.right+4,r.bottom+4])}
  if(!isSheet()){const r=panelEl.getBoundingClientRect();boxes.push([r.left,r.top,r.right+6,r.bottom])}
  const dotZ=sm(1.35,2.1,z);const stopsShown=[];
  let PIN=null;
  const capsule=(P,r,sw,ring,al)=>{g.globalAlpha=al;g.lineCap='round';g.lineJoin='round';
    if(P.length===1){g.beginPath();g.arc(P[0][0],P[0][1],r,0,7);g.fillStyle='#fff';g.fill();g.lineWidth=sw;g.strokeStyle=ring;g.stroke();return}
    g.beginPath();g.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)g.lineTo(P[i][0],P[i][1]);
    g.strokeStyle=ring;g.lineWidth=2*r+sw;g.stroke();g.strokeStyle='#fff';g.lineWidth=2*r-sw;g.stroke()};
  // pass 1: geometry + eligibility
  const items=[];window.__forced=[];
  for(const c of CL){const inF=filter==='all'||c.city===filter||c.city==='both';
    const onR=plan?plan.c.has(c.id):sel?c.routes.includes(sel):true;const onP=pick!=null&&c.m.includes(pick);const isT=c.term;
    c._want=false;c._dot=null;c._P=null;
    const elig=inF&&(sel||plan?onR:pick!=null?(onP||c.routes.some(k=>S[pick].allR.includes(k))):(isT||z>1.6));
    const G={},TG={};for(const i of c.m)for(const k of S[i].routes){if(plan?!plan.r.has(k):sel?(onR&&k!==sel):(pick!=null&&!S[pick].allR.includes(k)))continue;const q=RK[k]._sp&&RK[k]._a>.02?RK[k]._sp[i]:null;if(q){const e_=RK[k]._spc[i];(G[e_]=G[e_]||[]).push(q);if(RK[k].term.has(i))TG[e_]=1}}
    let grp=Object.keys(G).map(e=>({pts:G[e].slice(),main:G[e]}));
    if(!grp.length)continue;
    {let merged=true;while(merged&&grp.length>1){merged=false;
      outer:for(let i=0;i<grp.length;i++)for(let j=i+1;j<grp.length;j++){let near=false;for(const a of grp[i].pts)for(const b of grp[j].pts)if(Math.hypot(a[0]-b[0],a[1]-b[1])<14*sc)near=true;
        if(near){grp[i]={pts:[...grp[i].pts,...grp[j].pts],main:grp[i].main.length>=grp[j].main.length?grp[i].main:grp[j].main};grp.splice(j,1);merged=true;break outer}}}}
    // one capsule per stop, always square to the line it sits on
    const caps=grp.map(gp=>{const m0=gp.main[0];let nx=0,ny=0;for(const q of gp.main){const s=(q[2]*m0[2]+q[3]*m0[3])<0?-1:1;nx+=q[2]*s;ny+=q[3]*s}const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
      let mx=0,my=0;for(const q of gp.pts){mx+=q[0];my+=q[1]}mx/=gp.pts.length;my/=gp.pts.length;let lo=1e9,hi=-1e9;for(const q of gp.pts){const d=(q[0]-mx)*nx+(q[1]-my)*ny;lo=Math.min(lo,d);hi=Math.max(hi,d)}
      return hi-lo<1.5?[[mx+nx*(lo+hi)/2,my+ny*(lo+hi)/2]]:[[mx+nx*lo,my+ny*lo],[mx+nx*hi,my+ny*hi]]});
    c._pts=grp.flatMap(gp=>gp.pts);
    if(caps.length>1){const A=caps.flat();let bi=0,bj=0,bd=-1;for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const d=Math.hypot(A[i][0]-A[j][0],A[i][1]-A[j][1]);if(d>bd){bd=d;bi=i;bj=j}}
      const ax=A[bj][0]-A[bi][0],ay=A[bj][1]-A[bi][1];A.sort((p,q)=>(p[0]*ax+p[1]*ay)-(q[0]*ax+q[1]*ay));caps.length=0;caps.push(A)}
    const P=caps.flat();c._caps=caps;c._end=Object.keys(TG).length>0;
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [x,y] of P){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
    let r=(isT?2.6:2.2)+sm(1.4,6,z)*1.6;if(sel&&onR)r+=.4;
    c._P=P;c._r=r;c._bb=[x0-r,y0-r,x1+r,y1+r];c._onR=onR;c._onP=onP;
    if((elig||(c._end&&inF&&!sel&&!plan&&pick==null))&&!(x1<-30||x0>VW+30||y1<-30||y0>VH+30))items.push(c)}
  const dprio=c=>(c._onP?1e6:0)+(c._end?5e5:0)+(c.term?1e4:0)+(c._a>.5?2e3:0)+c.routes.length*100+c.m.length;
  items.sort((a,b)=>dprio(b)-dprio(a));
  for(const c of items){const b=c._bb;let ok=true;for(const o of dots)if(b[0]-2<o[2]&&b[2]+2>o[0]&&b[1]-2<o[3]&&b[3]+2>o[1]){ok=false;break}
    if(ok||c._onP){c._want=true;c._dot=[b[0]-1,b[1]-1,b[2]+1,b[3]+1];dots.push(c._dot);stopsShown.push(c)}
    else if(c._end){c._want=true;c._dot=null;c._forced=1;(window.__forced=window.__forced||[]).push(c.name)}}
  // pass 2: draw (animated)
  for(const c of CL){const al=step(c,'_a',c._want?1:0,70);const pk=step(c,'_p',c._onP?1:0,70);if(al<.02||!c._P)continue;
    const P=c._P,r=c._r+pk*2,isT=c.term,onR=c._onR;const multi=c.routes.length>1&&!sel;
    const ring=COL.ink;
    if(pk>.01){g.globalAlpha=al*pk*.12;g.lineCap='round';g.beginPath();g.moveTo(P[0][0],P[0][1]);for(const p of P)g.lineTo(p[0],p[1]);g.lineWidth=2*r+12;g.strokeStyle='#000';g.stroke()}
    for(const cp of c._caps)capsule(cp,r,1.6,ring,al);
    if(pk>.01){PIN={x:(P[0][0]+P[P.length-1][0])/2,y:(P[0][1]+P[P.length-1][1])/2,k:pk,r}}
    g.globalAlpha=1}
  // ---- station markers (compact)
  const stZ=sm(.7,1.1,z);
  for(const st of (MODE==='metro'?[]:NET.stations)){const [n,x,y]=st;const X=x*sc+tx,Y=y*sc+ty;
    const sd=[X-8,Y-8,X+8,Y+8];let fits=X>-60&&X<VW+60&&Y>-40&&Y<VH+40&&!dots.some(o=>sd[0]<o[2]&&sd[2]>o[0]&&sd[1]<o[3]&&sd[3]>o[1]);
    const label=n+'駅';const w=tw(label,FONTS);const SC=[[X-w/2,Y+9],[X-w/2,Y-23],[X+10,Y-7],[X-10-w,Y-7]];let lb=null;
    if(fits){dots.push(sd);if(stZ>.01){const ord=st._side!=null?[st._side,0,1,2,3]:[0,1,2,3];for(const i of ord){const c=SC[i];const bb=[c[0]-2,c[1],c[0]+w+2,c[1]+14];if(!hit(bb,5,sd)){lb=bb;st._side=i;break}}}}
    const ia=step(st,'_i',fits?1:0,80),la=step(st,'_a',lb?stZ:0,90);
    if(ia>.02){g.globalAlpha=ia;g.beginPath();g.roundRect(X-5.5,Y-5.5,11,11,3);g.fillStyle=COL.stn;g.fill();g.lineWidth=1.2;g.strokeStyle='#fff';g.stroke();
      g.fillStyle='#fff';g.fillRect(X-2.5,Y-2.8,5,3.6);g.fillRect(X-3,Y+1.4,1.4,1.4);g.fillRect(X+1.6,Y+1.4,1.4,1.4)}
    if(la>.02){const c=SC[st._side??0];g.globalAlpha=la;g.font=FONTS;g.textAlign='left';g.lineJoin='round';g.lineWidth=3;g.strokeStyle=COL.halo;g.strokeText(label,c[0],c[1]+11);g.fillStyle=COL.stnText;g.fillText(label,c[0],c[1]+11)}
    g.globalAlpha=1;if(lb)boxes.push(lb)}
  // ---- stop labels: priority + hysteresis + fade
  g.textAlign='left';
  const pc=pick!=null?CL[S[pick].cl]:null;
  const nameOf=c=>{if(sel){const m=c.m.find(i=>S[i].routes.includes(sel));return S[m??c.m[0]].name}return c.name};
  const prio=c=>(c===pc?1e6:0)+(c._lv>0.5?500:0)+(c.term?300:0)+c.routes.length*40;
  let cand;
  if(plan){cand=plan.order.map(i=>CL[i])}
  else if(sel){cand=[...new Set(RK[sel].order.map(i=>CL[S[i].cl]))]}
  else if(pc)cand=[pc];
  else{const tier=z<1.7?(c=>c.term):z<2.8?(c=>c.term||c.routes.length>=2||c.m.some(i=>S[i].allR.length>=2)):(()=>true);cand=stopsShown.filter(tier)}
  if(pc&&!cand.includes(pc))cand.unshift(pc);
  cand.sort((a,b)=>prio(b)-prio(a));
  const placed=new Set(),names=new Set();
  const cbox=c=>c._dot||(()=>{const X=c.c[0]*sc+tx,Y=c.c[1]*sc+ty;return [X-3,Y-3,X+3,Y+3]})();
  const cands=(c,w,h,o)=>{const d=cbox(c);const my=(d[1]+d[3])/2,mx=(d[0]+d[2])/2;return [[d[2]+o-2,my-h/2],[d[0]-o+2-w,my-h/2],[mx-w/2,d[1]-h-o+3],[mx-w/2,d[3]+o-3]]};
  for(const c of cand){const nm=nameOf(c);if(!sel&&!plan&&names.has(nm))continue;const X=c.c[0]*sc+tx,Y=c.c[1]*sc+ty;if(X<-100||X>VW+100||Y<-30||Y>VH+30)continue;
    const big=c===pc;const f=big?FONTB:FONT;const w=tw(nm,f),h=big?16:14;const C=cands(c,w,h,big?9:6.5);
    const ord=c._side!=null?[c._side,...[0,1,2,3].filter(i=>i!==c._side)]:[0,1,2,3];
    for(const i of ord){const [bx,by]=C[i];const bb=[bx,by,bx+w,by+h];if(bx<6||bx+w>VW-6)continue;if(!big&&hit(bb,5,c._dot))continue;boxes.push(bb);c._side=i;placed.add(c);names.add(nm);c._nm=nm;break}}
  for(const c of CL){const tgt=placed.has(c)?1:0;if(c._lv==null){if(!tgt)continue;c._lv=0}const al=step(c,'_lv',tgt,tgt?90:60);if(al<.02){if(!tgt)c._side=null;continue}
    const big=c===pc;const f=big?FONTB:FONT;const nm=c._nm||c.name;const w=tw(nm,f),h=big?16:14;const [bx,by]=cands(c,w,h,big?9:6.5)[c._side??0];
    g.globalAlpha=al;g.font=f;g.textAlign='left';g.lineJoin='round';g.lineWidth=3.2;g.strokeStyle=COL.halo;g.strokeText(nm,bx,by+h-3.5);g.fillStyle=big?COL.labelBig:COL.label;g.fillText(nm,bx,by+h-3.5)}
  if(PIN){const k=PIN.k,s=.6+.4*k,x=PIN.x,y=PIN.y-PIN.r-6;g.save();g.translate(x,y);g.scale(s,s);g.globalAlpha=Math.min(1,k*1.4);
    g.shadowColor='rgba(0,0,0,.28)';g.shadowBlur=10;g.shadowOffsetY=3;g.fillStyle='#0a84ff';g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-3,-7,-13,-10,-13,-22);g.arc(0,-22,13,Math.PI,0);g.bezierCurveTo(13,-10,3,-7,0,0);g.fill();g.shadowColor='transparent';
    g.fillStyle='#fff';g.beginPath();g.roundRect(-6.5,-29.5,13,13,3);g.fill();g.fillStyle='#0a84ff';g.fillRect(-4.5,-27.5,9,5);g.beginPath();g.arc(-3.3,-19.3,1.2,0,7);g.arc(3.3,-19.3,1.2,0,7);g.fill();g.restore()}
  g.globalAlpha=1;window.__dbg={dots:dots.slice(),boxes:boxes.slice()};
  // scale bar (approx 1pt ≈ 6.9m)
  const mPerPx=6.9/sc;const nice=[50,100,200,250,500,1000,2000,5000];let L=nice[0];for(const n of nice){if(n/mPerPx<110)L=n}
  document.getElementById('sb').style.width=(L/mPerPx)+'px';document.getElementById('sl').textContent=L>=1000?(L/1000)+' km':L+' m';
}
// ---------- input: pointer pan / pinch / inertia
const ptrs=new Map();let dragging=false,pinching=false,moved=0,last=null,vel=[0,0],lastT=0,pinch0=null,inertia=null,downAt=null,lastTap=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});anim=null;inertia=null;
  if(ptrs.size===1){moved=0;last={x:e.clientX,y:e.clientY};lastT=performance.now();vel=[0,0];downAt={x:e.clientX,y:e.clientY}}
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};pinching=true;moved=99}});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size>=2&&pinch0){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    tx+=m.x-pinch0.m.x;ty+=m.y-pinch0.m.y;zoomAt(d/pinch0.d,m.x,m.y);pinch0={d,m};draw();return}
  if(ptrs.size===1&&last){const dx=e.clientX-last.x,dy=e.clientY-last.y;const now=performance.now();moved+=Math.abs(dx)+Math.abs(dy);
    if(moved>6){dragging=true;cv.classList.add('drag');tx+=dx;ty+=dy;const dt=Math.max(1,now-lastT);vel=[vel[0]*.6+dx/dt*.4*16,vel[1]*.6+dy/dt*.4*16];draw()}
    last={x:e.clientX,y:e.clientY};lastT=now}});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(ptrs.size===1){const v=[...ptrs.values()][0];last={x:v.x,y:v.y};pinch0=null;return}
  if(ptrs.size===0){cv.classList.remove('drag');const wasDrag=dragging;dragging=false;pinch0=null;
    if(pinching){pinching=false;scheduleBase();draw();return}
    if(wasDrag&&performance.now()-lastT<80&&Math.hypot(vel[0],vel[1])>1.5){let v=[...vel],t0=performance.now();
      inertia=t=>{const dt=Math.min(32,t-t0);t0=t;tx+=v[0]*dt/16;ty+=v[1]*dt/16;const k=Math.pow(.92,dt/16);v[0]*=k;v[1]*=k;if(Math.hypot(v[0],v[1])<.2){inertia=null;scheduleBase()}};draw()}
    else if(!wasDrag&&moved<=6&&e.type==='pointerup'){const now=performance.now();
      if(now-lastTap<300){lastTap=0;const f=1.8;const s0=sc;const ns=Math.min(maxS(),sc*f);const k=ns/sc;flyTo(ns,e.clientX-(e.clientX-tx)*k,e.clientY-(e.clientY-ty)*k,true)}
      else{lastTap=now;tap(e.clientX,e.clientY)}}
    scheduleBase()}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();anim=null;inertia=null;
  const mouseWheel=e.deltaMode===1||(e.deltaX===0&&Math.abs(e.deltaY)>=40&&Number.isInteger(e.deltaY));
  if(e.ctrlKey||mouseWheel){zoomAt(Math.exp(-e.deltaY*(e.ctrlKey?.012:.0022)*(e.deltaMode===1?16:1)),e.clientX,e.clientY)}
  else{tx-=e.deltaX;ty-=e.deltaY}draw();scheduleBase()},{passive:false});
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.target===cv)e.preventDefault()},{passive:false});
// ---------- hit testing
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
function tap(X,Y){const wx=(X-tx)/sc,wy=(Y-ty)/sc;
  let best=null,bd=1e9;for(const c of CL){if(!(c._a>.3)||!c._P)continue;const Q=c._P;for(let i=0;i<Q.length;i++){const p=Q[i],q=Q[Math.min(i+1,Q.length-1)];const d=segDist(X,Y,p[0],p[1],q[0],q[1]);if(d<bd){bd=d;best=c}}}
  if(best&&bd<16){let id=best.m[0];if(sel){const m=best.m.find(i=>S[i].routes.includes(sel));if(m!=null)id=m}else if(best.m.length>1){id=best.m.reduce((a,b)=>S[b].routes.length>S[a].routes.length?b:a)}selectStop(id,false);return}
  let br=null,brd=1e9;for(const r of R){if(!(filter==='all'||r.city===filter))continue;for(const sg of r.segs)for(let i=1;i<sg.length;i++){const d=segDist(wx,wy,sg[i-1][0],sg[i-1][1],sg[i][0],sg[i][1])*sc;if(d<brd||(d<brd+3&&r.k===sel)){brd=d;br=r}}}
  if(br&&brd<12){selectRoute(br.k,false);return}
  if(sel||pick!=null)home()}
