#!/usr/bin/env python3
"""Extract every Gemini/Veo generation command (gen_still.py / gen_text.py / gen_veo.py) and
every prompt file written by the build agents from Claude Code session transcripts.

usage: extract_gen_calls.py TRANSCRIPT_DIR > ../prompts/gemini-calls.md
TRANSCRIPT_DIR is ~/.claude/projects/<proj>/<session-id> (main <session-id>.jsonl sits next to it,
subagents in TRANSCRIPT_DIR/subagents/*.jsonl with a *.meta.json holding the agent description).
"""
import glob, json, os, re, sys

d = sys.argv[1].rstrip("/")
files = [(d + ".jsonl", "main session (lead agent)")]
for f in sorted(glob.glob(d + "/subagents/*.jsonl")):
    meta = f[:-6] + ".meta.json"
    desc = json.load(open(meta)).get("description", "") if os.path.exists(meta) else ""
    if desc.startswith("Doc:"):
        continue  # documentation agents only read the scripts
    files.append((f, desc))

GEN = re.compile(r"gen_still|gen_text|gen_veo|generateContent|predictLongRunning")
out = ["# Gemini / Veo generation calls (verbatim, extracted from the build transcripts)\n",
       "Commands are shown exactly as the agents ran them (shell quoting included). `$R`/`P`/cwd refer to the",
       "agent's shell at the time; `restaurant/` = this repo folder. Prompt files written with the Write tool are",
       "included where they fed a generation. Order = chronological within each agent.\n"]
for f, desc in files:
    if not os.path.exists(f):
        continue
    calls = []
    for line in open(f):
        try:
            j = json.loads(line)
        except Exception:
            continue
        m = j.get("message")
        if not isinstance(m, dict) or not isinstance(m.get("content"), list):
            continue
        ts = j.get("timestamp", "")[:19]
        for p in m["content"]:
            if p.get("type") != "tool_use":
                continue
            inp = p.get("input", {})
            cmd = inp.get("command", "")
            # keep real generation runs; drop read-only peeks (cat/sed/grep of the script)
            if p.get("name") == "Bash" and GEN.search(cmd) and re.search(r'"[^"]{120,}"|\'[^\']{120,}\'|<<', cmd) \
                    and re.search(r"gen_(still|text|veo)\.py\s+\S|\$(G|P|GEN)\s+\S+\.png|generateContent|predictLongRunning", cmd):
                calls.append((ts, "bash", inp["command"]))
            elif p.get("name") == "Write":
                fp = inp.get("file_path", "")
                c = inp.get("content", "")
                if re.search(r"prompt|\.txt$", fp) and re.search(r"pixel|Same (image|scene)|16-bit|reference", c, re.I):
                    calls.append((ts, "write " + fp, c))
    if not calls:
        continue
    out.append(f"\n## {desc or os.path.basename(f)}\n\n_transcript: {os.path.basename(f)}_\n")
    for ts, kind, text in calls:
        out.append(f"\n**{ts}** `{kind}`\n\n````\n{text.strip()}\n````\n")
print("\n".join(out))
