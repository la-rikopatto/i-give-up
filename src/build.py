# repo root で実行: python3 src/build.py -> index.html
t=open('src/head.html').read()+"const NET=__NET__;\nconst BASE=__BASE__;\n"+open('src/core2.js').read().split("const BASE=__BASE__;")[-1]+"\n"+open('src/ui.js').read()
open('index.html','w').write(t.replace('__NET__',open('data/net_all.json').read()).replace('__BASE__',open('data/base.json').read()))
