cols=['#9c6234','#5b3a98','#ec5fa0','#e09a2b','#2e9e4a','#1b95d3','#e5243b']
def dark(h,f=.74):
    r,g,b=(int(h[i:i+2],16) for i in (1,3,5));return '#%02x%02x%02x'%(int(r*f),int(g*f),int(b*f))
INK='#1f2024'
b='<rect width="1024" height="1024" fill="#f6efe4"/>'
b+='<circle cx="214" cy="176" r="62" fill="#ffe7bd"/><circle cx="214" cy="176" r="100" fill="#ffe7bd" opacity=".35"/>'
GY=718
b+=f'<rect y="{GY}" width="1024" height="{1024-GY}" fill="#e9dfcf"/>'
RX0,RX1,RT,RB=160,864,236,330
CT,CB=RB,GY
n=7;CW=38;xs=[262+i*(762-262)/(n-1) for i in range(n)]
# 地面に落ちる影（光は左上から → 右下へ）。屋根の影＝カプセルの斜投影
DX,DY=230,150
SH='#d2c3aa'
b+=f'<g fill="{SH}">'
for x in xs: b+=f'<path d="M{x-CW/2} {GY} L{x+CW/2} {GY} L{x+CW/2+DX} {GY+DY} L{x-CW/2+DX} {GY+DY} Z"/>'
b+=f'<rect x="{RX0+DX+40}" y="{GY+DY-8}" width="{RX1-RX0}" height="46" rx="23"/>'
b+='</g>'
# 薄い基壇
b+=f'<rect x="196" y="{GY-14}" width="632" height="14" fill="#fbf8f2"/><path d="M828 {GY} L{828+22} {GY+14} L{196+22} {GY+14} L196 {GY} Z" fill="{SH}"/>'
for x,c in zip(xs,cols):
    b+=f'<rect x="{x-CW/2}" y="{CT}" width="{CW}" height="{CB-14-CT}" fill="{c}"/>'
    b+=f'<rect x="{x+2}" y="{CT}" width="{CW/2-2}" height="{CB-14-CT}" fill="{dark(c)}"/>'
# 屋根下の影（柱上部をうっすら暗く）
b+=f'<rect x="{xs[0]-CW}" y="{RB}" width="{xs[-1]-xs[0]+2*CW}" height="40" fill="{INK}" opacity=".12"/>'
# 屋根：駅カプセル
b+=f'<rect x="{RX0}" y="{RT}" width="{RX1-RX0}" height="{RB-RT}" rx="{(RB-RT)/2}" fill="#fff" stroke="{INK}" stroke-width="18"/>'
b+=f'<path d="M{RX0+42} {(RT+RB)/2+14} H{RX1-42}" stroke="#e9e3d8" stroke-width="16" stroke-linecap="round"/>'
open('F.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{b}</svg>')
