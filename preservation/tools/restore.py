#!/usr/bin/env python3
"""Restore and verify ready-built demos without npm or an internet connection."""
from pathlib import Path
import hashlib, json, tarfile
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'builds/manifest.json').read_text())
out=root/'.playback'; out.mkdir(exist_ok=True)
for name,entry in manifest.items():
    archive=root/entry['archive']
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==entry['sha256'], f'{name}: archive checksum mismatch'
    with tarfile.open(archive) as tar:
        for member in tar.getmembers():
            target=(out/member.name).resolve()
            if not target.is_relative_to(out.resolve()) or not (member.isfile() or member.isdir()):
                raise ValueError('Unsafe archive member: '+member.name)
        tar.extractall(out)
    for relative,sha in entry['files'].items():
        assert hashlib.sha256((out/name/relative).read_bytes()).hexdigest()==sha, f'{name}/{relative}: mismatch'
    print(f'{name}: restored and verified {len(entry["files"])} files')
print('Start from repository root: JIRO_PRESERVED_ROOT=preservation/.playback PORT=3200 node showcase/serve.mjs')
