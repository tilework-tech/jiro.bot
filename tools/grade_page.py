"""Pre-publish AEO grader: an LLM judge scores each generated page's markdown on answer-engine readiness.

Usage: GEMINI_API_KEY=... python3 tools/grade_page.py [slug ...] > aeo/grades-YYYY-MM-DD.jsonl
The judge is lenient (it once scored a page with a [TK] placeholder 12/12), so tools/lint.py must also pass.
"""
import json
import pathlib
import sys
import tomllib

from gemini import MODEL, generate

REPO = pathlib.Path(__file__).resolve().parent.parent
RUBRIC = """You are grading a web page for answer-engine optimization. Target question: "{q}".
Score 0-2 each: direct_answer (answers the question in first 2 sentences), extractable (a model could quote one passage verbatim as the answer),
specific (concrete facts, commands, numbers vs. marketing fluff), entity_clarity (makes clear Jiro = background coding agent by Nori, not the sushi chef / Kiro / Jira),
claims_risk (2 = every claim checkable, 0 = unverifiable or placeholder claims), freshness (dated, current).
Then answer the target question in 2 sentences using ONLY the page, as an answer engine would.
Return JSON: {{"scores":{{...}},"total":int,"engine_answer":str,"fix":str}}
PAGE:
{page}"""


def grade(question, page_md):
    response = generate({"contents": [{"parts": [{"text": RUBRIC.format(q=question, page=page_md)}]}],
                         "generationConfig": {"responseMimeType": "application/json"}})
    return json.loads(response["candidates"][0]["content"]["parts"][0]["text"])


def main():
    wanted = set(sys.argv[1:])
    for path in sorted((REPO / "content" / "pages").glob("*.toml")):
        page = tomllib.loads(path.read_text())
        if wanted and page["slug"] not in wanted:
            continue
        result = grade(page["question"], (REPO / "site" / f"{page['slug']}.md").read_text())
        result.update(page=page["slug"], question=page["question"], model=MODEL)
        print(json.dumps(result), flush=True)


if __name__ == "__main__":
    main()
