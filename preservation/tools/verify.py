#!/usr/bin/env python3
"""Verify all bytes in the committed preservation inventory."""
from pathlib import Path
import hashlib, sys
root=Path(__file__).resolve().parents[2]
manifest=root/'preservation/SHA256SUMS'
errors=[]; count=0
for line in manifest.read_text().splitlines():
    sha,relative=line.split('  ',1);p=root/relative
    if not p.is_file(): errors.append('MISSING '+relative)
    elif hashlib.sha256(p.read_bytes()).hexdigest()!=sha: errors.append('CHANGED '+relative)
    count+=1
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'OK: {count} files match the saved SHA-256 inventory')
