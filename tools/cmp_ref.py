import json,pickle,sys,numpy as np
from scipy.spatial import cKDTree
from ref import dens
ref=pickle.load(open('/home/claude/fix/ref.pkl','rb'))
n=json.load(open(sys.argv[1] if len(sys.argv)>1 else '/home/claude/repo/data/net_all.json'));g=n['geos']['map'];S=n['stops']
TOL=float(sys.argv[2]) if len(sys.argv)>2 else 8
def nearstop(p):
    b=min((np.hypot(q[0]-p[0],q[1]-p[1]),S[i]['name']) for i,q in enumerate(g['sp']) if S[i]['routes']);return b[1]
def runs(P,mask):
    out=[];cur=[]
    for p,m in zip(P,mask):
        if m:cur.append(p)
        elif cur:out.append(np.array(cur));cur=[]
    if cur:out.append(np.array(cur))
    return out
tot=0
for k in g['r']:
    mine=dens([g['chains'][c[0]] for c in g['r'][k]['ch']]);off=dens(ref[k])
    d1=cKDTree(mine).query(off)[0];d2=cKDTree(off).query(mine)[0]
    A=[r for r in runs(off,d1>TOL) if len(r)>=3];B=[r for r in runs(mine,d2>TOL) if len(r)>=3]
    if A or B:print(k,'| max missing',round(d1.max(),1),'max extra',round(d2.max(),1))
    for r in A:print('   MISSING (official has, I lack):',len(r)*1.5,'pt near',nearstop(r[len(r)//2]),[round(v) for v in r[len(r)//2]]);tot+=1
    for r in B:print('   EXTRA/OFF (I draw, official not):',len(r)*1.5,'pt near',nearstop(r[len(r)//2]),[round(v) for v in r[len(r)//2]]);tot+=1
print('total',tot)
