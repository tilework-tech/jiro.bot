#!/usr/bin/env python3
"""Explicitly update inventory after staging intentional preservation changes."""
from pathlib import Path
import hashlib,subprocess
root=Path(__file__).resolve().parents[2]
paths=subprocess.check_output(['git','ls-files','-z','--','demo1','demo2','demo4','demo5','showcase','preservation'],cwd=root).decode().split('\0')
paths=sorted(p for p in paths if p and p not in ['preservation/SHA256SUMS'])
(root/'preservation/SHA256SUMS').write_text(''.join(f'{hashlib.sha256((root/p).read_bytes()).hexdigest()}  {p}\n' for p in paths))
print(f'Inventoried {len(paths)} files')
