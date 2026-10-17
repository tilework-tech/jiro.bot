"""Report 8-word shingle overlap between a generated page and a reference HTML page (e.g. a noriagentic.com seed)."""
import html
import pathlib
import re
import sys

N = 8


def words(text):
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.DOTALL)
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    return re.findall(r"[a-z0-9$']+", text.lower())


def shingles(ws):
    return {" ".join(ws[i:i + N]) for i in range(len(ws) - N + 1)}


def main():
    page, ref = sys.argv[1], sys.argv[2]
    a = shingles(words(pathlib.Path(page).read_text()))
    b = shingles(words(pathlib.Path(ref).read_text()))
    shared = a & b
    print(f"{page}: {len(shared)}/{len(a)} shared {N}-word shingles ({100 * len(shared) / max(len(a), 1):.1f}%)")
    for s in sorted(shared)[:10]:
        print(f"  {s}")


if __name__ == "__main__":
    main()
