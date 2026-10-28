(() => {
  'use strict';
  const base = new URL('.', location.href);
  const endpoint = name => new URL(`__copy/${name}`, base);
  const blocks = [...document.querySelectorAll('[data-copy-id]')];
  // Use the browser's rendered whitespace before enabling plaintext editing.
  for (const el of blocks) el.textContent = el.innerText;
  const original = new Map(blocks.map(el => [el, el.innerHTML]));
  const baseline = new Map(blocks.map(el => [el, el.innerText]));
  let editing = true;
  let saving = false;
  let savedVersion;
  const dirty = new Set();
  const drafts = new Map();
  const details = new Map([...document.querySelectorAll('details')].map(el => [el, el.open]));
  const toolbar = document.createElement('aside');
  toolbar.id = 'copy-toolbar';
  toolbar.setAttribute('aria-label', 'Copy editor');
  toolbar.innerHTML = `<div id="copy-status" role="status" aria-live="polite">Loading editor…</div>
    <div class="copy-actions"><button type="button" id="copy-mode">Preview</button>
    <button type="button" id="copy-save" disabled>Save</button>
    <button type="button" id="copy-discard">Discard</button>
    <button type="button" id="copy-changes">Changes</button>
    <a id="copy-download" download="index.html">Download</a></div>`;
  document.body.append(toolbar);
  const status = toolbar.querySelector('#copy-status');
  const saveButton = toolbar.querySelector('#copy-save');
  toolbar.querySelector('#copy-download').href = endpoint('download');
  const dialog = document.createElement('dialog');
  dialog.id = 'copy-dialog';
  dialog.innerHTML = '<h2>Saved changes from Maddy’s original</h2><p>Save your draft first to include it here.</p><pre></pre><button type="button">Close</button>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick = () => dialog.close();

  function setMode() {
    document.body.classList.toggle('copy-editing', editing);
    for (const el of blocks) {
      el.setAttribute('contenteditable', editing && !saving ? 'plaintext-only' : 'false');
      el.spellcheck = true;
    }
    for (const [el, open] of details) el.open = editing || open;
    toolbar.querySelector('#copy-mode').textContent = editing ? 'Preview' : 'Edit copy';
  }
  setMode();
  toolbar.querySelector('#copy-mode').onclick = () => { if (!saving) { editing = !editing; setMode(); } };
  for (const el of blocks) {
    el.addEventListener('input', () => {
      drafts.set(el, el.innerText);
      if (el.innerText === baseline.get(el)) dirty.delete(el); else dirty.add(el);
      el.classList.toggle('copy-dirty', dirty.has(el));
      status.textContent = dirty.size ? `${dirty.size} unsaved text ${dirty.size === 1 ? 'change' : 'changes'}` : 'No unsaved changes';
    });
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        document.execCommand('insertText', false, '\n');
      }
    });
    el.addEventListener('paste', event => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
  }
  document.addEventListener('click', event => {
    if (editing && !toolbar.contains(event.target) && !dialog.contains(event.target)
        && event.target.closest('a, button, summary')) event.preventDefault();
  }, true);
  document.addEventListener('submit', event => { if (editing) event.preventDefault(); }, true);
  toolbar.querySelector('#copy-discard').onclick = () => {
    if (saving) return;
    for (const el of dirty) { el.innerHTML = original.get(el); el.classList.remove('copy-dirty'); }
    dirty.clear();
    drafts.clear();
    status.textContent = 'Draft discarded';
  };
  async function save() {
    if (saving || !savedVersion) return;
    if (!dirty.size) { status.textContent = 'No unsaved changes'; return; }
    saving = true;
    saveButton.disabled = true;
    status.textContent = 'Saving…';
    for (const el of blocks) el.setAttribute('contenteditable', 'false');
    try {
      const response = await fetch(endpoint('save'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Copy-Editor': '1' },
        body: JSON.stringify({ version: savedVersion,
          changes: Object.fromEntries([...dirty].map(el => [el.dataset.copyId, drafts.get(el)])) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Save failed. Your draft is still on this page.');
      sessionStorage.setItem('copy-notice', result.warning || 'Saved locally · click any text to edit');
      sessionStorage.setItem('copy-scroll', String(window.scrollY));
      dirty.clear();
      location.reload();
    } catch (error) {
      status.textContent = error.message;
      saving = false;
      saveButton.disabled = false;
      setMode();
    }
  }
  saveButton.onclick = save;
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', event => {
    if (dirty.size) { event.preventDefault(); event.returnValue = ''; }
  });
  toolbar.querySelector('#copy-changes').onclick = async () => {
    dialog.querySelector('pre').textContent = 'Loading…';
    dialog.showModal();
    try {
      const response = await fetch(endpoint('changes'));
      if (!response.ok) throw new Error('Could not load changes.');
      dialog.querySelector('pre').textContent = await response.text();
    } catch (error) { dialog.querySelector('pre').textContent = error.message; }
  };
  fetch(endpoint('state')).then(async response => {
    if (!response.ok) throw new Error('Could not load editor. Reload to retry.');
    const state = await response.json();
    // The version must describe the HTML we are editing, not a later server save.
    if (state.version !== document.querySelector('meta[name="copy-version"]').content)
      throw new Error('The page changed while loading. Reload before editing.');
    savedVersion = state.version;
    saveButton.disabled = false;
    status.textContent = sessionStorage.getItem('copy-notice') || 'Click any text to edit · saves stay in this session';
    sessionStorage.removeItem('copy-notice');
    const scroll = sessionStorage.getItem('copy-scroll');
    if (scroll !== null) { window.scrollTo(0, Number(scroll)); sessionStorage.removeItem('copy-scroll'); }
  }).catch(error => { status.textContent = error.message; });
})();
