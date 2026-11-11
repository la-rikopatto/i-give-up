import math
cols=['#9c6234','#5b3a98','#ec5fa0','#e09a2b','#2e9e4a','#1b95d3','#e5243b']  # 坂戸市役所を通る7路線（関間→市役所の並び順）
N=len(cols);d=36;w=30
def pts_lane(i):
    o=(i-(N-1)/2)*d           # +o = 右側(進行方向に対して)
    P=[]
    # 区間1: 左端から水平に右へ (方向0°)、y=Y0
    Y0=700;X1=250;R=230      # R: 中心線の曲率半径（左折=上へ）
    th0=0;th1=math.radians(45)
    # 法線(右側)=進行方向を時計回り90°: dir(cos t, -sin t) 画面座標でyは下向き
    def nrm(t):return (math.sin(t),math.cos(t))
    def dr(t):return (math.cos(t),-math.sin(t))
    for x in range(-80,X1+1,10):P.append((x+o*nrm(0)[0],Y0+o*nrm(0)[1]))
    cx,cy=X1,Y0-R
    for k in range(1,41):
        t=th1*k/40;px=cx+R*math.sin(t);py=cy+R*math.cos(t)
        n=nrm(t);P.append((px+o*n[0],py+o*n[1]))
    # 直線（駅を通る）
    L=400;sx,sy=cx+R*math.sin(th1),cy+R*math.cos(th1);D=dr(th1);n=nrm(th1)
    for k in range(1,41):
        px=sx+D[0]*L*k/40;py=sy+D[1]*L*k/40;P.append((px+o*n[0],py+o*n[1]))
    ex,ey=px,py
    # 分岐：各線が少しずつ違う方向へ広がる
    a=math.radians((i-(N-1)/2)*-10)   # 右側の線ほど右へ
    t=th1;x,y=ex+o*n[0],ey+o*n[1];Rf=340
    steps=40
    for k in range(steps):
        t+=-a/steps*-1 if False else a/steps
        dx,dy=dr(t);x+=dx*abs(a)*Rf/steps if a else dx*0;y+=dy*abs(a)*Rf/steps if a else 0
        if a:P.append((x,y))
    dx,dy=dr(t)
    for k in range(1,30):P.append((x+dx*25*k,y+dy*25*k))
    return P,(sx+D[0]*L*0.3,sy+D[1]*L*0.3),th1
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">',
'<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#eeeae2"/></linearGradient></defs>',
'<rect width="1024" height="1024" fill="url(#bg)"/>']
_,C0,_=pts_lane(0);SX,SY=512-C0[0]-30,512-C0[1]+40
for i,c in enumerate(cols):
    P,C,th=pts_lane(i);P=[(x+SX,y+SY) for x,y in P];C=(C[0]+SX,C[1]+SY)
    svg.append('<polyline fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="round" stroke-linecap="round" points="%s"/>'%(c,w,' '.join('%.1f,%.1f'%p for p in P)))
# 駅（カプセル）：束に直交
cx,cy=C;ang=-45+90
Lc=N*d+26;Hc=58
svg.append('<g transform="translate(%.1f %.1f) rotate(%.1f)"><rect x="%.1f" y="%.1f" width="%.1f" height="%d" rx="%.1f" fill="#fff" stroke="#1c1c1e" stroke-width="18"/></g>'%(cx,cy,ang,-Lc/2,-Hc/2,Lc,Hc,Hc/2))
svg.append('</svg>')
open('icon.svg','w').write('\n'.join(svg))
