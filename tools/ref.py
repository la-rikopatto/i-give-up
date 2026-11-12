import json,pickle,numpy as np
from scipy.interpolate import RBFInterpolator
W='/home/claude/work/'
def load_ref():
    M=np.load(W+'M2.npy');s_,d_=pickle.load(open(W+'tps.pkl','rb'))
    rbf=RBFInterpolator(s_,d_-s_,kernel='thin_plate_spline',smoothing=50)
    def warp(P):
        P=np.c_[np.asarray(P,float),np.ones(len(P))]@M;return P+rbf(P)
    ref={}
    for k,v in json.load(open(W+'raw.json'))['routes'].items():ref[k]=[np.asarray(s,float) for s in v if len(s)>1]
    for k,v in json.load(open(W+'tg_raw.json'))['routes'].items():ref[k]=[warp(s) for s in v if len(s)>1]
    return ref
def dens(segs,step=1.5):
    pts=[]
    for s in segs:
        s=np.asarray(s,float)
        for a,b in zip(s[:-1],s[1:]):
            n=max(1,int(np.hypot(*(b-a))/step))
            for i in range(n):pts.append(a+(b-a)*i/n)
        pts.append(s[-1])
    return np.array(pts)
if __name__=='__main__':
    ref=load_ref();pickle.dump(ref,open('/home/claude/fix/ref.pkl','wb'))
    for k,v in ref.items():print(k,len(v),round(sum(np.hypot(*np.diff(s,axis=0).T).sum() for s in v)))
