"""Generate jiro.bot comparison pages.

One TOML record per page (content/pages/) plus one fact file per rival (content/facts/)
becomes site/{slug}.html and a site/{slug}.md twin, plus llms.txt, llms-full.txt,
sitemap.xml and robots.txt. The family directories (site/alternatives, site/compare, site/best)
belong to the generator and are rebuilt from scratch; other hand-written files in site/ are left alone.
"""
import argparse
import html
import json
import pathlib
import re
import shutil
import sys
import tomllib

FAMILIES = {"alternatives": "Alternatives", "compare": "Head-to-head comparisons", "switch": "Switching guides", "best": "Lists"}
# [[fact:rival.id]] inserts the fact's claim with a citation; [[cite:rival.id]] adds only the citation to page-written prose.
FACT_REF = re.compile(r"\[\[(fact|cite):([a-z0-9-]+)\.([a-z0-9-]+)\]\]")
ORDERED = re.compile(r"^\d+\. ")

FONT_FACES = "\n".join(
    f'@font-face{{font-family:"{family}";src:url("../fonts/{filename}-{weight}.woff2") format("woff2");'
    f'font-weight:{weight};font-style:normal;font-display:swap}}'
    for family, filename in [("General Sans", "GeneralSans"), ("JetBrains Mono", "JetBrainsMono")]
    for weight in [400, 500, 600, 700]
)

CSS = FONT_FACES + "\n" + """:root{--bg:#0b0d0c;--panel:#121614;--line:#2a312d;--text:#e8ece9;--muted:#9aa49e;--green:#3cf06e;--salmon:#f2694f}
*{box-sizing:border-box}body{background:var(--bg);color:var(--text);font:17px/1.65 "General Sans","Helvetica Neue",Helvetica,Arial,sans-serif;margin:0}
main{max-width:780px;margin:0 auto;padding:32px 22px 80px}a{color:var(--green)}
nav{font:14px "General Sans","Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--muted)}nav a{color:var(--text);text-decoration:none}
.family{font:12px "General Sans","Helvetica Neue",Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:var(--salmon);margin-top:28px}
h1{font-size:34px;line-height:1.2;margin:.2em 0 .3em}h2{font-size:22px;margin-top:2.2em}h3{font-size:18px;margin-top:1.6em}
.meta{color:var(--muted);font-size:14px}
.answer{border-left:3px solid var(--green);background:var(--panel);padding:6px 18px;margin:24px 0}
.answer .q{font-weight:700;margin-bottom:0}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:15px}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{color:var(--green)}
td:first-child{color:var(--muted)}sup a{text-decoration:none;font-size:12px}
code,kbd,pre{font-family:"JetBrains Mono",monospace}
code{background:#1a201c;padding:1px 5px;border-radius:3px;font-size:.92em}
.cta{margin-top:40px;padding:18px;border:1px solid var(--line);background:var(--panel)}
.cta a.button{display:inline-block;background:var(--green);color:var(--bg);padding:9px 16px;font-weight:700;text-decoration:none}
footer{margin-top:48px;border-top:1px solid var(--line);padding-top:14px}
.sources{font-size:14px;color:var(--muted)}.sources li{margin:.3em 0;overflow-wrap:anywhere}
"""


def load(content):
    site = tomllib.loads((content / "site.toml").read_text())
    facts = {}
    for path in sorted((content / "facts").glob("*.toml")):
        data = tomllib.loads(path.read_text())
        facts[path.stem] = {"name": data["name"], "facts": {f["id"]: f for f in data.get("fact", [])}}
    pages = [tomllib.loads(p.read_text()) for p in sorted((content / "pages").glob("*.toml"))]
    for page in pages:
        if page["family"] not in FAMILIES:
            sys.exit(f"{page['slug']}: unknown family {page['family']!r}")
    pages.sort(key=lambda p: p["slug"])
    return site, facts, pages


def fact_refs(text):
    return [f"{rival}.{fid}" for _, rival, fid in FACT_REF.findall(text)]


def lookup(facts, key, slug):
    rival, fid = key.split(".")
    try:
        return facts[rival]["facts"][fid]
    except KeyError:
        sys.exit(f"{slug}: unknown fact {key}")


class Renderer:
    """Renders one page's copy to HTML or markdown, numbering fact citations in first-use order."""

    def __init__(self, fmt, facts, slug):
        self.fmt, self.facts, self.slug = fmt, facts, slug
        self.cited = []

    def cite(self, key):
        if key not in self.cited:
            self.cited.append(key)
        return self.cited.index(key) + 1

    def inline(self, text, form="text"):
        out, pos = [], 0
        for m in FACT_REF.finditer(text):
            out.append(self.plain(text[pos:m.start()]))
            kind, key = m.group(1), f"{m.group(2)}.{m.group(3)}"
            fact = lookup(self.facts, key, self.slug)
            n = self.cite(key)
            if kind == "cite":
                out.append(f"[{n}]" if self.fmt == "md" else f'<sup><a href="#src-{n}">[{n}]</a></sup>')
            elif self.fmt == "md":
                out.append(f"{fact[form]} [{n}]")
            else:
                out.append(f'{self.plain(fact[form])} <sup><a href="#src-{n}">[{n}]</a></sup>')
            pos = m.end()
        out.append(self.plain(text[pos:]))
        return "".join(out)

    def plain(self, text):
        if self.fmt == "md":
            return text
        text = html.escape(text)
        text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
        text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
        return re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', text)

    def blocks(self, body):
        """Paragraphs separated by blank lines; a block whose lines all start with '- ' is a list, two or more '1. '-style lines an ordered list."""
        out = []
        for block in re.split(r"\n\s*\n", body.strip()):
            lines = block.strip().splitlines()
            if all(line.startswith("- ") for line in lines):
                items = [self.inline(line[2:]) for line in lines]
                out.append("\n".join(f"- {i}" for i in items) if self.fmt == "md"
                           else "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>")
            elif len(lines) > 1 and all(ORDERED.match(line) for line in lines):
                items = [self.inline(ORDERED.sub("", line)) for line in lines]
                out.append("\n".join(f"{n}. {i}" for n, i in enumerate(items, 1)) if self.fmt == "md"
                           else "<ol>" + "".join(f"<li>{i}</li>" for i in items) + "</ol>")
            else:
                text = self.inline(" ".join(line.strip() for line in lines))
                out.append(text if self.fmt == "md" else f"<p>{text}</p>")
        return "\n\n".join(out) if self.fmt == "md" else "\n".join(out)


def expand_facts(text, facts, slug):
    """Page copy as a reader sees it: [[fact:]] becomes the claim, [[cite:]] disappears."""
    return FACT_REF.sub(lambda m: "" if m.group(1) == "cite" else lookup(facts, f"{m.group(2)}.{m.group(3)}", slug)["text"], text)


def strip_markup(text, facts, slug):
    text = expand_facts(text, facts, slug)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return re.sub(r"[`*]", "", " ".join(text.split()))


def render_md(page, site, facts):
    r = Renderer("md", facts, page["slug"])
    out = [f"# {page['title']}", "", f"Updated {site['updated']}", "",
           f"> **{page['question']}**", ">", f"> {r.inline(page['answer'])}", ""]
    table = page.get("table")
    if table:
        out += [f"## {table.get('heading', 'Side by side')}", ""]
        out.append("| " + " | ".join(table["columns"]) + " |")
        out.append("|" + "---|" * len(table["columns"]))
        for row in table["rows"]:
            out.append("| " + " | ".join(r.inline(c, "short") for c in row) + " |")
        if table.get("note"):
            out += ["", r.inline(table["note"])]
        out.append("")
    for s in page.get("section", []):
        out += [f"{'#' * s.get('level', 2)} {s['heading']}", "", r.blocks(s["body"]), ""]
    if page.get("faq"):
        out += ["## FAQ", ""]
        for f in page["faq"]:
            out += [f"### {f['q']}", "", r.inline(f["a"]), ""]
    out += ["## Try Jiro", "", f"Start the 30-day free trial, no card needed: {site['trial_url']}", "",
            f"Or install Jiro's engineering skills into your own agent: `{site['install']}`", ""]
    if r.cited:
        out += ["## Sources", ""]
        for n, key in enumerate(r.cited, 1):
            f = lookup(facts, key, page["slug"])
            out.append(f"{n}. {f['text']} Source: {f.get('source', '')} (checked {f.get('checked', '')})")
        out.append("")
    out += ["---", "", site["footer"], ""]
    return "\n".join(out)


def jsonld(obj):
    data = json.dumps(obj, ensure_ascii=False).replace("<", "\\u003c")
    return f'<script type="application/ld+json">{data}</script>'


def render_html(page, site, facts):
    slug, base, e = page["slug"], site["base_url"], html.escape
    r = Renderer("html", facts, slug)
    url = f"{base}/{slug}"
    body = ['<nav><a href="/">jiro.bot</a> / <a href="/llms.txt">all pages</a></nav>',
            f'<p class="family">{e(FAMILIES[page["family"]])}</p>',
            f"<h1>{e(page['title'])}</h1>",
            f'<p class="meta">Updated {site["updated"]} · <a href="/{slug}.md">Markdown version</a></p>',
            f'<div class="answer"><p class="q">{e(page["question"])}</p><p>{r.inline(page["answer"])}</p></div>']
    table = page.get("table")
    if table:
        head = "".join(f"<th>{e(c)}</th>" for c in table["columns"])
        rows = "".join("<tr>" + "".join(f"<td>{r.inline(c, 'short')}</td>" for c in row) + "</tr>" for row in table["rows"])
        body.append(f"<h2>{e(table.get('heading', 'Side by side'))}</h2>")
        body.append(f'<div class="table-wrap"><table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>')
        if table.get("note"):
            body.append(f'<p class="meta">{r.inline(table["note"])}</p>')
    for s in page.get("section", []):
        level = s.get("level", 2)
        body.append(f"<h{level}>{e(s['heading'])}</h{level}>")
        body.append(r.blocks(s["body"]))
    if page.get("faq"):
        body.append("<h2>FAQ</h2>")
        for f in page["faq"]:
            body.append(f"<h3>{e(f['q'])}</h3><p>{r.inline(f['a'])}</p>")
    body.append(f'<div class="cta"><h2>Try Jiro</h2><p><a class="button" href="{e(site["trial_url"])}">Start the 30-day free trial</a></p>'
                f"<p>No card needed. Or install Jiro's engineering skills into your own agent: <code>{e(site['install'])}</code></p></div>")
    if r.cited:
        items = []
        for n, key in enumerate(r.cited, 1):
            f = lookup(facts, key, slug)
            src = f.get("source", "")
            items.append(f'<li id="src-{n}">{r.plain(f["text"])} <a href="{e(src)}">{e(src)}</a> (checked {e(str(f.get("checked", "")))})</li>')
        body.append(f'<h2>Sources</h2><ol class="sources">{"".join(items)}</ol>')
    body.append(f'<footer class="meta">{e(site["footer"])}</footer>')

    faq = [{"@type": "Question", "name": f["q"],
            "acceptedAnswer": {"@type": "Answer", "text": strip_markup(f["a"], facts, slug)}} for f in page.get("faq", [])]
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": page["title"], "description": page["description"],
           "dateModified": site["updated"], "datePublished": page.get("published", site["updated"]), "mainEntityOfPage": url,
           "author": {"@type": "Organization", "name": "Nori", "url": "https://noriagentic.com"},
           "publisher": {"@type": "Organization", "name": "Nori", "url": "https://noriagentic.com"}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Jiro", "item": f"{base}/"},
              {"@type": "ListItem", "position": 2, "name": page["title"], "item": url}]}]
    if faq:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq})

    title, desc = e(page["title"]), e(page["description"])
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | Jiro</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<link rel="alternate" type="text/markdown" href="{url}.md">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/jiro-16px.png">
<link rel="stylesheet" href="/assets/pages.css">
{chr(10).join(jsonld(x) for x in ld)}
</head>
<body>
<main>
{chr(10).join(body)}
</main>
</body>
</html>
"""


def render_llms(site, pages):
    out = [f"# {site['name']}", "", f"> {site['summary']}", ""]
    for family, label in FAMILIES.items():
        members = [p for p in pages if p["family"] == family]
        if members:
            out += [f"## {label}", ""]
            out += [f"- [{p['title']}]({site['base_url']}/{p['slug']}.md): {p['description']}" for p in members]
            out.append("")
    out += ["## Get started", "", f"- [Start the 30-day free trial]({site['trial_url']})",
            f"- Install Jiro's skills into your own agent: `{site['install']}`", ""]
    return "\n".join(out)


def render_sitemap(site, pages):
    urls = [f"{site['base_url']}/"] + [f"{site['base_url']}/{p['slug']}" for p in pages]
    body = "".join(f"  <url><loc>{html.escape(u)}</loc><lastmod>{site['updated']}</lastmod></url>\n" for u in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n'


def render_site(content):
    """Render every generated file in memory, keyed by path relative to site/."""
    site, facts, pages = load(content)
    files = {}
    mds = []
    for page in pages:
        md = render_md(page, site, facts)
        files[f"{page['slug']}.md"] = md
        files[f"{page['slug']}.html"] = render_html(page, site, facts)
        mds.append(md)
    files["assets/pages.css"] = CSS
    files["llms.txt"] = render_llms(site, pages)
    full = [f"# {site['name']}: full text", "", f"> {site['summary']}", ""]
    files["llms-full.txt"] = "\n".join(full) + "\n" + "\n---\n\n".join(mds)
    files["sitemap.xml"] = render_sitemap(site, pages)
    files["robots.txt"] = f"User-agent: *\nAllow: /\n\nSitemap: {site['base_url']}/sitemap.xml\n"
    return pages, files


def build(content, out):
    pages, files = render_site(content)
    for family in FAMILIES:
        shutil.rmtree(out / family, ignore_errors=True)
    for rel, text in files.items():
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        (out / rel).write_text(text)
    return pages


def main():
    repo = pathlib.Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--content", type=pathlib.Path, default=repo / "content")
    ap.add_argument("--out", type=pathlib.Path, default=repo / "site")
    args = ap.parse_args()
    pages = build(args.content, args.out)
    print(f"built {len(pages)} pages into {args.out}")


if __name__ == "__main__":
    main()
