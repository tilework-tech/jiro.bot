#!/usr/bin/env python3
"""Package built snapshots with local fonts; leaves all historical source unchanged."""
from pathlib import Path
import hashlib, json, re, shutil, subprocess, tarfile, tempfile
root=Path(__file__).resolve().parents[1]; repo=root.parent
sites={'demo1':'demo1/site','demo2':'demo2/restaurant','demo4':'demo4/restaurant','demo5':'demo5/site'}
manifest={}
for demo,site in sites.items():
    dist=repo/site/'dist'
    if not dist.is_dir(): raise SystemExit(f'Build {site} first with npm ci && npm run build')
    with tempfile.TemporaryDirectory() as tmp:
        out=Path(tmp)/demo; shutil.copytree(dist,out)
        shutil.copytree(root/'fonts',out/'preserved-fonts')
        for html in out.rglob('*.html'):
            s=html.read_text()
            s=re.sub(r'<link[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', s)
            relative=Path(__import__('os').path.relpath(out/'preserved-fonts'/f'{demo}.css',html.parent)).as_posix()
            s=s.replace('</head>', f'<link rel="stylesheet" href="{relative}">\n</head>')
            html.write_text(s)
        hashes={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file()}
        archive=root/'builds'/f'{demo}.tar.gz'
        with tarfile.open(archive,'w:gz') as tar: tar.add(out,arcname=demo)
        manifest[demo]={'source':site,'archive':str(archive.relative_to(root)),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':hashes}
        print(demo,len(hashes),'files',archive.stat().st_size,'bytes',flush=True)
(root/'builds/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
