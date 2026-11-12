import json,math,copy
def ang(a,b,c):
    u=(b[0]-a[0],b[1]-a[1]);v=(c[0]-b[0],c[1]-b[1])
    return math.degrees(math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]))
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def plen(p):return sum(dist(p[i],p[i+1]) for i in range(len(p)-1))
def at(p,s):
    for i in range(len(p)-1):
        l=dist(p[i],p[i+1])
        if s<=l or i==len(p)-2:
            f=0 if l==0 else max(0,min(1,s/l));return [p[i][0]+(p[i+1][0]-p[i][0])*f,p[i][1]+(p[i+1][1]-p[i][1])*f]
        s-=l
def project(p,q):
    """return (s, d, point) of closest point on polyline p to q"""
    best=(0,1e18,p[0]);acc=0
    for i in range(len(p)-1):
        a,b=p[i],p[i+1];dx,dy=b[0]-a[0],b[1]-a[1];L=dx*dx+dy*dy
        t=0 if L==0 else max(0,min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dy)/L))
        pt=[a[0]+t*dx,a[1]+t*dy];d=dist(pt,q)
        if d<best[1]:best=(acc+t*math.sqrt(L),d,pt)
        acc+=math.sqrt(L)
    return best
def rdp(p,eps):
    if len(p)<3:return p[:]
    a,b=p[0],p[-1];dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy) or 1e-9
    dm=-1;im=0
    for i in range(1,len(p)-1):
        d=abs((p[i][0]-a[0])*dy-(p[i][1]-a[1])*dx)/L
        if d>dm:dm=d;im=i
    if dm<=eps:return [a,b]
    return rdp(p[:im+1],eps)[:-1]+rdp(p[im:],eps)
class Geo:
    def __init__(self,net,name):
        self.net=net;self.g=net['geos'][name];self.C=self.g['chains'];self.S=net['stops']
        # remember absolute stop positions and end flags
        self.old={}
        for k,r in self.g['r'].items():
            for i,(sid,e,s) in enumerate(r['st']):
                L=plen(self.C[e]);self.old[(k,i)]=(at(self.C[e],s),'a' if s<.05 else 'b' if s>L-.05 else None)
    def nodes(self,tol=1.0):
        """group chain ends that coincide -> list of lists of (chain,end)"""
        ends=[(e,0) for e in range(len(self.C))]+[(e,1) for e in range(len(self.C))]
        used=self.used();ends=[x for x in ends if x[0] in used]
        grp=[]
        for e,en in ends:
            p=self.C[e][-1 if en else 0]
            for g in grp:
                if dist(g['p'],p)<=tol:g['m'].append((e,en));break
            else:grp.append({'p':p[:],'m':[(e,en)]})
        return grp
    def used(self):
        u={}
        for k,r in self.g['r'].items():
            for c in r['ch']:u.setdefault(c[0],[]).append(k)
        return u
    def finish(self):
        C=self.C;sp=self.g['sp'];done={}
        for k,r in self.g['r'].items():
            for i,st in enumerate(r['st']):
                sid,e,s=st;P,flag=self.old[(k,i)];L=plen(C[e])
                if flag=='a':ns=0.0
                elif flag=='b':ns=L
                else:
                    ns,d,pt=project(C[e],P);ns=max(min(ns,L-.3),.3) if L>.6 else L/2
                st[2]=round(ns,2);q=at(C[e],ns)
                done.setdefault(sid,[]).append(q)
        for sid,qs in done.items():
            sp[sid]=[round(sum(q[0] for q in qs)/len(qs),2),round(sum(q[1] for q in qs)/len(qs),2)]
        for c in self.net['clusters']:
            ms=[m for m in c['m'] if m in done]
            if ms:self.g['cp'][c['id']]=[round(sum(sp[m][0] for m in ms)/len(ms),2),round(sum(sp[m][1] for m in ms)/len(ms),2)]
        for e in range(len(C)):C[e]=[[round(x,2),round(y,2)] for x,y in C[e]]
def near_stop(net,g,p):
    bd=1e9;bn=None
    for i,q in enumerate(g['sp']):
        d=dist(q,p)
        if d<bd and net['stops'][i]['routes']:bd=d;bn=net['stops'][i]['name']
    return bn
# ---------- editing helpers
import pickle,numpy as _np
_REF=None
def refsub(k,a,b,via=None,tol=4.0):
    """official polyline of route k between map points a and b (optionally passing near via)"""
    global _REF
    if _REF is None:_REF=pickle.load(open('/home/claude/fix/ref.pkl','rb'))
    best=None
    for pl in _REF[k]:
        P=[]
        for u,v in zip(pl[:-1],pl[1:]):
            n=max(1,int(_np.hypot(*(v-u))/0.5))
            for i in range(n):P.append(u+(v-u)*i/n)
        P.append(pl[-1]);P=_np.array(P)
        da=_np.hypot(P[:,0]-a[0],P[:,1]-a[1]);db=_np.hypot(P[:,0]-b[0],P[:,1]-b[1])
        if da.min()>8 or db.min()>8:continue
        A=_np.where(da<da.min()+2.5)[0];B=_np.where(db<db.min()+2.5)[0]
        for i in A[::3]:
            for j in B[::3]:
                lo,hi=min(i,j),max(i,j)
                if via is not None:
                    seg=P[lo:hi+1]
                    if _np.hypot(seg[:,0]-via[0],seg[:,1]-via[1]).min()>tol:continue
                sc=(hi-lo)+4*(da[i]+db[j])
                if best is None or sc<best[0]:best=(sc,P[lo:hi+1] if i<=j else P[lo:hi+1][::-1])
    assert best is not None,('refsub failed',k,a,b,via)
    pts=[[float(x),float(y)] for x,y in best[1]]
    pts=rdp(pts,1.2);pts[0]=list(a);pts[-1]=list(b)
    return pts
def _R(self,k):return self.g['r'][k]
def add_chain(self,pts):
    self.C.append([[float(x),float(y)] for x,y in pts]);return len(self.C)-1
def split(self,e,pt,snap=0.6):
    """split chain e at the point nearest pt; returns index of the tail chain"""
    P=self.C[e];s,d,q=project(P,pt);assert d<3,('split far',e,pt,d)
    acc=0;idx=None
    for i in range(len(P)):
        if i>0:acc+=dist(P[i-1],P[i])
        if abs(acc-s)<snap and 0<i<len(P)-1:idx=i;s=acc;break
    if idx is None:
        acc=0
        for i in range(len(P)-1):
            l=dist(P[i],P[i+1])
            if acc+l>s:P.insert(i+1,[q[0],q[1]]);idx=i+1;break
            acc+=l
    assert idx is not None and 0<idx<len(P)-1,('split at end',e,pt)
    head,tail=P[:idx+1],[p[:] for p in P[idx:]]
    self.C[e]=head;e2=self.add_chain(tail)
    for k,r in self.g['r'].items():
        if not any(c[0]==e for c in r['ch']):continue
        off=[c[1] for c in r['ch'] if c[0]==e][0];r['ch'].append([e2,off])
        for c in r['cx']:
            if c[0]==e and c[1]==1:c[0]=e2
            if c[2]==e and c[3]==1:c[2]=e2
        r['cx'].append([e,1,e2,0])
        for st in r['st']:
            if st[1]==e and st[2]>s+1e-6:st[1]=e2;st[2]=st[2]-s
    return e2
def use(self,k,e,off=0.0):
    r=self.g['r'][k];assert not any(c[0]==e for c in r['ch']);r['ch'].append([e,off])
def setoff(self,k,e,off):
    for c in self.g['r'][k]['ch']:
        if c[0]==e:c[1]=off;return
    raise KeyError((k,e))
def unuse(self,k,e):
    r=self.g['r'][k];assert not any(st[1]==e for st in r['st']),('stops still on',k,e)
    r['ch']=[c for c in r['ch'] if c[0]!=e];r['cx']=[c for c in r['cx'] if e not in (c[0],c[2])]
def cx(self,k,a,ea,b,eb):
    pa=self.C[a][-1 if ea else 0];pb=self.C[b][-1 if eb else 0];assert dist(pa,pb)<0.05,('cx ends apart',k,a,ea,b,eb,pa,pb)
    r=self.g['r'][k];assert any(c[0]==a for c in r['ch']) and any(c[0]==b for c in r['ch']),('cx chain not in route',k,a,b)
    if not any((c==[a,ea,b,eb] or c==[b,eb,a,ea]) for c in r['cx']):r['cx'].append([a,ea,b,eb])
def uncx(self,k,a,ea,b,eb):
    r=self.g['r'][k];n=len(r['cx']);r['cx']=[c for c in r['cx'] if not (c==[a,ea,b,eb] or c==[b,eb,a,ea])];assert len(r['cx'])<n,('uncx missing',k,a,ea,b,eb)
def stop(self,k,name,e,pos=None,flag=None):
    r=self.g['r'][k]
    for i,st in enumerate(r['st']):
        if self.S[st[0]]['name']==name:
            st[1]=e;st[2]=project(self.C[e],pos)[0] if pos is not None else st[2]
            self.old[(k,i)]=(list(pos) if pos is not None else self.old[(k,i)][0],flag);return
    raise KeyError((k,name))
def sname(self,name):
    return [i for i,s in enumerate(self.S) if s['name']==name and s['routes']][0]
for f in (add_chain,split,use,setoff,unuse,cx,uncx,stop,sname):setattr(Geo,f.__name__,f)
