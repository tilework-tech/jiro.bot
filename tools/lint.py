"""Pre-publish lint for generated pages. Prints PASS/FAIL per page; exits 1 if any page fails.

Checks: site/ matches a fresh build of content/, no TK placeholders in the built HTML or markdown, the entity sentence in the opening
answer, no unshipped Jiro claims (site.toml `deny`) in page copy, a source plus a recent
checked date for every competitor fact a page shows, no 8-word phrase shared with another page's prose,
and enough variation in sentence length that a page does not read like a template.
"""
import argparse
import datetime
import pathlib
import re
import statistics
import sys
import tomllib

REPO = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))
from build import FACT_REF, expand_facts, fact_refs, load, render_site

TK = re.compile(r"\bTK\b")
SHINGLE = 8
MIN_SENTENCES = 15
MIN_LENGTH_VARIATION = 0.45


def prose(page, site, facts, headings=True):
    """The page's own running text: answer, section headings and bodies, FAQ. Tables, CTA, sources and footer are excluded."""
    parts = [page["answer"]]
    for s in page.get("section", []):
        parts += [s["heading"], s["body"]] if headings else [s["body"]]
    for f in page.get("faq", []):
        parts += [f["q"], f["a"]] if headings else [f["a"]]
    text = expand_facts("\n\n".join(parts), facts, page["slug"])
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    for boilerplate in (site["entity"], site["footer"]):
        text = text.replace(boilerplate, " ")
    return text


def words(text):
    return re.findall(r"[a-z0-9$']+", text.lower())


def shingles(text):
    ws = words(text)
    return {" ".join(ws[i:i + SHINGLE]) for i in range(len(ws) - SHINGLE + 1)}


def overlap_problems(slug, mine, others):
    problems = []
    for other, theirs in others.items():
        shared = sorted(mine & theirs)
        if other != slug and shared:
            problems.append(f"{len(shared)} {SHINGLE}-word phrases shared with {other}, e.g. {shared[0]!r}")
    return problems


def length_problems(text):
    sentences = [s for s in re.split(r"(?<=[.!?])\s+|\n+", text) if words(s)]
    if len(sentences) < MIN_SENTENCES:
        return []
    lengths = [len(words(s)) for s in sentences]
    variation = statistics.pstdev(lengths) / statistics.mean(lengths)
    if variation < MIN_LENGTH_VARIATION:
        return [f"sentence lengths too uniform (variation {variation:.2f} < {MIN_LENGTH_VARIATION})"]
    return []


def fact_problems(key, facts, updated, max_age):
    rival, fid = key.split(".")
    fact = facts[rival]["facts"][fid]
    problems = []
    if not str(fact.get("source", "")).startswith("https://"):
        problems.append(f"fact {key} has no https source")
    checked = fact.get("checked")
    if not checked:
        problems.append(f"fact {key} has no checked date")
    else:
        age = (updated - datetime.date.fromisoformat(str(checked))).days
        if not 0 <= age <= max_age:
            problems.append(f"fact {key} checked {checked} is outside {max_age} days before {updated}")
    return problems


def lint_page(path, page, site, facts, out):
    html_file, md_file = out / f"{page['slug']}.html", out / f"{page['slug']}.md"
    if not (html_file.is_file() and md_file.is_file()):
        return ["page is not built"]
    html, md = html_file.read_text(), md_file.read_text()
    problems = []
    if TK.search(html) or TK.search(md):
        problems.append("TK placeholder")
    if site["entity"] not in md.split("\n## ")[0]:
        problems.append(f"missing entity sentence in the answer: {site['entity']!r}")
    copy = FACT_REF.sub("", path.read_text()).lower()
    problems += [f"unshipped claim: {phrase!r}" for phrase in site.get("deny", []) if phrase.lower() in copy]
    updated = datetime.date.fromisoformat(str(site["updated"]))
    for key in dict.fromkeys(fact_refs(path.read_text())):
        problems += fact_problems(key, facts, updated, site["max_fact_age_days"])
    problems += length_problems(prose(page, site, facts, headings=False))
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--content", type=pathlib.Path, default=REPO / "content")
    ap.add_argument("--site", type=pathlib.Path, default=REPO / "site")
    args = ap.parse_args()
    site, facts, _ = load(args.content)
    paths = sorted((args.content / "pages").glob("*.toml"))
    if not paths:
        print("FAIL no pages found")
        sys.exit(1)
    failed = False
    records = {path: tomllib.loads(path.read_text()) for path in paths}
    phrases = {page["slug"]: shingles(prose(page, site, facts)) for page in records.values()}
    for path, page in records.items():
        problems = lint_page(path, page, site, facts, args.site)
        problems += overlap_problems(page["slug"], phrases[page["slug"]], phrases)
        if problems:
            failed = True
            print(f"FAIL {page['slug']}: " + "; ".join(problems))
        else:
            print(f"PASS {page['slug']}")
    _, files = render_site(args.content)
    stale = [rel for rel, text in files.items()
             if not (args.site / rel).is_file() or (args.site / rel).read_text() != text]
    if stale:
        failed = True
        print(f"FAIL site/ is stale ({len(stale)} files differ from content/): run python3 build.py")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
