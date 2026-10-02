#!/usr/bin/env python3
"""Explicit maintenance command: snapshot Google Fonts CSS and every referenced font."""
from pathlib import Path
import hashlib, json, re, urllib.request
root=Path(__file__).resolve().parents[1]/'fonts'
repo=root.parents[1]
sites={'demo1':'demo1/site','demo2':'demo2/restaurant','demo4':'demo4/restaurant','demo5':'demo5/site'}
ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
manifest={}
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':ua}),timeout=40) as r: return r.read()
for name,site in sites.items():
    html=(repo/site/'index.html').read_text()
    url=re.search(r'href="(https://fonts.googleapis.com/css2[^\"]+)"',html)[1]
    css=get(url).decode()
    (root/f'{name}.original.css').write_text(css)
    records=[]
    for asset in sorted(set(re.findall(r'url\((https://[^)]+)\)',css))):
        data=get(asset); sha=hashlib.sha256(data).hexdigest(); filename=sha+'.woff2'
        (root/filename).write_bytes(data)
        records.append({'url':asset,'file':filename,'sha256':sha,'bytes':len(data)})
        css=css.replace(asset,filename)
    (root/f'{name}.css').write_text(css)
    manifest[name]={'css_url':url,'user_agent':ua,'assets':records}
    print(name,len(records),'font files',flush=True)
for family,folder in [('Inter','inter'),('Pixelify Sans','pixelifysans'),('JetBrains Mono','jetbrainsmono'),('Instrument Sans','instrumentsans'),('Silkscreen','silkscreen')]:
    (root/(folder+'-OFL.txt')).write_bytes(get(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt'))
(root/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
