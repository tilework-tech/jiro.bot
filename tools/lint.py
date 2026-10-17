"""Pre-publish lint for generated pages. Prints PASS/FAIL per page; exits 1 if any page fails.

Checks: site/ matches a fresh build of content/, no TK placeholders in the built HTML or markdown, the entity sentence in the opening
answer, no unshipped Jiro claims (site.toml `deny`) in page copy, and a source plus a recent
checked date for every competitor fact a page shows.
"""
import argparse
import datetime
import pathlib
import re
import sys
import tomllib

REPO = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))
from build import FACT_REF, fact_refs, load, render_site

TK = re.compile(r"\bTK\b")


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
    for path in paths:
        page = tomllib.loads(path.read_text())
        problems = lint_page(path, page, site, facts, args.site)
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
