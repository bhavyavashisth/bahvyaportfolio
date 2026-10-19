const STORAGE_KEY = 'kage.blog.drafts.v1';
const fields = {
  title: document.querySelector('#post-title'),
  slug: document.querySelector('#post-slug'),
  tags: document.querySelector('#post-tags'),
  excerpt: document.querySelector('#post-excerpt'),
  body: document.querySelector('#post-body')
};
const select = document.querySelector('#draft-select');
const status = document.querySelector('#save-status');
const preview = {
  meta: document.querySelector('#preview-meta'),
  title: document.querySelector('#preview-title'),
  excerpt: document.querySelector('#preview-excerpt'),
  body: document.querySelector('#preview-body'),
  tags: document.querySelector('#preview-tags'),
  count: document.querySelector('#word-count')
};
let state = readState();
let saveTimer;
let slugIsAutomatic = true;

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankDraft() {
  return { id: makeId(), title: '', slug: '', excerpt: '', tags: '', body: '', updatedAt: new Date().toISOString(), slugIsAutomatic: true };
}

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const drafts = Array.isArray(parsed.drafts) ? parsed.drafts.filter(draft => draft && typeof draft.id === 'string') : [];
    const activeId = drafts.some(draft => draft.id === parsed.activeId) ? parsed.activeId : drafts[0]?.id;
    if (drafts.length) return { drafts, activeId };
  } catch (error) {
    // Storage may be unavailable or contain an older, incomplete value.
  }
  const draft = blankDraft();
  return { drafts: [draft], activeId: draft.id };
}

function activeDraft() {
  return state.drafts.find(draft => draft.id === state.activeId) || state.drafts[0];
}

function saveState() {
  const draft = activeDraft();
  draft.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    status.classList.remove('is-error');
    status.lastChild.textContent = ' SAVED IN THIS BROWSER';
  } catch (error) {
    status.classList.add('is-error');
    status.lastChild.textContent = ' STORAGE UNAVAILABLE · EXPORT A COPY';
  }
  renderDraftOptions();
}

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);
}

function renderDraftOptions() {
  const selectedId = state.activeId;
  select.replaceChildren();
  state.drafts.forEach(draft => {
    const option = document.createElement('option');
    option.value = draft.id;
    option.textContent = draft.title.trim() || 'Untitled draft';
    option.selected = draft.id === selectedId;
    select.append(option);
  });
}

function populateForm(draft) {
  if (!draft) return;
  fields.title.value = draft.title || '';
  fields.slug.value = draft.slug || '';
  fields.tags.value = draft.tags || '';
  fields.excerpt.value = draft.excerpt || '';
  fields.body.value = draft.body || '';
  slugIsAutomatic = draft.slugIsAutomatic !== false;
  updatePreview();
}

function appendInline(container, source) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  let lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    container.append(document.createTextNode(source.slice(lastIndex, match.index)));
    if (match[1]) {
      try {
        const url = new URL(match[2]);
        if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:') {
          const link = document.createElement('a');
          link.href = url.href;
          link.textContent = match[1];
          if (url.protocol !== 'mailto:') { link.target = '_blank'; link.rel = 'noreferrer'; }
          container.append(link);
        } else container.append(document.createTextNode(match[0]));
      } catch (error) { container.append(document.createTextNode(match[0])); }
    } else {
      const tag = match[3] ? 'strong' : match[4] ? 'em' : 'code';
      const node = document.createElement(tag);
      node.textContent = match[3] || match[4] || match[5];
      container.append(node);
    }
    lastIndex = match.index + match[0].length;
  }
  container.append(document.createTextNode(source.slice(lastIndex)));
}

function renderMarkdown(source, target) {
  target.replaceChildren();
  const lines = source.replace(/\r/g, '').split('\n');
  let paragraph = [];
  let quote = [];
  let list = null;
  let code = null;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const node = document.createElement('p');
    appendInline(node, paragraph.join(' '));
    target.append(node);
    paragraph = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const node = document.createElement('blockquote');
    quote.forEach(line => { const p = document.createElement('p'); appendInline(p, line); node.append(p); });
    target.append(node);
    quote = [];
  };
  const closeList = () => { list = null; };
  const flushTextBlocks = () => { flushParagraph(); flushQuote(); closeList(); };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (code) {
        const pre = document.createElement('pre');
        const inlineCode = document.createElement('code');
        inlineCode.textContent = code.join('\n');
        pre.append(inlineCode);
        target.append(pre);
        code = null;
      } else { flushTextBlocks(); code = []; }
      continue;
    }
    if (code) { code.push(line); continue; }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^\s*>\s?(.*)$/);
    if (heading) {
      flushTextBlocks();
      const node = document.createElement(`h${heading[1].length}`);
      appendInline(node, heading[2]);
      target.append(node);
    } else if (bullet || numbered) {
      flushParagraph(); flushQuote();
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.tagName.toLowerCase() !== type) { closeList(); list = document.createElement(type); target.append(list); }
      const item = document.createElement('li');
      appendInline(item, (bullet || numbered)[1]);
      list.append(item);
    } else if (quoted) {
      flushParagraph(); closeList(); quote.push(quoted[1]);
    } else if (!line.trim()) {
      flushTextBlocks();
    } else {
      flushQuote(); closeList(); paragraph.push(line.trim());
    }
  }
  if (code) {
    const pre = document.createElement('pre');
    const inlineCode = document.createElement('code');
    inlineCode.textContent = code.join('\n');
    pre.append(inlineCode);
    target.append(pre);
  }
  flushTextBlocks();
}

function updatePreview() {
  const title = fields.title.value.trim() || 'A thought worth keeping';
  const excerpt = fields.excerpt.value.trim() || 'Your opening line will find its place here.';
  preview.title.textContent = title;
  preview.excerpt.textContent = excerpt;
  const tags = fields.tags.value.split(',').map(tag => tag.trim()).filter(Boolean);
  preview.meta.replaceChildren(document.createTextNode('JOURNAL '));
  const separator = document.createElement('span'); separator.textContent = '／';
  preview.meta.append(separator, document.createTextNode(` ${tags[0] || 'KAGE NOTES'}`));
  if (fields.body.value.trim()) renderMarkdown(fields.body.value, preview.body);
  else { preview.body.replaceChildren(); const p = document.createElement('p'); p.textContent = 'Your story will unfold here as you write.'; preview.body.append(p); }
  preview.tags.replaceChildren(...tags.map(tag => { const chip = document.createElement('span'); chip.textContent = tag; return chip; }));
  const wordCount = fields.body.value.trim().match(/\S+/g)?.length || 0;
  preview.count.textContent = `${wordCount} ${wordCount === 1 ? 'WORD' : 'WORDS'}`;
}

function collectForm() {
  const draft = activeDraft();
  Object.entries(fields).forEach(([key, input]) => { draft[key] = input.value; });
  draft.slugIsAutomatic = slugIsAutomatic;
}

function queueSave() {
  collectForm();
  updatePreview();
  status.classList.remove('is-error');
  status.lastChild.textContent = ' SAVING…';
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveState, 240);
}

function exportMarkdown() {
  collectForm();
  const draft = activeDraft();
  const tags = draft.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  const frontMatter = [
    '---',
    `title: ${JSON.stringify(draft.title || 'Untitled draft')}`,
    `slug: ${JSON.stringify(draft.slug || slugify(draft.title) || 'untitled')}`,
    `excerpt: ${JSON.stringify(draft.excerpt)}`,
    `tags: ${JSON.stringify(tags)}`,
    `updated: ${JSON.stringify(new Date().toISOString())}`,
    '---'
  ].join('\n');
  const content = `${frontMatter}\n\n${draft.body}\n`;
  const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const download = document.createElement('a');
  download.href = blobUrl;
  download.download = `${slugify(draft.slug || draft.title) || 'kage-draft'}.md`;
  document.body.append(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  status.classList.remove('is-error');
  status.lastChild.textContent = ' MARKDOWN EXPORTED';
}

function createDraft() {
  const draft = blankDraft();
  state.drafts.unshift(draft);
  state.activeId = draft.id;
  renderDraftOptions();
  populateForm(draft);
  saveState();
  fields.title.focus();
}

select.addEventListener('change', () => {
  collectForm();
  state.activeId = select.value;
  const draft = activeDraft();
  slugIsAutomatic = draft.slugIsAutomatic !== false;
  populateForm(draft);
  saveState();
});

Object.entries(fields).forEach(([key, input]) => {
  input.addEventListener('input', () => {
    if (key === 'slug') {
      slugIsAutomatic = false;
    } else if (key === 'title' && slugIsAutomatic) {
      fields.slug.value = slugify(fields.title.value);
    }
    queueSave();
  });
});

document.querySelector('#new-draft').addEventListener('click', createDraft);
document.querySelector('#delete-draft').addEventListener('click', () => {
  if (state.drafts.length === 1) {
    window.alert('Keep one draft in the room. You can clear its fields or start a new story.');
    return;
  }
  const draft = activeDraft();
  if (!window.confirm(`Delete “${draft.title.trim() || 'Untitled draft'}” from this browser?`)) return;
  state.drafts = state.drafts.filter(item => item.id !== draft.id);
  state.activeId = state.drafts[0].id;
  renderDraftOptions();
  populateForm(activeDraft());
  saveState();
});
document.querySelector('#export-draft').addEventListener('click', exportMarkdown);

renderDraftOptions();
populateForm(activeDraft());
