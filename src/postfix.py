# hand-tidy of the diagram around 鶴ヶ島市役所 for 松ヶ丘・関越病院線 (run after mkdata.py)
import json
n=json.load(open('/home/claude/app/net_all.json'));g=n['geos']['metro'];S=n['stops']
r=g['r']['matsugaoka']
if any(c[0]==93 for c in r['ch']):
    assert g['chains'][94]==[[540.0,600.0],[480.0,660.0]]
    r['ch']=[c for c in r['ch'] if c[0] not in (93,96)]
    r['cx']=[x for x in r['cx'] if not ({x[0],x[2]}&{93,96})]+[[94,1,97,0]]
    sid={s['name']:i for i,s in enumerate(S)}
    def put(name,s):
        i=sid[name];d=s/2**.5;p=[round(540-d,2),round(600+d,2)]
        r['st']=[x for x in r['st'] if x[0]!=i]+[[i,94,s]]
        g['sp'][i]=p;g['cp'][S[i]['cl']]=p
    put('慈眼寺東',8);put('三ツ木自治会館',55)
    order=[x for x in n['routes'] if x['k']=='matsugaoka'][0]['order']
    r['st'].sort(key=lambda x:order.index(x[0]))
    json.dump(n,open('/home/claude/app/net_all.json','w'),ensure_ascii=False,separators=(',',':'))
    print('patched')
n=json.load(open('/home/claude/app/net_all.json'));r=n['geos']['metro']['r']['sakadoeki']
if [74,1,81,1] not in r['cx']:
    r['cx'].append([74,1,81,1]);json.dump(n,open('/home/claude/app/net_all.json','w'),ensure_ascii=False,separators=(',',':'))
# v2: trunk joins at 白鬚神社前 (no crossing, no triangle)
n=json.load(open('/home/claude/app/net_all.json'));g=n['geos']['metro'];S=n['stops'];r=g['r']['matsugaoka']
if any(c[0]==95 for c in r['ch']):
    g['chains'][94]=[[510.0,600.0],[480.0,630.0],[480.0,660.0]]
    r['ch']=[c for c in r['ch'] if c[0]!=95]
    r['cx']=[x for x in r['cx'] if 95 not in (x[0],x[2])]+[[94,0,74,0]]
    sid={s['name']:i for i,s in enumerate(S)}
    for name,s,p in [('慈眼寺東',21,[495.15,614.85]),('三ツ木自治会館',57,[480.0,644.6])]:
        i=sid[name]
        for x in r['st']:
            if x[0]==i: x[1]=94;x[2]=s
        g['sp'][i]=p;g['cp'][S[i]['cl']]=p
    json.dump(n,open('/home/claude/app/net_all.json','w'),ensure_ascii=False,separators=(',',':'));print('v2 patched')
n=json.load(open('/home/claude/app/net_all.json'));g=n['geos']['metro'];S=n['stops'];r=g['r']['matsugaoka']
i=[j for j,s in enumerate(S) if s['name']=='鶴ヶ島市役所'][0];ch=False
for x in r['st']:
    if x[0]==i and x[1]==74 and x[2]<72: x[2]=72.43;ch=True
if ch: json.dump(n,open('/home/claude/app/net_all.json','w'),ensure_ascii=False,separators=(',',':'));print('v3 patched')
n=json.load(open('/home/claude/app/net_all.json'));r=n['geos']['metro']['r']['matsugaoka'];ch=False
for c in r['ch']:
    if c[0]==94 and c[1]!=1.5: c[1]=1.5;ch=True
if ch: json.dump(n,open('/home/claude/app/net_all.json','w'),ensure_ascii=False,separators=(',',':'));print('v4 patched')
