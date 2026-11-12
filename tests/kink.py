import json,math,sys
n=json.load(open('/home/claude/repo/data/net_all.json'));S=n['stops']
def ang(a,b,c):
    u=(b[0]-a[0],b[1]-a[1]);v=(c[0]-b[0],c[1]-b[1])
    return math.degrees(math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]))
def near(p,g):
    bd=1e9;bn=None
    for i,q in enumerate(g['sp']):
        d=math.hypot(q[0]-p[0],q[1]-p[1])
        if d<bd and S[i]['routes']:bd=d;bn=S[i]['name']
    return bn,round(bd)
out={}
for gname,g in n['geos'].items():
    C=g['chains'];use={}
    for k,r in g['r'].items():
        for c in r['ch']:use.setdefault(c[0],[]).append(k)
    res=[]
    for e,p in enumerate(C):
        if e not in use:continue
        L=[math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]) for i in range(len(p)-1)]
        A=[ang(p[i-1],p[i],p[i+1]) for i in range(1,len(p)-1)]
        for i,a in enumerate(A):
            if abs(a)>115: res.append(('hook',e,i+1,round(a),p[i+1],use[e]))
        for i in range(len(A)-1):
            a,b=A[i],A[i+1];mid=L[i+1]
            lim=14 if gname=='map' else 22
            if a*b<0 and abs(a)>18 and abs(b)>18 and mid<lim: res.append(('jog',e,i+1,(round(a),round(b),round(mid,1)),p[i+1],use[e]))
            if a*b>0 and abs(a)+abs(b)>150 and mid<lim: res.append(('uturn',e,i+1,(round(a),round(b),round(mid,1)),p[i+1],use[e]))
        if gname=='metro':
            for i in range(len(p)-1):
                d=math.degrees(math.atan2(p[i+1][1]-p[i][1],p[i+1][0]-p[i][0]))%45
                if min(d,45-d)>1.5: res.append(('non-octilinear',e,i,round(d,1),p[i],use[e]))
            for i,a in enumerate(A):
                if abs(a)>95: res.append(('sharp',e,i+1,round(a),p[i+1],use[e]))
        # tiny end segments
        for i,l in enumerate(L):
            if l<(2 if gname=='map' else 6): res.append(('tiny seg',e,i,round(l,1),p[i],use[e]))
    # connection angles
    for k,r in g['r'].items():
        for a,ea,b,eb in r['cx']:
            pa=C[a];pb=C[b]
            A0=pa[-2] if ea else pa[1];V=pa[-1] if ea else pa[0];B0=pb[-2] if eb else pb[1]
            t=ang(A0,V,B0)
            if abs(t)>115: res.append(('cx hook',k,(a,b),round(t),V,[k]))
    out[gname]=res
    print('==',gname,len(res))
    for x in res: print('  ',x[0],x[1],x[2],x[3],[round(v) for v in x[4]],near(x[4],g),','.join(x[5]))
json.dump(out,open('/home/claude/au/kinks.json','w'),ensure_ascii=False)
