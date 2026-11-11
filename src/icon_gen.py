import math
def save(n,b):open(n+'.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{b}</svg>')
# 坂（スロープ）を上る一本の線：水平→45°上り→水平。上りの途中に停留所。
def slope(bg,line,stop,ink,n,line2=None):
    W=118;y1,y2=700,330;xa,xb=330,330+(y1-y2)   # 45°区間
    r=150
    k=r*math.tan(math.radians(22.5))
    p=(f'M -40 {y1} H {xa-k} Q {xa} {y1} {xa+k/math.sqrt(2)} {y1-k/math.sqrt(2)} '
       f'L {xb-k/math.sqrt(2)} {y2+k/math.sqrt(2)} Q {xb} {y2} {xb+k} {y2} H 1064')
    b=f'<rect width="1024" height="1024" fill="{bg}"/><path d="{p}" fill="none" stroke="{line}" stroke-width="{W}" stroke-linejoin="round"/>'
    cx,cy=(xa+xb)/2,(y1+y2)/2;L=W+120;H=92
    b+=f'<g transform="translate({cx} {cy}) rotate(-45)"><rect x="{-H/2}" y="{-L/2}" width="{H}" height="{L}" rx="{H/2}" fill="{stop}" stroke="{ink}" stroke-width="24"/></g>'
    save(n,b)
slope('#0f7b6c','#ffffff','#ffffff','#0b3b34','E')
slope('#f4efe6','#1f4fd8','#ffffff','#14161b','F')
slope('#ffd23f','#14161b','#ffffff','#14161b','G')
# 二つの市＝二つの円、重なりに停留所
b='<rect width="1024" height="1024" fill="#f4efe6"/>'
b+='<circle cx="400" cy="512" r="250" fill="#1d9bf0"/><circle cx="624" cy="512" r="250" fill="#ff5a5f" style="mix-blend-mode:multiply"/>'
b+='<rect x="474" y="370" width="76" height="284" rx="38" fill="#fff" stroke="#14161b" stroke-width="24"/>'
save('H',b)
