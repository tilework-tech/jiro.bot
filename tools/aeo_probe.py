"""AEO prompt panel: ask Gemini (with Google Search grounding) each target question N times and record
whether Jiro is mentioned, whether jiro.bot is cited, and which rival brands appear.

Usage: GEMINI_API_KEY=... python3 tools/aeo_probe.py [runs] > aeo/baseline-YYYY-MM-DD.json
Questions 1-8 match the 2026-10-14 baseline in nori-monorepo docs/specs/jiro-aeo/demo/baseline.json.
"""
import concurrent.futures as cf
import json
import re
import sys

from gemini import MODEL, generate

RIVALS = ["Devin", "Factory", "Cursor background agents", "OpenAI Codex cloud", "GitHub Copilot coding agent",
          "Claude Code on the web", "Amp", "Warp", "Jules", "Kiro"]
QUESTIONS = [
    ("how-to", "How do I run Claude Code in Slack for my team?"),
    ("how-to", "How can I have an AI agent clean up dead code in my repo every week?"),
    ("how-to", "How do I run a coding agent in the cloud with my own Claude subscription?"),
    ("guide", "What's the best background coding agent for a Django codebase?"),
    ("guide", "How do I set up an AI agent that opens pull requests on my Next.js repo?"),
    ("compare", "What are the best alternatives to Devin?"),
    ("compare", "Jiro vs Devin: which is better?"),
    ("brand", "What is Jiro (jiro.bot) AI software engineer?"),
    *[("alternatives", f"What are the best {rival} alternatives?") for rival in RIVALS],
    ("compare", "Jiro vs Kiro: what is the difference?"),
    ("list", "What are the best background coding agents in 2026?"),
]
BRANDS = r"\b(Jiro|Devin|Factory|Cursor|Codex|Copilot|Claude Code|Amp|Kiro|Jules|Warp|Tembo|OpenHands|Sweep|Cline|Aider|Kilo|Nori)\b"


def ask(question):
    candidate = generate({"contents": [{"parts": [{"text": question}]}], "tools": [{"google_search": {}}]})["candidates"][0]
    text = "".join(p.get("text", "") for p in candidate["content"]["parts"])
    sources = [c["web"].get("title", "") + " " + c["web"].get("uri", "")
               for c in candidate.get("groundingMetadata", {}).get("groundingChunks", []) if "web" in c]
    return {"mention": bool(re.search(r"\bjiro\b", text, re.IGNORECASE) and not re.search(r"jiro dreams", text, re.IGNORECASE)),
            "cited": any("jiro.bot" in s.lower() for s in sources),
            "kiro_confusion": bool(re.search(r"\bjiro\b", question, re.IGNORECASE) and re.search(r"\bkiro\b", text, re.IGNORECASE)
                                   and "kiro" not in question.lower()),
            "brands": sorted(set(re.findall(BRANDS, text)))}


def main():
    runs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    jobs = [(cat, q) for cat, q in QUESTIONS for _ in range(runs)]
    with cf.ThreadPoolExecutor(6) as pool:
        results = list(pool.map(lambda job: (job, ask(job[1])), jobs))
    out = {"model": MODEL, "runs": runs, "questions": {}}
    for (cat, q), r in results:
        o = out["questions"].setdefault(q, {"cat": cat, "runs": 0, "mention": 0, "cited": 0, "kiro_confusion": 0, "brands": {}})
        o["runs"] += 1
        o["mention"] += r["mention"]
        o["cited"] += r["cited"]
        o["kiro_confusion"] += r["kiro_confusion"]
        for b in r["brands"]:
            o["brands"][b] = o["brands"].get(b, 0) + 1
    json.dump(out, sys.stdout, indent=1)
    print()


if __name__ == "__main__":
    main()
