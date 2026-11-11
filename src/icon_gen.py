import math
# 坂戸市役所：関間方面から3路線が束になって来て、市役所で北（さかど駅線）・北東（しがいち線）・南東（みよしの線）に分かれる
W=58;GAP=24;s=W+GAP
lanes=[('#5b3a98',-1,-45),('#1b95d3',0,0),('#e5243b',1,45)]   # (色, 束内の位置, 分岐後の曲がり角 +右/-左)
ST=(500,556)   # 駅の中心
th=math.radians(45)   # 進行方向：右上45°
def dr(t):return (math.cos(t),-math.sin(t))
def nr(t):return (math.sin(t),math.cos(t))   # 進行方向の右側
FORK=120;R0=130
def lane(o,turn):
    D=dr(th);N=nr(th);P=[]
    for k in range(-900,FORK+1,10):
        P.append((ST[0]+D[0]*k+N[0]*o*s,ST[1]+D[1]*k+N[1]*o*s))
    x,y=P[-1];t=th;a=math.radians(-turn)
    if turn:
        r=R0+(o*s if turn>0 else -o*s)  # 外側ほど大きく（同心円）
        n=48
        for i in range(n):
            t2=t+a/n;mx,my=dr(t+a/n/2);step=abs(a/n)*r;x+=mx*step;y+=my*step;t=t2;P.append((x,y))
    D=dr(t)
    for k in range(1,60):P.append((x+D[0]*20*k,y+D[1]*20*k))
    return P
out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">',
'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdfcf9"/><stop offset="1" stop-color="#ebe7df"/></linearGradient>',
'<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".16"/></filter></defs>',
'<rect width="1024" height="1024" fill="url(#bg)"/>']
g=['<g fill="none" stroke="#2b2b30" stroke-opacity=".045" stroke-width="3">']
for v in range(64,1024,128):g.append(f'<path d="M{v} 0V1024M0 {v}H1024"/>')
g.append('</g>');out+=g
for c,o,t in lanes:
    P=lane(o,t)
    out.append('<polyline fill="none" stroke="%s" stroke-width="%d" stroke-linecap="round" stroke-linejoin="round" points="%s"/>'%(c,W,' '.join('%.1f,%.1f'%p for p in P)))
L=2*s+W+44;H=92
out.append(f'<g transform="translate({ST[0]} {ST[1]}) rotate(45)" filter="url(#sh)"><rect x="{-L/2}" y="{-H/2}" width="{L}" height="{H}" rx="{H/2}" fill="#fff" stroke="#1c1c1e" stroke-width="20"/></g>')
out.append('</svg>');open('icon2.svg','w').write('\n'.join(out))
