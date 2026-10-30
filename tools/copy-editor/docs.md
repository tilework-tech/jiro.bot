# Noridoc: copy-editor

Path: @/tools/copy-editor

### Overview

- [server.py](server.py) is a stdlib-only preview server for the hand-written landing page in [site/](../../site/index.html). By default it returns the saved HTML unchanged.
- With `--edit` it annotates rendered text so [the copy editor](editor/docs.md) can edit copy in the browser and save it back into `site/index.html` as a local Git commit.
- It lives outside `site/` because everything in `site/` is synced publicly to jiro.bot; the server reaches the page through `--root`, which defaults to the repository's `site/`.

### How it fits into the larger codebase

- Serves only the landing page and what it loads: `/` and `/index.html`, the standalone pages in a `STATIC_PAGES` allowlist (`confirmed.html`, `link-expired.html`, `privacy.html`), the root favicon assets (`favicon.ico` and `jiro-16px.png`), and files under `css/`, `js/`, `fonts/`, `img/`, `video/` that resolve inside the root. Static asset content types come from Python's `mimetypes` module. Every other path returns 404, including the generated AEO pages and `assets/`; preview those with [tools/serve.py](../serve.py).
- [The Playwright pop-up tests](../../tests/browser/early-access.test.mjs) start this server from the repository root on a fixed port, then stub the early-access endpoint, so they depend on its default `--root`.
- [The page script](../../site/js/main.js) owns animated regions; the server excludes them from annotation, so animated copy is edited in that script, not through the editor.
- Preview needs only Python; `--edit` also needs Git and `site/index.html` in Git history. The Nori Session proxy supplies access control and forwards `/port/<port>/`; the server has no authentication and listens on `0.0.0.0`.

### Core Implementation

- `CopyParser` maps eligible body text in the saved HTML to source offsets. With `--edit`, `/` is returned annotated and with the editor's stylesheet and script injected, and `__copy/` routes expose state, saved diff, download and save. Without `--edit`, all `__copy/` routes return 404 and no editor assets are served.
- `POST /__copy/save` requires the `X-Copy-Editor: 1` header and a JSON body, then validates the change set and source revision under a lock, escapes text, replaces source ranges from the end backwards, writes the file atomically and runs `git commit --only -- index.html` in the root with a "Copy Editor" identity.
- Source revisions are hashes of the saved HTML; a save against a stale revision gets a conflict response. Browser-side behavior is in [editor/docs.md](editor/docs.md).

### Things to Know

- Because `--root` is `site/` inside this repository, editor Saves commit `site/index.html` on the current branch of this repo. Saving never publishes; shipping still goes through the deploy workflow from `main`.
- Changes diffs the saved page against the oldest Git version of `index.html` under the root. In this repository that is the earlier sprite landing page, not the first version of the current design.
- Opening `site/index.html` straight from disk mostly works, but some browsers block the local font files that way, which is why previews go through this server.
- Tests: [editor/test_server.py](editor/test_server.py) (unittest, temporary Git repositories, real server subprocess) and [editor/browser-test.mjs](editor/browser-test.mjs) (native CDP against the session Chrome, isolated temporary copy of `site/` on port 4101). Commands are in [the README](../../README.md).

Created and maintained by Nori.
