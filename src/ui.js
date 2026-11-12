// ================= UI layer =================
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let fav=store.get('bus.fav',{r:[],s:[]}),recent=store.get('bus.recent',[]);
const I={back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>',
 starOn:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>',
 route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
 swap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4v15M8 19l-3.5-3.5M8 19l3.5-3.5M16 20V5M16 5l-3.5 3.5M16 5l3.5 3.5"/></svg>',
 search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/></svg>',
 sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
 moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.500 10.500z"/></svg>',
 auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.500 8.500 0 0 1 0 17z" fill="currentColor"/></svg>',
 layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><path d="M3 6.6l6-2.400 6 2.400 6-2.400v13.200l-6 2.400-6-2.400-6 2.400z"/><path d="M9 4.200v13.200M15 6.600v13.200"/></svg>',
 x:'<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>'};
const CHEV='<svg class="chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.500 1.500L7 7l-5.500 5.500"/></svg>';
const cityName=c=>c==='tg'?'鶴ヶ島市':c==='both'?'坂戸市／鶴ヶ島市':'坂戸市';
// ---------- toast
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1500)}
// ---------- theme
let themeMode=store.get('bus.theme','auto');const mq=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const d=themeMode==='auto'?(mq.matches?'dark':'light'):themeMode;document.documentElement.dataset.theme=d;{const tc=document.querySelector('meta[name=theme-color]');if(tc)tc.content=d==='dark'?'#1d222d':'#f0ede7';const sb=document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]');if(sb)sb.content=d==='dark'?'black':'default'}COL=THEMES[d];base.valid=false;draw()}
function setTheme(m){themeMode=m;store.set('bus.theme',m);applyTheme()}
mq.addEventListener&&mq.addEventListener('change',applyTheme);
// ---------- map / diagram mode
$('mode').innerHTML=I.layers;
function reframe(anim){for(let i=pages.length-1;i>=0;i--)if(pages[i].frame){pages[i].frame(anim);return}fitBox(filter==='all'?BOX:boxOf(filter),anim)}
function setMode(m,quiet){if(m===MODE&&!quiet)return;setGeo(m);store.set('bus.mode',m);$('scale').style.display=m==='metro'?'none':'';$('attr').textContent=m==='metro'?'路線図：距離・方角は実際と異なります':'地図・路線：坂戸市／鶴ヶ島市 路線図より作成';
  base.valid=false;computeFit();if(!quiet)reframe(false);draw()}
$('mode').onclick=()=>{const pg=topPg();if(pg&&pg.kind==='settings')pop();else push(settingsPage())};
let scaleT=0;function showScale(){if(!isSheet())return;const el=$('scale');el.classList.add('on');clearTimeout(scaleT);scaleT=setTimeout(()=>el.classList.remove('on'),1300)}
// ---------- sheet (transform-driven, velocity snapping, content-drag, interactive swipe-back)
let sheetState='mid',sheetPx=0,sheetTy=0,TOPGAP=54,SAB=0;
function measureInsets(){const t=$('sat').getBoundingClientRect().height||0;SAB=$('sab').getBoundingClientRect().height||0;TOPGAP=t>0?Math.round(t+8):44;document.documentElement.style.setProperty('--topgap',TOPGAP+'px')}
const panelH=()=>innerHeight-TOPGAP;
const tyOf=s=>s==='full'?0:s==='mid'?panelH()-Math.round(innerHeight*.44):panelH()-(86+SAB);
function applyTy(v){sheetTy=v;panelEl.style.setProperty('--ty',v+'px');const m=tyOf('mid'),p=Math.max(0,Math.min(1,(m-v)/(m||1)));
  $('dim').style.opacity=(p*(document.documentElement.dataset.theme==='dark'?.42:.24)).toFixed(3);$('ctrl').classList.toggle('off',p>.45)}
function setSheet(s){setTimeout(()=>draw(),0);const was=sheetState;sheetState=s;if(!isSheet()){sheetPx=0;panelEl.style.removeProperty('--ty');panelEl.classList.remove('locked');$('dim').style.opacity=0;$('ctrl').classList.remove('off');return}applyTy(tyOf(s));sheetPx=panelH()-sheetTy;panelEl.classList.toggle('locked',s!=='full');if(was!==s&&typeof settle==='function'&&VW)settle()}
function camInsets(){if(isSheet())return{l:0,t:0,r:0,b:Math.min(sheetPx,panelH()-tyOf('mid'))};const pr=panelEl.getBoundingClientRect();return{l:pr.right+14,t:0,r:0,b:0}}
function insets(){if(isSheet())return{l:0,t:TOPGAP>44?TOPGAP-8:0,r:0,b:Math.min(sheetPx,panelH()-tyOf('mid'))};const pr=panelEl.getBoundingClientRect();return{l:pr.right,t:0,r:60,b:0}}
(function(){let st=null;const W=()=>stackEl.clientWidth||1;
  const begin=(x,y,target)=>{if(target.closest('input'))return;const sc_=target.closest('.scroll');const edge=x-panelEl.getBoundingClientRect().left<26;
    st={x,y,ty0:sheetTy,mode:null,vy:0,vx:0,ly:y,lx:x,lt:performance.now(),sc:sc_,nav:!!target.closest('.nav,.grab'),edge}};
  const backStart=()=>{const t=topPg(),p=pages[pages.length-2];st.mode='back';st.t=t;st.p=p;t.el.classList.add('dragx');p.el.classList.add('dragx')};
  const backMove=dx=>{const k=Math.max(0,Math.min(1,dx/W()));st.t.el.style.transform=`translateX(${k*100}%)`;st.p.el.style.transform=`translateX(${-28*(1-k)}%)`;st.p.el.style.clipPath=`inset(0 ${72*(1-k)}% 0 0)`;st.p.el.style.opacity=.55+.45*k};
  const backEnd=(dx,done)=>{const {t,p}=st;t.el.classList.remove('dragx');p.el.classList.remove('dragx');t.el.offsetWidth;t.el.style.transform='';p.el.style.transform='';p.el.style.clipPath='';p.el.style.opacity='';if(done)pop()};
  const move=(x,y,ev)=>{if(!st)return;const dx=x-st.x,dy=y-st.y;const now=performance.now(),dt=Math.max(1,now-st.lt);
    if(!st.mode){if(Math.hypot(dx,dy)<7)return;
      if(pages.length>1&&dx>0&&Math.abs(dx)>Math.abs(dy)*1.3&&(st.edge||st.nav)){st.x=x;backStart()}
      else if(!isSheet())st.mode='none';
      else if(sheetState!=='full'||st.nav||!st.sc||(st.sc.scrollTop<=0&&dy>0)){st.mode='sheet';st.y=y;st.ty0=sheetTy;panelEl.classList.add('dragging');document.body.classList.add('sheet-drag')}
      else st.mode='scroll'}
    if(st.mode==='back'){ev&&ev.cancelable&&ev.preventDefault();st.vx=.6*st.vx+.4*(x-st.lx)/dt;st.lx=x;st.lt=now;backMove(x-st.x)}
    if(st.mode==='sheet'){ev&&ev.cancelable&&ev.preventDefault();st.vy=.65*st.vy+.35*(y-st.ly)/dt;st.ly=y;st.lt=now;
      let v=st.ty0+(y-st.y);const lo=0,hi=tyOf('min');if(v<lo)v=lo-Math.pow(lo-v,.7);if(v>hi)v=hi+Math.pow(v-hi,.7);applyTy(v)}};
  const end=x=>{if(!st)return;const s=st;
    if(s.mode==='back'){const dx=x-s.x;backEnd(dx,dx>W()*.38||s.vx>.45);st=null;suppressClick();return}
    st=null;if(s.mode!=='sheet')return;panelEl.classList.remove('dragging');document.body.classList.remove('sheet-drag');suppressClick();
    const proj=sheetTy+s.vy*240;let b='mid',bd=1e9;for(const o of ['min','mid','full']){const d=Math.abs(tyOf(o)-proj);if(d<bd){bd=d;b=o}}setSheet(b)};
  panelEl.addEventListener('touchstart',e=>{const t=e.touches[0];begin(t.clientX,t.clientY,e.target)},{passive:true});
  panelEl.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY,e)},{passive:false});
  panelEl.addEventListener('touchend',e=>{const t=e.changedTouches[0];end(t.clientX)});panelEl.addEventListener('touchcancel',e=>{const t=e.changedTouches[0];end(t?t.clientX:0)});
  panelEl.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||!e.target.closest('.grab,.nav')||e.target.closest('button,input'))return;begin(e.clientX,e.clientY,e.target)});
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse')move(e.clientX,e.clientY,null)});addEventListener('pointerup',e=>{if(e.pointerType==='mouse')end(e.clientX)})})();
let noClickUntil=0;function suppressClick(){noClickUntil=performance.now()+350}
// ---------- navigation stack
const stackEl=$('stack'),pages=[];
stackEl.addEventListener('scroll',e=>{const t=e.target;if(t.classList&&t.classList.contains('scroll')){const pg=t.closest('.page');pg&&pg.classList.toggle('scrolled',t.scrollTop>1)}},true);
const topPg=()=>pages[pages.length-1];
function mk(kind,html){const el=document.createElement('div');el.className='page';el.innerHTML=html;return {kind,el}}
function push(pg,animate=true){const prev=topPg();pages.push(pg);stackEl.appendChild(pg.el);
  if(prev){if(animate){pg.el.classList.add('enter');pg.el.offsetWidth;pg.el.classList.remove('enter')}prev.el.classList.add('behind')}
  pg.enter&&pg.enter(true);return pg}
function pop(){if(pages.length<=1)return;const t=pages.pop(),prev=topPg();t.el.classList.add('leave');t.el.style.pointerEvents='none';prev.el.classList.remove('behind');setTimeout(()=>t.el.remove(),500);t.leave&&t.leave();prev.enter&&prev.enter(false)}
function dropTop(){const t=pages.pop();if(t){t.el.remove();t.leave&&t.leave()}}
function replaceTop(pg){dropTop();const prev=topPg();pages.push(pg);stackEl.appendChild(pg.el);prev&&prev.el.classList.add('behind');pg.enter&&pg.enter(true)}
function popToRoot(){while(pages.length>2)pages.splice(pages.length-2,1)[0].el.remove();pop()}
let hashGuard='';function setHash(h){hashGuard=h;try{if(location.hash!==h)location.hash=h||'#'}catch(e){}}
// ---------- shared bits
const isFav=(t,k)=>fav[t].includes(k);
function toggleFav(t,k){const i=fav[t].indexOf(k);if(i>=0)fav[t].splice(i,1);else fav[t].unshift(k);store.set('bus.fav',fav);toast(i>=0?'お気に入りから削除しました':'お気に入りに追加しました');return i<0}
const routeRow=r=>`<button class="row" data-r="${r.k}" style="--c:${r.c}"><span class="badge">${icon(r)}</span><span class="rt"><b>${esc(r.n)}${r.k==='nishisakado'||r.k==='tsurumai'?'<span class="tag">朝夕便</span>':''}</b><span>${esc(r.ends)}</span></span>${CHEV}</button>`;
const stopRow=s=>`<button class="row" data-stop="${s.id}"><span class="badge dot"></span><span class="rt"><b>${esc(s.name)}</b><span>${cityName(s.city)}${s.sub?'・'+esc(s.sub):''}</span></span><span class="dots">${s.allR.map(k=>`<i style="--c:${RK[k].c}"></i>`).join('')}</span></button>`;
const stopByName=n=>S.find(s=>s.name===n&&s.allR.length);
function centerOn(s,anim=true){const i=insets();const ns=Math.min(maxS(),Math.max(sc,MODE==='map'?fitS*4.5:fitS*2.6));const cxp=i.l+(VW-i.l-i.r)/2,cyp=i.t+(VH-i.t-i.b)/2;flyTo(ns,cxp-s.x*ns,cyp-s.y*ns,anim)}
function boxOf(city){let b=[1e9,1e9,-1e9,-1e9];R.filter(r=>r.city===city).forEach(r=>{b=[Math.min(b[0],r.box[0]),Math.min(b[1],r.box[1]),Math.max(b[2],r.box[2]),Math.max(b[3],r.box[3])]});return b}
const NOTE=`<div class="note">停車順はNAVITIME掲載の系統データ（2026年11月時点）、地図・経路・停留所位置は坂戸市「市民バス全体路線図」と鶴ヶ島市「全体路線図」をもとに作成したものです。時刻・運行日は<a href="https://www.city.sakado.lg.jp/soshiki/61/1306.html" target="_blank" rel="noopener">坂戸市</a>・<a href="https://www.city.tsurugashima.lg.jp/data/doc/1746597306_doc_479_0.pdf" target="_blank" rel="noopener">鶴ヶ島市</a>の公式時刻表でご確認ください。</div>`;
// ---------- home
function homePage(){const pg=mk('home',`<div class="nav"><button class="search" data-act="search">${I.search}<span>停留所・路線を検索</span></button><button class="ic" data-act="plan" aria-label="経路をさがす" style="width:40px;height:40px;border-radius:12px;background:var(--blue);color:#fff">${I.route}</button></div><div class="scroll"></div>`);
  const sc_=pg.el.querySelector('.scroll');
  pg.render=()=>{const fi=['all','sk','tg'].indexOf(filter);
    let h=`<div class="seg"><i style="transform:translateX(${fi*100}%)"></i><button data-f="all">すべて</button><button data-f="sk">坂戸市</button><button data-f="tg">鶴ヶ島市</button></div>`;
    const fr=fav.r.map(k=>RK[k]).filter(Boolean),fs=fav.s.map(stopByName).filter(Boolean);
    if(fr.length||fs.length)h+=`<div class="sec">お気に入り</div><div class="card">${fr.map(routeRow).join('')}${fs.map(stopRow).join('')}</div>`;
    for(const [g,city] of GROUPS){if(filter!=='all'&&filter!==(city==='坂戸市'?'sk':'tg'))continue;const rs=R.filter(r=>r.g===g);h+=`<div class="sec">${g}<small>${city}・${rs.length}路線</small></div><div class="card">${rs.map(routeRow).join('')}</div>`}
    sc_.innerHTML=h+NOTE;sc_.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.f===filter))};
  pg.enter=()=>{sel=null;pick=null;pick0=null;plan=null;pg.render();setHash('');if(sheetState==='full')setSheet('mid');draw()};
  pg.frame=a=>fitBox(filter==='all'?BOX:boxOf(filter),a);
  pg.setFilter=f=>{filter=f;const fi=['all','sk','tg'].indexOf(f);sc_.querySelector('.seg i').style.transform=`translateX(${fi*100}%)`;sc_.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.f===f));
    setTimeout(()=>{const y=sc_.scrollTop;pg.render();sc_.scrollTop=y},240);computeFit();fitBox(f==='all'?BOX:boxOf(f));draw()};
  return pg}
// ---------- route
function routePage(k){const r=RK[k];let rev=false;
  const pg=mk('route',`<div class="nav" style="--c:${r.c}"><span class="badge lg">${icon(r)}</span><h2>${esc(r.n)}<span class="sub">${r.g}・${cityName(r.city)}</span></h2><button class="ic" data-back aria-label="閉じる">${I.close}</button></div><div class="scroll"></div>`);
  const sc_=pg.el.querySelector('.scroll');pg.key=k;
  const favBtn=()=>`<button class="act${isFav('r',k)?' faved':''}" data-act="fav">${isFav('r',k)?I.starOn:I.star}${isFav('r',k)?'お気に入り済み':'お気に入り'}</button>`;
  const paint=()=>{const b=sc_.querySelector('[data-act=fav]');if(b)b.outerHTML=favBtn()};
  pg.render=()=>{const ord=rev?[...r.order].reverse():r.order;const n=r.loop?ord.length-1:ord.length;const a=S[ord[0]].name,b=S[ord[ord.length-1]].name;
    sc_.innerHTML=`<div class="facts"><div class="fact"><small>${r.loop?'循環':'方面'}</small><b>${esc(r.loop?a+' 発着':a+' → '+b)}</b></div><div class="fact" style="flex:none;min-width:78px"><small>停留所</small><b>${n}</b></div></div>
    <div class="acts" style="padding-top:8px">${r.loop?'':`<button class="act" data-act="rev">${I.swap}逆方向</button>`}${favBtn()}</div>
    <div class="sec">停車順</div><ol class="tl" style="--c:${r.c}">${ord.map((i,ix)=>{const s=S[i];const t=ix===0||ix===ord.length-1;return `<li data-stop="${i}" class="${t?'t':''}"><span class="sn"><b>${esc(s.name)}</b>${s.sub?`<i>${esc(s.sub)}</i>`:''}${s.allR.length>1?`<span class="xfer">${s.allR.filter(x=>x!==k).map(x=>`<em style="--c:${RK[x].c}">${esc(RK[x].n)}</em>`).join('')}</span>`:''}</span><span class="num">${ix+1}</span></li>`}).join('')}</ol>${NOTE}`};
  pg.enter=fresh=>{sel=k;pick=null;pick0=null;plan=null;if(filter!=='all'&&filter!==r.city)filter='all';paint();if(fresh){pg.render();setSheet('mid');requestAnimationFrame(()=>pg.frame(true))}setHash('#line-'+k);draw()};
  pg.frame=a=>fitBox([r.box[0]-4,r.box[1]-4,r.box[2]+4,r.box[3]+4],a,40,8);
  pg.act=a=>{if(a==='fav'){toggleFav('r',k);paint()}if(a==='rev'){rev=!rev;const y=sc_.scrollTop;pg.render();sc_.scrollTop=0;toast(S[(rev?[...r.order].reverse():r.order).slice(-1)[0]].name+' 方面')}};
  return pg}
// ---------- stop
function stopPage(id){const s=S[id];const ids=[id,...s.sib];
  const rows=s.allR.map(k=>{const r=RK[k];const i=r.order.findIndex(x=>ids.includes(x));const nx=r.order[i+1],pv=r.order[i-1];const parts=[];
    if(nx!=null)parts.push(`${S[r.order[r.order.length-1]].name}方面：次は ${S[nx].name}`);if(!r.loop&&pv!=null)parts.push(`${S[r.order[0]].name}方面：次は ${S[pv].name}`);
    return `<button class="row" data-r="${k}" style="--c:${r.c}"><span class="badge">${icon(r)}</span><span class="rt"><b>${esc(r.n)}</b><span>${esc(parts[0]||'終点')}</span>${parts[1]?`<span>${esc(parts[1])}</span>`:''}</span>${CHEV}</button>`}).join('');
  const pg=mk('stop',`<div class="nav"><h2>${esc(s.name)}<span class="sub">${s.sub?esc(s.sub)+'・':''}${cityName(s.city)}のバス停</span></h2><button class="ic" data-back aria-label="閉じる">${I.close}</button></div>
  <div class="scroll"><div class="acts"><button class="act pri" data-act="from">${I.route}ここから出発</button><button class="act" data-act="to">ここへ行く</button><button class="act sq" data-act="fav" aria-label="お気に入り"></button></div>
  <div class="sec">このバス停を通る路線<small>${s.allR.length}路線</small></div><div class="card">${rows}</div>${NOTE}</div>`);
  const fb=pg.el.querySelector('[data-act=fav]');const paint=()=>{fb.innerHTML=isFav('s',s.name)?I.starOn:I.star;fb.classList.toggle('faved',isFav('s',s.name))};pg.key=id;
  pg.enter=fresh=>{pick=id;pick0=null;sel=null;plan=null;paint();if(fresh){setSheet('mid');centerOn(s)}setHash('#stop-'+id);draw()};
  pg.frame=a=>centerOn(s,a);
  pg.act=a=>{if(a==='fav'){toggleFav('s',s.name);paint()}if(a==='from')push(planPage(id,null));if(a==='to')push(planPage(null,id))};
  return pg}
// ---------- search
const kana=t=>t.replace(/[ァ-ン]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s　・]/g,'').toLowerCase();
function searchStops(v){const seen=new Set();return S.filter(s=>s.allR.length&&(kana(s.name+s.sub).includes(v)||(s.yomi||'').includes(v))).sort((a,b)=>((kana(b.name).startsWith(v)||(b.yomi||'').startsWith(v))-(kana(a.name).startsWith(v)||(a.yomi||'').startsWith(v)))||a.name.length-b.name.length).filter(s=>{if(seen.has(s.name))return false;seen.add(s.name);return true}).slice(0,30)}
function searchPage(pickCb,title){const pg=mk('search',`<div class="nav"><label class="search">${I.search}<input placeholder="${title||'停留所・路線を検索'}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search"><button class="clr" data-act="clear" aria-label="消去" hidden>${I.x}</button></label><button class="txt" data-back>キャンセル</button></div><div class="scroll"></div>`);
  const inp=pg.el.querySelector('input'),sc_=pg.el.querySelector('.scroll');pg.pick=pickCb;
  const clr=pg.el.querySelector('.clr');pg.act=a=>{if(a==='clear'){inp.value='';render();inp.focus({preventScroll:true})}};
  const render=()=>{const v=kana(inp.value.trim());let h='';clr.hidden=!inp.value;
    if(!v){const rc=recent.map(stopByName).filter(Boolean);const fs=fav.s.map(stopByName).filter(Boolean);
      if(pickCb)h+=`<div class="note" style="padding-top:4px">地図上のバス停をタップしても選べます。</div>`;
      if(fs.length)h+=`<div class="sec">お気に入り</div><div class="card">${fs.map(stopRow).join('')}</div>`;
      if(rc.length)h+=`<div class="sec">最近の検索</div><div class="card">${rc.map(stopRow).join('')}</div>`;
      if(!fs.length&&!rc.length&&!pickCb)h+=`<div class="empty">停留所名や路線名を入力してください。<br>ひらがなでも検索できます。</div>`}
    else{const rs=pickCb?[]:R.filter(r=>kana(r.n+r.g).includes(v)||(r.yomi||'').includes(v)),st=searchStops(v);
      if(rs.length)h+=`<div class="sec">路線</div><div class="card">${rs.map(routeRow).join('')}</div>`;
      if(st.length)h+=`<div class="sec">バス停</div><div class="card">${st.map(stopRow).join('')}</div>`;
      if(!h)h='<div class="empty">見つかりませんでした</div>'}
    sc_.innerHTML=h};
  inp.addEventListener('input',render);inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=sc_.querySelector('[data-stop],[data-r]');b&&b.click()}});
  pg.enter=fresh=>{if(fresh){render();setSheet('full');inp.focus({preventScroll:true})}};pg.leave=()=>inp.blur();
  pg.choose=id=>{const n=S[id].name;recent=[n,...recent.filter(x=>x!==n)].slice(0,6);store.set('bus.recent',recent);
    if(pickCb){const cb=pickCb;pop();cb(id)}else replaceTop(stopPage(id))};
  return pg}
// ---------- journey planner
const PLACE=(()=>{const p=S.map((s,i)=>i);const f=i=>{while(p[i]!==i)i=p[i]=p[p[i]];return i};S.forEach(s=>s.sib.forEach(j=>{p[f(j)]=f(s.id)}));return S.map((s,i)=>f(i))})();
const LINES=[];R.forEach(r=>{LINES.push({r,dir:0,seq:r.order});if(!r.loop)LINES.push({r,dir:1,seq:[...r.order].reverse()})});
function findTrips(o,d){const O=PLACE[o],D=PLACE[d];if(O===D)return[];const out=[],sig=new Set();
  const at={};LINES.forEach((L,li)=>L.seq.forEach((s,pi)=>{(at[PLACE[s]]=at[PLACE[s]]||[]).push([li,pi])}));
  for(const T of [1000,5]){const dist=new Map(),prev=new Map(),key=(l,p)=>l*1000+p;const open=[];
    for(const [l,p] of at[O]||[]){dist.set(key(l,p),0);open.push([0,l,p])}let best=null;
    while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [c,l,p]=open.splice(bi,1)[0];if(c>dist.get(key(l,p)))continue;
      const sid=LINES[l].seq[p];if(PLACE[sid]===D){best=[l,p];break}
      const rel=(l2,p2,c2)=>{const k2=key(l2,p2);if(c2<(dist.get(k2)??1e9)){dist.set(k2,c2);prev.set(k2,[l,p]);open.push([c2,l2,p2])}};
      if(p+1<LINES[l].seq.length)rel(l,p+1,c+1);
      for(const [l2,p2] of at[PLACE[sid]])if(l2!==l&&LINES[l2].r!==LINES[l].r)rel(l2,p2,c+T)}
    if(!best)continue;const path=[];let cur=best;while(cur){path.unshift(cur);cur=prev.get(key(cur[0],cur[1]))}
    const legs=[];for(const [l,p] of path){const L=LINES[l];const last=legs[legs.length-1];if(last&&last.l===l)last.stops.push(L.seq[p]);else legs.push({l,r:L.r,head:S[L.seq[L.seq.length-1]].name,stops:[L.seq[p]]})}
    const lg=legs.filter(x=>x.stops.length>1);if(!lg.length)continue;const s=lg.map(x=>x.r.k+':'+x.stops[0]+'-'+x.stops[x.stops.length-1]).join('|');if(sig.has(s))continue;sig.add(s);
    out.push({legs:lg,xfers:lg.length-1,n:lg.reduce((a,x)=>a+x.stops.length-1,0)})}
  return out.sort((a,b)=>a.xfers-b.xfers||a.n-b.n)}
const legChips=t=>`<span class="leg">${t.legs.map((x,i)=>`${i?'<s>›</s>':''}<span class="badge" style="--c:${x.r.c}">${icon(x.r)}</span><s style="color:var(--ink);font-weight:600">${esc(x.r.n)}</s>`).join('')}</span>`;
function planPage(o,d){const st={o,d,active:o==null?'o':d==null?'d':null};let trips=[];
  const pg=mk('plan',`<div class="nav"><h2>経路をさがす</h2><button class="ic" data-back aria-label="閉じる">${I.close}</button></div><div class="scroll"></div>`);const sc_=pg.el.querySelector('.scroll');
  pg.render=()=>{const f=(k,ph,cls)=>`<button class="f${st.active===k?' active':''}" data-act="pick-${k}"><span class="pin ${cls}"></span>${st[k]!=null?`<span>${esc(S[st[k]].name)}</span>`:`<span class="ph">${ph}</span>`}</button>`;
    let h=`<div class="od">${f('o','出発するバス停','')}${f('d','行き先のバス停','b')}<button class="ic swap" data-act="swap" aria-label="入れ替え">${I.swap}</button></div>`;
    if(st.o!=null&&st.d!=null){trips=findTrips(st.o,st.d);
      if(PLACE[st.o]===PLACE[st.d])h+=`<div class="empty">出発地と行き先が同じです。</div>`;
      else if(!trips.length)h+=`<div class="empty">この2つのバス停を結ぶ経路は<br>コミュニティバスだけでは見つかりませんでした。</div>`;
      else h+=`<div class="sec">経路<small>${trips.length}件</small></div><div class="card">${trips.map((t,i)=>`<button class="res" data-trip="${i}"><b>${t.xfers?`乗換${t.xfers}回`:'乗換なし'}<small>${t.n}停留所</small></b>${legChips(t)}</button>`).join('')}</div><div class="note">所要時間と時刻は含みません。乗り換えの接続は公式時刻表でご確認ください。逆方向の停車順は同じ経路を戻るものとして計算しています。</div>`}
    else h+=`<div class="empty">出発地と行き先を選んでください。<br>地図上のバス停をタップしても選べます。</div>`;
    sc_.innerHTML=h};
  pg.setStop=id=>{const k=st.active||(st.o==null?'o':'d');st[k]=id;st.active=st.o==null?'o':st.d==null?'d':null;pg.enter(true)};
  pg.enter=fresh=>{sel=null;plan=null;pick=st.d??st.o;pick0=st.d!=null?st.o:null;pg.render();setHash('');if(fresh&&st.o!=null&&st.d!=null){setSheet('mid');pg.frame(true)}draw()};
  pg.frame=an=>{if(st.o!=null&&st.d!=null){const a=S[st.o],b=S[st.d];fitBox([Math.min(a.x,b.x)-12,Math.min(a.y,b.y)-12,Math.max(a.x,b.x)+12,Math.max(a.y,b.y)+12],an,50,7)}else if(st.o!=null||st.d!=null)centerOn(S[st.o??st.d],an);else fitBox(BOX,an)};
  pg.act=a=>{if(a==='swap'){[st.o,st.d]=[st.d,st.o];st.active=st.o==null?'o':st.d==null?'d':null;pg.enter(true)}
    if(a.startsWith('pick-')){const k=a.slice(5);st.active=k;pg.render();push(searchPage(id=>{st[k]=id;st.active=st.o==null?'o':st.d==null?'d':null;pg.enter(true)},k==='o'?'出発するバス停':'行き先のバス停'))}};
  pg.trip=i=>push(tripPage(trips[i]));pg.leave=()=>{pick0=null};
  return pg}
function tripPage(t){const a=S[t.legs[0].stops[0]],b=S[t.legs[t.legs.length-1].stops.slice(-1)[0]];
  let h='';t.legs.forEach((x,li)=>{if(li)h+=`<div class="xf">${esc(S[x.stops[0]].name)} で乗り換え</div>`;
    h+=`<div class="lh" style="--c:${x.r.c}"><span class="badge">${icon(x.r)}</span><div><b>${esc(x.r.n)}</b><br><span>${esc(x.head)}方面・${x.stops.length-1}停留所</span></div></div><ol class="tl" style="--c:${x.r.c}">${x.stops.map((i,ix)=>{const e=ix===0||ix===x.stops.length-1;return `<li data-stop="${i}" class="${e?'t':'mini'}"><span class="sn"><b>${esc(S[i].name)}</b>${e?`<i>${ix===0?'乗車':'降車'}</i>`:''}</span></li>`}).join('')}</ol>`});
  const pg=mk('trip',`<div class="nav"><h2>${esc(a.name)} → ${esc(b.name)}<span class="sub">${t.xfers?`乗換${t.xfers}回`:'乗換なし'}・${t.n}停留所</span></h2><button class="ic" data-back aria-label="閉じる">${I.close}</button></div><div class="scroll">${h}<div class="note">所要時間と時刻は含みません。公式時刻表でご確認ください。</div></div>`);
  const cs=[];t.legs.forEach(x=>x.stops.forEach(i=>{const c=S[i].cl;if(!cs.includes(c))cs.push(c)}));
  pg.noStopPush=true;
  pg.enter=fresh=>{sel=null;pick=null;pick0=null;plan={r:new Set(t.legs.map(x=>x.r.k)),c:new Set(cs),order:cs,legs:t.legs.map(x=>({k:x.r.k,stops:x.stops}))};filter='all';if(fresh){setSheet('mid');requestAnimationFrame(()=>pg.frame(true))}draw()};
  pg.frame=a=>{let bx=[1e9,1e9,-1e9,-1e9];cs.forEach(c=>{const p=CL[c].c;bx=[Math.min(bx[0],p[0]),Math.min(bx[1],p[1]),Math.max(bx[2],p[0]),Math.max(bx[3],p[1])]});fitBox([bx[0]-10,bx[1]-10,bx[2]+10,bx[3]+10],a,46,8)};
  pg.leave=()=>{plan=null};
  return pg}
// ---------- map settings (like the map-mode card in Apple Maps)
const PV={map:`<svg viewBox="0 0 142 100" preserveAspectRatio="xMidYMid slice"><rect width="142" height="100" fill="#f0ede7"/><path d="M-5 70C30 60 40 80 70 66S120 40 150 46" fill="none" stroke="#a8d2f2" stroke-width="7"/><g stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"><path d="M-5 30L60 22 150 34M24 -5L34 105M92 -5L80 105M-5 86L150 78M118 -5L126 105"/></g><path d="M-5 14L30 52 76 58 150 20" fill="none" stroke="#f9d675" stroke-width="4"/><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4"><path d="M12 92L34 60 80 54 100 28 136 12" stroke="#e5243b"/><path d="M8 40L34 60 58 86 110 90" stroke="#1b95d3"/></g><g fill="#fff" stroke="#2c2c2e" stroke-width="1.4"><circle cx="34" cy="60" r="3.6"/><circle cx="80" cy="54" r="2.6"/><circle cx="100" cy="28" r="2.6"/><circle cx="58" cy="86" r="2.6"/></g></svg>`,
 metro:`<svg viewBox="0 0 142 100" preserveAspectRatio="xMidYMid slice"><rect width="142" height="100" fill="#eef1f5"/><g stroke="#e1e6ed" stroke-width="1"><path d="M0 20H142M0 40H142M0 60H142M0 80H142M20 0V100M40 0V100M60 0V100M80 0V100M100 0V100M120 0V100"/></g><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path d="M10 80H40L60 60H100L120 40V14" stroke="#e5243b"/><path d="M10 30H50L80 60" stroke="#1b95d3"/><path d="M80 60V88H132" stroke="#1b95d3"/><path d="M30 14V50L40 60H60" stroke="#2e9e4a"/></g><g fill="#fff" stroke="#2c2c2e" stroke-width="1.5"><circle cx="40" cy="80" r="3"/><circle cx="60" cy="60" r="4"/><circle cx="80" cy="60" r="4"/><circle cx="100" cy="60" r="3"/><circle cx="120" cy="40" r="3"/><circle cx="30" cy="30" r="3.6"/><circle cx="104" cy="88" r="3"/></g></svg>`};
function settingsPage(){const pg=mk('settings',`<div class="nav"><h2>マップの表示</h2><button class="ic" data-back aria-label="閉じる">${I.close}</button></div><div class="scroll"></div>`);const sc_=pg.el.querySelector('.scroll');
  const tiles=()=>[['map','地図'],['metro','路線図']].map(([k,n])=>`<button class="tile${MODE===k?' on':''}" data-mode="${k}"><span class="pv">${PV[k]}</span>${n}</button>`).join('');
  const TH=['auto','light','dark'];
  pg.render=()=>{sc_.innerHTML=`<div class="tiles">${tiles()}</div><div class="hint">路線図は停留所のつながりを見やすく整理した図です。距離や方角は実際と異なります。</div>
    <div class="sec">外観</div><div class="seg wide"><i style="transform:translateX(${TH.indexOf(themeMode)*100}%)"></i>${[['auto','自動'],['light','ライト'],['dark','ダーク']].map(([k,n])=>`<button data-th="${k}" class="${themeMode===k?'on':''}">${n}</button>`).join('')}</div>${NOTE}`};
  pg.render();
  pg.setMode=m=>{if(m===MODE)return;setMode(m);sc_.querySelectorAll('.tile').forEach(b=>b.classList.toggle('on',b.dataset.mode===m))};
  pg.setTh=m=>{setTheme(m);sc_.querySelector('.seg i').style.transform=`translateX(${TH.indexOf(m)*100}%)`;sc_.querySelectorAll('[data-th]').forEach(b=>b.classList.toggle('on',b.dataset.th===m))};
  pg.enter=fresh=>{if(fresh&&sheetState!=='mid')setSheet('mid')};
  return pg}
// ---------- event delegation
stackEl.addEventListener('click',e=>{if(performance.now()<noClickUntil)return;const t=e.target,pg=topPg();if(!pg||!pg.el.contains(t))return;
  if(t.closest('[data-back]')){pop();return}
  const a=t.closest('[data-act]');if(a){const act=a.dataset.act;if(act==='search')push(searchPage());else if(act==='plan')push(planPage(null,null));else pg.act&&pg.act(act);return}
  const f=t.closest('[data-f]');if(f&&pg.setFilter){pg.setFilter(f.dataset.f);return}
  const md=t.closest('[data-mode]');if(md&&pg.setMode){pg.setMode(md.dataset.mode);return}
  const th=t.closest('[data-th]');if(th&&pg.setTh){pg.setTh(th.dataset.th);return}
  const tr=t.closest('[data-trip]');if(tr&&pg.trip){pg.trip(+tr.dataset.trip);return}
  const r=t.closest('[data-r]');if(r){if(pg.kind==='search')replaceTop(routePage(r.dataset.r));else push(routePage(r.dataset.r));return}
  const s=t.closest('[data-stop]');if(s){const id=+s.dataset.stop;if(pg.choose)pg.choose(id);else if(pg.noStopPush){pick=id;centerOn(S[id]);draw()}else push(stopPage(id))}});
// map taps (called from the renderer's hit testing)
function selectStop(id){if(topPg().kind==='settings')dropSettings();const pg=topPg();if(pg.kind==='plan'){pg.setStop(id);return}if(pg.kind==='search'&&pg.pick){pg.choose(id);return}if(pg.kind==='trip'){pick=id;draw();return}
  if(pg.kind==='stop'){if(pg.key!==id)replaceTop(stopPage(id));return}if(pg.kind==='search'){replaceTop(stopPage(id));return}push(stopPage(id))}
function dropSettings(){dropTop();const p=topPg();p.el.classList.remove('behind')}
function selectRoute(k){if(topPg().kind==='settings')dropSettings();const pg=topPg();if(pg.kind==='plan'||pg.kind==='trip'||(pg.kind==='search'&&pg.pick))return;if(pg.kind==='route'){if(pg.key!==k)replaceTop(routePage(k));return}if(pg.kind==='search'){replaceTop(routePage(k));return}push(routePage(k))}
function home(){const pg=topPg();if(pg.kind==='route'||pg.kind==='stop'||pg.kind==='settings')pop()}
// ---------- controls
function zoomBtn(f){const i=insets();const X=i.l+(VW-i.l-i.r)/2,Y=i.t+(VH-i.t-i.b)/2;const ns=Math.max(minS(),Math.min(maxS(),sc*f));const k=ns/sc;flyTo(ns,X-(X-tx)*k,Y-(Y-ty)*k,true)}
$('zin').onclick=()=>zoomBtn(2);$('zout').onclick=()=>zoomBtn(.5);
$('zfit').onclick=()=>reframe(true);
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'){if(e.key==='Escape')pop();return}if(e.key==='+'||e.key==='=')zoomBtn(1.6);if(e.key==='-')zoomBtn(1/1.6);if(e.key==='Escape')pop()});
addEventListener('resize',()=>{const wx=(VW/2-tx)/sc,wy=(VH/2-ty)/sc;measureInsets();resize();setSheet(sheetState);computeFit();tx=VW/2-wx*sc;ty=VH/2-wy*sc;base.valid=false;draw()});
function openHash(h0){const h=typeof h0==='string'?h0:location.hash;if(typeof h0!=='string'&&h===hashGuard)return;const m=/^#line-([a-z]+)$/.exec(h),n=/^#stop-(\d+)$/.exec(h);
  if(m&&RK[m[1]]){while(pages.length>1)dropTop();topPg().el.classList.remove('behind');push(routePage(m[1]),false)}else if(n&&S[+n[1]]&&S[+n[1]].allR.length){while(pages.length>1)dropTop();topPg().el.classList.remove('behind');push(stopPage(+n[1]),false)}}
addEventListener('hashchange',openHash);
// ---------- init
const initHash=(()=>{try{return location.hash}catch(e){return ''}})();measureInsets();resize();setSheet('mid');applyTheme();push(homePage(),false);setMode(store.get('bus.mode','map')==='metro'?'metro':'map',true);computeFit();fitBox(BOX,false);if(initHash.length>1)openHash(initHash);
// PWA: service worker（対応環境のみ。失敗しても動作に影響なし）
try{if('serviceWorker' in navigator&&window.isSecureContext&&window.top===window.self){const go=()=>navigator.serviceWorker.register('sw.js').catch(()=>{});document.readyState==='complete'?go():window.addEventListener('load',go)}}catch(e){}
</script>
</body>
</html>
