import sys, json, base64, urllib.request, os
key=os.environ['GEMINI_API_KEY']; model=sys.argv[1]; out=sys.argv[2]; prompt=sys.argv[3]
img=base64.b64encode(open('/tmp/sprites/jiro-original.png','rb').read()).decode()
body={"contents":[{"parts":[{"inline_data":{"mime_type":"image/png","data":img}},{"text":prompt}]}],
      "generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":"1:1"}}}
req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
    data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
r=json.load(urllib.request.urlopen(req,timeout=300))
for p in r['candidates'][0]['content']['parts']:
    if 'inlineData' in p:
        open(out,'wb').write(base64.b64decode(p['inlineData']['data'])); print(out,'saved'); break
else: print(out,'NO IMAGE',json.dumps(r)[:300])
