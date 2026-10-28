# Noridoc: Copy Editor

Path: @/tools/copy-editor/editor

### Overview

- Adds direct text editing and a compact toolbar when [the Python server](../server.py) runs with `--edit`. The default preview is plain HTML.
- Keeps browser drafts separate from [saved HTML](../../../site/index.html), with explicit Save, Discard, Changes, and Download actions.

### How it fits into the larger codebase

- [The browser script](editor.js) edits only source ranges annotated by [the server](../server.py). The server owns eligibility, revision validation, and writes; the browser submits text rather than a replacement document.
- Editor assets and API requests resolve relative to the current page, allowing the same code to run at the site root or behind the session's `/port/<port>/` route.
- [The existing page script](../../../site/js/main.js) continues to own animated regions. Those regions are excluded from annotation, while editor mode opens FAQ details and suppresses navigation and form submission.

### Core Implementation

- [The script](editor.js) normalizes response spans to their rendered text before enabling editing, preserving visible spacing without turning source indentation into line breaks or changing the saved source. It snapshots initial markup and text; input events capture drafts, preserving line breaks through Preview. Discard restores initial markup and clears drafts without writing to the server.
- In `--edit` mode, editing starts enabled. Preview toggles content editing and restores the page's original details state; pasted content is inserted as plain text and Enter inserts a newline.
- Initial state loading checks that the browser's document and server's saved source share a revision. Save sends that revision and changed text, disables further editing during the request, and reloads after success to rebuild source identifiers.
- Session storage carries the saved notice and scroll position across that reload. Unsaved drafts remain in the current page, and navigating away prompts when changes exist.
- Changes displays the server's saved diff in a dialog. Download links directly to the server's saved HTML attachment, without serializing the live browser DOM.

### Things to Know

- A conflicting save or failed request leaves the draft visible and reports the server error in the toolbar. Copy the draft before reloading to resolve a revision conflict.
- Save uses a JSON request with an editor header. [The server](../server.py) validates identifiers, text types, and payload size before modifying any source; unknown identifiers reject the whole request.
- [HTTP contract tests](test_server.py) use temporary Git repositories and a real server subprocess to verify persistence, source preservation, conflict handling, and routed access. [Browser checks](browser-test.mjs) use native CDP with the existing session Chrome and an isolated temporary copy of `site/` on port 4101 to exercise actual input, controls, desktop/mobile layouts, and newline preservation through Preview and Save. They close their own tabs and server without stopping shared Chrome; [the repository README](../../../README.md) provides both commands.
- The editor is a local preview tool behind the session login. Saves are local commits of `site/index.html` in this repository (see [the server docs](../docs.md)); they last only as long as the session unless pushed, and the Download action exports only the saved HTML.

Created and maintained by Nori.
