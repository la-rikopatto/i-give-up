import json,math,sys
from geolib import *
net=json.load(open('/home/claude/fix/net_v97.json'))
G=Geo(net,'map');C=G.C
# ================= topology fixes against the official PDFs =================
# --- 鶴舞: the estate is a small closed loop, not two dead ends
T1=G.add_chain(refsub('oya',C[98][0],C[85][0]))
G.use('oya',T1,-0.5);G.use('tsurumai',T1,0.5)
for k in ('oya','tsurumai'):
    G.uncx(k,85,1,98,1);G.cx(k,98,0,T1,0);G.cx(k,T1,1,85,0)
G.cx('tsurumai',98,1,111,0)
# --- にっさい線: 中富町→粟生田 loop, and the 小山–堀込 link
_l=refsub('nissai',C[73][0],C[53][0],via=(525.5,400));L1=G.add_chain([_l[0],[541.0,402.2]]+[p for p in _l[1:] if p[0]<535])
G.use('nissai',L1,0.0);G.cx('nissai',73,0,L1,0);G.cx('nissai',L1,1,53,0)
G.uncx('nissai',73,1,108,0);G.uncx('nissai',53,1,108,1);G.cx('nissai',90,1,108,0);G.cx('nissai',108,1,112,1)
G.use('nissai',5,0.5);G.setoff('shiroyama',5,-0.5);G.cx('nissai',5,1,23,0);G.cx('nissai',3,0,5,0)
# --- みよしの線: block loop at ことぶき荘
e25b=G.split(25,(960.5,174.35))
K=G.add_chain(refsub('miyoshino',C[25][-1],C[104][1],via=(948.8,157.7)))
G.use('miyoshino',K,0.0);G.cx('miyoshino',25,1,K,0);G.cx('miyoshino',K,1,104,1)
# --- 上広谷・坂戸駅南口線: closes the loop from 関越病院 back to 善能寺
e88b=G.split(88,(569.0,549.67))
X1=G.add_chain([C[88][-1],C[74][0]])
G.use('kamihiroya',X1,0.0);G.use('kamihiroya',74,0.0)
G.cx('kamihiroya',88,1,X1,0);G.cx('kamihiroya',X1,1,74,0);G.cx('kamihiroya',74,1,44,1)
# --- 東西線: 西市民センター–蔵の湯 link, 鶴ヶ島ケアホーム–main road link
_f=refsub('touzai',C[14][1],C[79][-1],via=(426.2,646.8));F1=G.add_chain([_f[0]]+[p for p in _f[1:] if p[0]>415])
G.use('touzai',F1,0.0);G.cx('touzai',14,1,F1,0);G.cx('touzai',F1,1,79,1)
e78b=G.split(78,(522.05,605.5))
H1=G.add_chain(refsub('touzai',C[40][-1],C[78][-1],via=(536.9,628)))
G.use('touzai',H1,0.0);G.cx('touzai',40,1,H1,0);G.cx('touzai',H1,1,78,1);G.cx('touzai',H1,1,e78b,0)
# --- 南北線 / 松ヶ丘線 around 清光苑・カインズホーム
J=project(C[6],(567.6,763.0))[2]
e6b=G.split(6,J)
G.stop('nanboku','清光苑',38,None)       # re-homed below
G.unuse('nanboku',8)
i=min(range(len(C[38])),key=lambda j:dist(C[38][j],(577.67,738.33)))
C[38]=C[38][:i+1]+[[569.3,751.2],list(C[6][-1])]
G.stop('nanboku','清光苑',38,(569.3,751.2))
r=G.g['r']['nanboku'];r['cx']=[c for c in r['cx'] if not (c[:2]==[38,1] or c[2:]==[38,1])]
G.cx('nanboku',38,1,e6b,0);G.cx('nanboku',6,0,7,0)
e83b=G.split(83,(592.33,729.67))
_m=refsub('matsugaoka',C[83][-1],C[37][-1],via=(602.33,706.67));M1=G.add_chain([p for p in _m if p[1]>709]+[[602.33,706.67],_m[-1]])
G.use('matsugaoka',e83b,-1.0);G.use('matsugaoka',M1,0.0)
G.stop('matsugaoka','三ツ木自治会館',M1,(602.33,706.67));G.unuse('matsugaoka',81)
G.cx('matsugaoka',99,1,e83b,1);G.cx('matsugaoka',e83b,0,M1,0);G.cx('matsugaoka',M1,1,37,1)
e80b=G.split(80,(613.0,701.33))
_e=refsub('nanboku',C[61][0],C[80][-1],via=(629.4,683.9))
P39=project(C[39],_e[1])[2];e39b=G.split(39,P39)
E1=G.add_chain([list(C[39][-1])]+_e[2:])
G.use('nanboku',E1,0.0);G.use('nanboku',e80b,1.5)
G.cx('nanboku',E1,1,e80b,0);G.cx('nanboku',e80b,1,100,1);G.cx('nanboku',E1,0,e39b,0)
NEW=dict(T1=T1,L1=L1,K=K,X1=X1,F1=F1,H1=H1,M1=M1,E1=E1)
print({k:[[round(x,1),round(y,1)] for x,y in C[v]] for k,v in NEW.items()})
# ================= smoothing =================
used=G.used();log=[]
def dejog(p,T=14,A=15):
    p=[q[:] for q in p]
    while True:
        best=None
        for i in range(1,len(p)-2):
            a=ang(p[i-1],p[i],p[i+1]);b=ang(p[i],p[i+1],p[i+2]);m=dist(p[i],p[i+1])
            if a*b<0 and abs(a)>=A and abs(b)>=A and m<T:
                if best is None or m<best[0]:best=(m,i)
        if not best:break
        i=best[1];mid=[(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2];p[i:i+2]=[mid]
    return p
for e in used:
    p=dejog(C[e])
    if len(p)!=len(C[e]):log.append(e)
    C[e]=rdp(p,1.0)
G.finish()
# ================= diagram: one position per stop =================
gm=net['geos']['metro'];Cm=gm['chains'];Sx=net['stops'];grp={}
for k,r in gm['r'].items():
    for st in r['st']:grp.setdefault(Sx[st[0]]['cl'],[]).append((k,st))
for cl,Ls in grp.items():
    P=[at(Cm[st[1]],st[2]) for k,st in Ls]
    if max(dist(a,b) for a in P for b in P)<=4:continue
    ends=[p for (k,st),p in zip(Ls,P) if st[2]<.05 or st[2]>plen(Cm[st[1]])-.05]
    if not ends:print('metro: no anchor for',net['clusters'][cl]['name']);continue
    T=ends[0]
    for k,st in Ls:
        e=st[1]
        if dist(Cm[e][0],T)<.5:st[2]=0.0
        elif dist(Cm[e][-1],T)<.5:st[2]=round(plen(Cm[e]),2)
        else:print('metro: cannot snap',net['clusters'][cl]['name'],k)
    for k,st in Ls:gm['sp'][st[0]]=[T[0],T[1]]
    gm['cp'][cl]=[T[0],T[1]]
json.dump(net,open('/home/claude/repo/data/net_all.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(log),'chains dejogged; chains',len(C))
