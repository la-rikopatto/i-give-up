import json,math,sys
n=json.load(open('net_all.json'));S=n['stops']
def seg_d(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1];L=dx*dx+dy*dy
    t=0 if L==0 else max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def samples(p,step):
    out=[]
    for a,b in zip(p,p[1:]):
        L=math.hypot(b[0]-a[0],b[1]-a[1]);k=max(1,int(L/step))
        for i in range(k+1): out.append((a[0]+(b[0]-a[0])*i/k,a[1]+(b[1]-a[1])*i/k))
    return out
def dist_poly(q,p): return min(seg_d(q,a,b) for a,b in zip(p,p[1:]))
tot=0
for gname,g in n['geos'].items():
    C=g['chains'];tol=1.0 if gname=='map' else 2.0;near=4 if gname=='map' else 8
    for k,r in g['r'].items():
        ch=[c[0] for c in r['ch']];iss=[]
        if len(set(ch))!=len(ch): iss.append(('dup chain',ch))
        par={e:e for e in ch}
        def f(x):
            while par[x]!=x: x=par[x]
            return x
        has={}
        for a,ea,b,eb in r['cx']:
            if a not in par or b not in par: iss.append(('cx to chain not in route',a,b));continue
            par[f(a)]=f(b);has[(a,ea)]=1;has[(b,eb)]=1
            pa=C[a][-1 if ea else 0];pb=C[b][-1 if eb else 0]
            d=math.hypot(pa[0]-pb[0],pa[1]-pb[1])
            if d>tol: iss.append(('joined ends apart',a,b,round(d,1)))
        comp=len({f(e) for e in ch})
        if comp>1: iss.append(('components',comp))
        stc={}
        for sid,e,s in r['st']: stc.setdefault(e,[]).append(s)
        if any(e not in par for e in stc): iss.append(('stop on chain not in route',))
        for e in ch:
            L=sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(C[e],C[e][1:]))
            for end in (0,1):
                if (e,end) in has: continue
                E=L if end else 0;ds=[abs(s-E) for s in stc.get(e,[])]
                pe=C[e][-1 if end else 0]
                # free end that touches another chain end of the route -> missing connection
                for e2 in ch:
                    if e2==e: continue
                    for end2 in (0,1):
                        p2=C[e2][-1 if end2 else 0]
                        if math.hypot(pe[0]-p2[0],pe[1]-p2[1])<=tol: iss.append(('free end touches chain',e,end,e2))
                seg=math.hypot(C[e][-1][0]-C[e][-2][0],C[e][-1][1]-C[e][-2][1]) if end else math.hypot(C[e][1][0]-C[e][0][0],C[e][1][1]-C[e][0][1])
                if not ds or min(ds)>max(.05,0) and not (min(ds)<seg/2): iss.append(('stub without stop',e,end,round(min(ds),1) if ds else None))
        # doubled line: two different chains of same route running alongside
        for i,a in enumerate(ch):
            sa=samples(C[a],near)
            for b in ch[i+1:]:
                cnt=sum(1 for q in sa[1:-1] if dist_poly(q,C[b])<near*.75)
                inner=len(sa)-2
                if inner>0 and cnt>=max(3,inner*.3): iss.append(('parallel/overlap',a,b,cnt,inner))
        if iss:
            tot+=len(iss);print(gname,k)
            for x in iss: print('   ',x)
print('total',tot)
