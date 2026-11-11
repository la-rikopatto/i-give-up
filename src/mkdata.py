import json,math,pickle,os
from functools import cmp_to_key
n=json.load(open('/home/claude/geo/geo.json'));S=n['stops'];CL=n['clusters'];R=n['routes']
def plen(p): return sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(p,p[1:]))
def pos(p,s):
    acc=0
    for a,b in zip(p,p[1:]):
        l=math.hypot(b[0]-a[0],b[1]-a[1])
        if s<=acc+l+1e-6:
            f=(s-acc)/l if l else 0;return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]
        acc+=l
    return list(p[-1])
# ---------- map geometry: snap multi-road stops to the shared junction
CH=n['chains'];L=[plen(p) for p in CH]
by={}
for r in R:
    conn={(a,ea) for a,ea,b,eb in r['cx']}|{(b,eb) for a,ea,b,eb in r['cx']}
    for x in r['st']:
        sid,e,s=x;dead=(s<.05 and (e,0) not in conn) or (s>L[e]-.05 and (e,1) not in conn)
        by.setdefault(S[sid]['cl'],[]).append((x,dead))
for cl,lst in by.items():
    es=sorted({x[1] for x,_ in lst})
    if len(es)<2: continue
    cand=None
    for v in (CH[es[0]][0],CH[es[0]][-1]):
        if all(min(math.hypot(v[0]-q[0],v[1]-q[1]) for q in (CH[e][0],CH[e][-1]))<0.3 for e in es): cand=v
    if cand is None: print('no shared junction:',CL[cl]['name']);continue
    for x,dead in lst:
        if dead: continue
        e=x[1];x[2]=0.0 if math.hypot(CH[e][0][0]-cand[0],CH[e][0][1]-cand[1])<0.3 else round(L[e],2)
# collapse short dead-end spurs at a junction stop so the stop is one point
RK_={r['k']:r for r in R}
for cl,lst in by.items():
    es=sorted({x[1] for x,_ in lst})
    if len(es)<2: continue
    cand=None
    for v in (CH[es[0]][0],CH[es[0]][-1]):
        if all(min(math.hypot(v[0]-q[0],v[1]-q[1]) for q in (CH[e][0],CH[e][-1]))<0.3 for e in es): cand=v
    if cand is None: continue
    for r in R:
        mine=[x for x in r['st'] if S[x[0]]['cl']==cl]
        for x in mine:
            e=x[1]
            if L[e]>12: continue
            vend=0 if math.hypot(CH[e][0][0]-cand[0],CH[e][0][1]-cand[1])<0.3 else 1
            far=L[e] if vend==0 else 0.0
            if abs(x[2]-far)>0.05: continue                      # stop is at the far (dead) end
            if any(y[1]==e and S[y[0]]['cl']!=cl for y in r['st']): continue
            links=[c for c in r['cx'] if (c[0]==e) or (c[2]==e)]
            if any((c[0]==e and c[1]!=vend) or (c[2]==e and c[3]!=vend) for c in links): continue   # route continues beyond the far end
            if not 1<=len(links)<=2: continue
            nb=[((c[2],c[3]) if c[0]==e else (c[0],c[1])) for c in links]
            for c in links: r['cx'].remove(c)
            r['ch']=[q for q in r['ch'] if q[0]!=e]
            if len(nb)==2 and nb[0]!=nb[1]:
                p,q=sorted(nb);r['cx'].append([p[0],p[1],q[0],q[1]])
            e2,end2=nb[0]
            for y in mine:
                if y[1]==e: y[1]=e2;y[2]=0.0 if end2==0 else round(L[e2],2)
            print('collapsed spur',CL[cl]['name'],r['k'],round(L[e],1))
def pack(chains,routes,stops_xy,cl_xy):
    return {'chains':chains,'r':{r['k']:{'ch':r['ch'],'cx':r['cx'],'st':r['st']} for r in routes},'sp':stops_xy,'cp':cl_xy}
geo=pack(CH,R,[[s['x'],s['y']] for s in S],[c['c'] for c in CL])
# ---------- metro geometry
Lp=pickle.load(open('/home/claude/metro/lay_a.pkl','rb'));D=pickle.load(open('/home/claude/metro/topo.pkl','rb'));seqs=D['seqs']
E=Lp['E'];TR=Lp['TR'];U=30.0
mnx=min(p[0] for p in Lp['pos']);mny=min(p[1] for p in Lp['pos'])
paths={e:[[(x-mnx)*U,(y-mny)*U] for x,y in pl] for e,pl in Lp['paths'].items()}
def first_dir(e,d):
    pl=paths[e] if d==1 else paths[e][::-1];return (pl[1][0]-pl[0][0],pl[1][1]-pl[0][1])
def last_dir(e,d):
    pl=paths[e] if d==1 else paths[e][::-1];return (pl[-1][0]-pl[-2][0],pl[-1][1]-pl[-2][1])
def cont(k,h,fwd):
    T=TR[k];i=[j for j,(e,_) in enumerate(T) if e==h][0];d=T[i][1]
    return list(T[i+1:]) if (d==1)==fwd else [(e,-dd) for e,dd in reversed(T[:i])]
def ang(din,t):
    if t is None: return 0.0
    do=first_dir(*t);return math.atan2(din[0]*do[1]-din[1]*do[0],din[0]*do[0]+din[1]*do[1])
def cmpf(k1,k2,h):
    for fwd in (True,False):
        s1=cont(k1,h,fwd);s2=cont(k2,h,fwd);prev=(h,1 if fwd else -1);j=0
        while j<min(len(s1),len(s2)) and s1[j]==s2[j]: prev=s1[j];j+=1
        t1=s1[j] if j<len(s1) else None;t2=s2[j] if j<len(s2) else None
        if t1 is None and t2 is None: continue
        if t1 and t1==(prev[0],-prev[1]): t1=None
        if t2 and t2==(prev[0],-prev[1]): t2=None
        din=last_dir(*prev);a1=ang(din,t1);a2=ang(din,t2)
        if abs(a1-a2)>1e-6: return (1 if a1>a2 else -1)*(1 if fwd else -1)
    return 0
order={r['k']:i for i,r in enumerate(R)}
rank={}
for e in range(len(E)):
    ks=sorted({k for k,t in TR.items() if any(x==e for x,_ in t)},key=lambda k:order[k])
    o=sorted(ks,key=cmp_to_key(lambda a,b:cmpf(a,b,e) or (order[a]-order[b])));rank[e]={k:o.index(k)-(len(o)-1)/2 for k in o}
import numpy as np
keys=[r['k'] for r in R];rows=[];rhs=[]
for k in keys:
    T=TR[k]
    for (e1,d1),(e2,d2) in zip(T,T[1:]):
        if e1==e2: continue
        row=np.zeros(len(E));row[e1]+=d1;row[e2]-=d2;rows.append(row);rhs.append(-(d1*rank[e1][k]-d2*rank[e2][k]))
for e in range(len(E)):
    row=np.zeros(len(E));row[e]=0.12;rows.append(row);rhs.append(0)
sh=np.round(np.linalg.lstsq(np.array(rows),np.array(rhs),rcond=None)[0]*2)/2
j0=sum(1 for k in keys for (e1,d1),(e2,d2) in zip(TR[k],TR[k][1:]) if e1!=e2 and abs(d1*rank[e1][k]-d2*rank[e2][k])>1e-6)
for e in rank:
    for k in rank[e]: rank[e][k]=float(rank[e][k]+sh[e])
j1=sum(1 for k in keys for (e1,d1),(e2,d2) in zip(TR[k],TR[k][1:]) if e1!=e2 and abs(d1*rank[e1][k]-d2*rank[e2][k])>1e-6)
print('metro lane jumps',j0,'->',j1)
mch=[[[round(x,2),round(y,2)] for x,y in paths[e]] for e in range(len(E))];mL=[plen(p) for p in mch]
cpos=[None]*len(CL)
for e,(a,b,nn,c) in enumerate(E):
    for j,cl in enumerate(c): cpos[cl]=pos(mch[e],j/nn*mL[e])
mr=[]
for r in R:
    k=r['k'];T=TR[k];used=[]
    for e,_ in T:
        if e not in used: used.append(e)
    cx=set()
    for (e1,d1),(e2,d2) in zip(T,T[1:]):
        if e1==e2: continue
        a=(e1,1 if d1==1 else 0);b=(e2,0 if d2==1 else 1);cx.add((a,b) if a<b else (b,a))
    st=[];ti=0
    for sid in r['order']:
        cl=S[sid]['cl'];found=None
        for tj in list(range(ti,len(T)))+list(range(0,ti)):
            e=T[tj][0];c=E[e][3]
            if cl in c: found=(tj,e,c.index(cl)/E[e][2]*mL[e]);break
        if found is None: print('metro: stop not placed',k,S[sid]['name']);continue
        ti=found[0];st.append([sid,found[1],round(found[2],2)])
    # route terminals at true ends
    e0,d0=T[0];st[0]=[st[0][0],e0,0.0 if d0==1 else round(mL[e0],2)]
    e1,d1=T[-1];st[-1]=[st[-1][0],e1,round(mL[e1],2) if d1==1 else 0.0]
    mr.append({'k':k,'ch':[[e,rank[e][k]] for e in used],'cx':[[a[0],a[1],b[0],b[1]] for a,b in sorted(cx)],'st':st})
# move junction stops off the bend onto the straight shared section
stat={'moved':0,'kept_terminal':0,'left':0}
for cl in range(len(CL)):
    ent=[]
    for r in mr:
        conn={(x[0],x[1]) for x in r['cx']}|{(x[2],x[3]) for x in r['cx']}
        for x in r['st']:
            if S[x[0]]['cl']!=cl: continue
            e=x[1];end=0 if x[2]<.05 else 1 if x[2]>mL[e]-.05 else None
            ent.append((r,x,e,end,end is not None and (e,end) not in conn))
    if not ent or all(q[3] is None for q in ent): continue
    dead={id(q[0]) for q in ent if q[4]}
    v=cpos[cl];cands={}
    for e in range(len(mch)):
        for end,pt in ((0,mch[e][0]),(1,mch[e][-1])):
            if math.hypot(pt[0]-v[0],pt[1]-v[1])<0.3:
                cov=[q for q in ent if any(c[0]==e for c in q[0]['ch'])]
                if cov: cands[(e,end)]=cov
    if not cands: continue
    (e,end),cov=max(cands.items(),key=lambda kv:(dead<={id(q[0]) for q in kv[1]},len({id(q[0]) for q in kv[1]}),mL[kv[0][0]]))
    if not dead<={id(q[0]) for q in cov}: stat['kept_terminal']+=1;continue
    mg=min(11.0,mL[e]*0.3);s=mg if end==0 else mL[e]-mg
    for q in cov: q[1][1]=e;q[1][2]=round(s,2)
    stat['moved']+=1;stat['left']+=len(ent)-len(cov)
print('metro junction stops',stat)
metro=pack(mch,mr,[[round(v,2) for v in (cpos[s['cl']] or [0,0])] for s in S],[[round(v,2) for v in (c or [0,0])] for c in cpos])
for r in R:
    for k_ in ('ch','cx','st'): r.pop(k_,None)
n.pop('chains',None);n['geos']={'map':geo,'metro':metro}
json.dump(n,open('net_all.json','w'),ensure_ascii=False,separators=(',',':'));print(os.path.getsize('net_all.json'))
