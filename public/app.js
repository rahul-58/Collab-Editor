const AUTOSAVE_DELAY_MS = 900;
const MAX_ATTACHMENT_BYTES = 1_000_000;


const state = {
  users: [],
  currentUserId: localStorage.getItem('ajaia-current-user') || '',
  documents: { owned: [], shared: [] },
  activeDocument: null,
  autosaveTimer: null,
  hasUnsavedChanges: false,
  saveInFlight: false,
  pendingAutosave: false,
  lastSavedSignature: ''
};

const elements = {
  userSelect: document.getElementById('userSelect'),
  userList: document.getElementById('userList'),
  message: document.getElementById('message'),
  editorMessage: document.getElementById('editorMessage'),
  ownedDocuments: document.getElementById('ownedDocuments'),
  sharedDocuments: document.getElementById('sharedDocuments'),
  ownedCount: document.getElementById('ownedCount'),
  sharedCount: document.getElementById('sharedCount'),
  dashboardView: document.getElementById('dashboardView'),
  editorView: document.getElementById('editorView'),
  newDocumentButton: document.getElementById('newDocumentButton'),
  refreshButton: document.getElementById('refreshButton'),
  backButton: document.getElementById('backButton'),
  saveButton: document.getElementById('saveButton'),
  autosaveStatus: document.getElementById('autosaveStatus'),
  documentTitle: document.getElementById('documentTitle'),
  editor: document.getElementById('editor'),
  ownerBadge: document.getElementById('ownerBadge'),
  accessBadge: document.getElementById('accessBadge'),
  updatedBadge: document.getElementById('updatedBadge'),
  sharePanel: document.getElementById('sharePanel'),
  shareEmail: document.getElementById('shareEmail'),
  shareButton: document.getElementById('shareButton'),
  shareList: document.getElementById('shareList'),
  fileInput: document.getElementById('fileInput'),
  draftImportInput: document.getElementById('draftImportInput'),
  attachmentInput: document.getElementById('attachmentInput'),
  attachmentList: document.getElementById('attachmentList'),
  themeToggle: document.getElementById('theme-toggle'),
};

const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
mediaQuery?.addEventListener?.('change', () => {
  const savedTheme = localStorage.getItem('theme');
  if (!savedTheme) {
    applyTheme(mediaQuery.matches ? 'dark' : 'light');
  }
});

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

function showMessage(target, text, type = 'success') {
  target.textContent = text;
  target.className = `message ${type}`;
}

function clearMessage(target) {
  target.textContent = '';
  target.className = 'message hidden';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);

  if (elements.themeToggle) {
    elements.themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const preferredDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const theme = savedTheme || (preferredDark ? 'dark' : 'light');
  applyTheme(theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  const nextTheme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
}

function setAutosaveStatus(text, variant = 'neutral') {
  if (!elements.autosaveStatus) return;
  elements.autosaveStatus.textContent = text;
  elements.autosaveStatus.className = `badge autosave-badge ${variant}`;
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function setCurrentUser(userId) {
  state.currentUserId = userId;
  localStorage.setItem('ajaia-current-user', userId);
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatBytes(sizeBytes) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function switchView(viewName) {
  elements.dashboardView.classList.toggle('active', viewName === 'dashboard');
  elements.editorView.classList.toggle('active', viewName === 'editor');
}

function renderUsers() {
  elements.userSelect.innerHTML = state.users
    .map((user) => `<option value="${user.id}">${user.name} (${user.email})</option>`)
    .join('');
  if (!state.currentUserId && state.users[0]) {
    setCurrentUser(state.users[0].id);
  }
  elements.userSelect.value = state.currentUserId;
  elements.userList.innerHTML = state.users.map((user) => `<li>${user.name} · ${user.email}</li>`).join('');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDocumentCards(items, target, emptyText) {
  if (!items.length) {
    target.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  target.innerHTML = items
    .map((doc) => {
      const sharedWith = doc.sharedUsers.length
        ? `Shared with ${doc.sharedUsers.map((user) => user.name).join(', ')}`
        : 'Not shared yet';
      const attachments = doc.attachmentCount ? `${doc.attachmentCount} attachment${doc.attachmentCount === 1 ? '' : 's'}` : 'No attachments';
      return `
        <article class="doc-card">
          <h4>${escapeHtml(doc.title)}</h4>
          <p>Owner: ${escapeHtml(doc.owner.name)} · Updated ${escapeHtml(formatDate(doc.updatedAt))}</p>
          <div class="doc-meta">
            <span class="badge">${doc.owner.id === state.currentUserId ? 'Owned' : 'Shared'}</span>
            <span class="badge secondary-badge">${escapeHtml(sharedWith)}</span>
            <span class="badge secondary-badge">${escapeHtml(attachments)}</span>
          </div>
          <button class="secondary" data-open-document="${doc.id}">Open document</button>
        </article>
      `;
    })
    .join('');
}

function renderDashboard() {
  renderDocumentCards(state.documents.owned, elements.ownedDocuments, 'Create or import a document to get started.');
  renderDocumentCards(state.documents.shared, elements.sharedDocuments, 'Nothing has been shared with you yet.');
  elements.ownedCount.textContent = String(state.documents.owned.length);
  elements.sharedCount.textContent = String(state.documents.shared.length);
}

function updateActiveDocumentBadges() {
  const doc = state.activeDocument;
  if (!doc) return;
  elements.ownerBadge.textContent = `Owner: ${doc.owner.name}`;
  elements.accessBadge.textContent = doc.canManageSharing ? 'You can manage sharing' : 'Shared editor';
  elements.updatedBadge.textContent = `Updated ${formatDate(doc.updatedAt)}`;
}

function renderAttachments(doc) {
  if (!doc.attachments || !doc.attachments.length) {
    elements.attachmentList.innerHTML = '<div class="empty-state compact">No attachments yet. Upload one to associate it with this document.</div>';
    return;
  }

  elements.attachmentList.innerHTML = doc.attachments
    .map((attachment) => {
      const uploader = state.users.find((user) => user.id === attachment.uploadedBy);
      const url = `/api/documents/${doc.id}/attachments/${attachment.id}?userId=${encodeURIComponent(state.currentUserId)}`;
      return `
        <div class="attachment-item">
          <div>
            <p class="attachment-name">${escapeHtml(attachment.filename)}</p>
            <p class="attachment-meta">${escapeHtml(formatBytes(attachment.sizeBytes))} · Uploaded ${escapeHtml(formatDate(attachment.createdAt))}${uploader ? ` · ${escapeHtml(uploader.name)}` : ''}</p>
          </div>
          <a class="secondary attachment-link" href="${url}" target="_blank" rel="noopener">Download</a>
        </div>
      `;
    })
    .join('');
}

function renderActiveDocument() {
  const doc = state.activeDocument;
  if (!doc) return;

  elements.documentTitle.value = doc.title;
  elements.editor.innerHTML = doc.contentHtml || '<p></p>';
  updateActiveDocumentBadges();
  elements.sharePanel.style.display = doc.canManageSharing ? 'block' : 'none';
  elements.shareList.innerHTML = [doc.owner, ...doc.sharedUsers]
    .map((user) => `<span class="share-chip">${escapeHtml(user.name)} · ${escapeHtml(user.email)}</span>`)
    .join('');
  elements.shareEmail.value = '';
  renderAttachments(doc);
  state.lastSavedSignature = getDraftSignature();
  state.hasUnsavedChanges = false;
  state.pendingAutosave = false;
  clearPendingAutosave();
  setAutosaveStatus('All changes saved', 'saved');
  updateToolbarState();
}

async function loadDocuments() {
  clearMessage(elements.message);
  const result = await apiRequest(`/api/documents?userId=${encodeURIComponent(state.currentUserId)}`);
  state.documents = result;
  renderDashboard();
}

async function loadDocument(documentId) {
  clearMessage(elements.editorMessage);
  const result = await apiRequest(`/api/documents/${documentId}?userId=${encodeURIComponent(state.currentUserId)}`);
  state.activeDocument = result.document;
  renderActiveDocument();
  switchView('editor');
  location.hash = `doc/${documentId}`;
}

async function createDocument() {
  const result = await apiRequest('/api/documents', {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, title: 'Untitled document', contentHtml: '<p></p>' })
  });
  await loadDocuments();
  await loadDocument(result.document.id);
  showMessage(elements.editorMessage, 'New document created. Autosave is on while you edit.');
}

function getDraftSignature() {
  return JSON.stringify({
    title: elements.documentTitle.value,
    contentHtml: elements.editor.innerHTML
  });
}

function clearPendingAutosave() {
  if (state.autosaveTimer) {
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = null;
  }
}

function queueAutosave() {
  if (!state.activeDocument) return;
  clearPendingAutosave();
  state.autosaveTimer = setTimeout(() => {
    saveDocument({ silent: true, source: 'autosave' }).catch((error) => {
      showMessage(elements.editorMessage, error.message, 'error');
      setAutosaveStatus('Autosave failed', 'error');
    });
  }, AUTOSAVE_DELAY_MS);
}

function handleDraftInput() {
  if (!state.activeDocument) return;
  const changed = getDraftSignature() !== state.lastSavedSignature;
  state.hasUnsavedChanges = changed;
  if (changed) {
    setAutosaveStatus('Unsaved changes', 'warning');
    queueAutosave();
  } else {
    clearPendingAutosave();
    setAutosaveStatus('All changes saved', 'saved');
  }
}

async function saveDocument({ silent = false, source = 'manual' } = {}) {
  if (!state.activeDocument) return;

  const draftSignature = getDraftSignature();
  if (draftSignature === state.lastSavedSignature && source !== 'manual') {
    setAutosaveStatus('All changes saved', 'saved');
    return;
  }

  if (state.saveInFlight) {
    state.pendingAutosave = true;
    return;
  }

  state.saveInFlight = true;
  clearPendingAutosave();
  setAutosaveStatus(source === 'autosave' ? 'Autosaving…' : 'Saving…', 'saving');

  try {
    const result = await apiRequest(`/api/documents/${state.activeDocument.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        userId: state.currentUserId,
        title: elements.documentTitle.value,
        contentHtml: elements.editor.innerHTML
      })
    });

    state.activeDocument = result.document;
    elements.documentTitle.value = result.document.title;
    updateActiveDocumentBadges();
    renderAttachments(result.document);
    state.lastSavedSignature = JSON.stringify({
      title: result.document.title,
      contentHtml: result.document.contentHtml
    });
    state.hasUnsavedChanges = false;
    setAutosaveStatus('All changes saved', 'saved');

    if (!silent) {
      showMessage(elements.editorMessage, 'Document saved successfully.');
    }
  } catch (error) {
    state.hasUnsavedChanges = true;
    setAutosaveStatus('Autosave failed', 'error');
    throw error;
  } finally {
    state.saveInFlight = false;
    if (state.pendingAutosave) {
      state.pendingAutosave = false;
      if (getDraftSignature() !== state.lastSavedSignature) {
        queueAutosave();
      }
    }
  }
}

async function shareDocument() {
  if (!state.activeDocument) return;
  const email = elements.shareEmail.value.trim();
  if (!email) {
    showMessage(elements.editorMessage, 'Enter a seeded user email before sharing.', 'error');
    return;
  }

  await apiRequest(`/api/documents/${state.activeDocument.id}/share`, {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, email })
  });

  await loadDocument(state.activeDocument.id);
  await loadDocuments();
  showMessage(elements.editorMessage, `Access granted to ${email}.`);
}

async function importFileAsNewDocument(file) {
  const lowerName = file.name.toLowerCase();
  if (!(lowerName.endsWith('.txt') || lowerName.endsWith('.md'))) {
    showMessage(elements.message, 'Only .txt and .md files are supported for import.', 'error');
    return;
  }

  const content = await file.text();
  const result = await apiRequest('/api/import', {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, filename: file.name, content })
  });

  await loadDocuments();
  showMessage(elements.message, `Imported ${file.name} as a new editable document.`);
  await loadDocument(result.document.id);
}

async function importFileIntoCurrentDocument(file) {
  if (!state.activeDocument) return;
  const lowerName = file.name.toLowerCase();
  if (!(lowerName.endsWith('.txt') || lowerName.endsWith('.md'))) {
    showMessage(elements.editorMessage, 'Only .txt and .md files can be imported into a draft.', 'error');
    return;
  }

  const content = await file.text();
  const result = await apiRequest(`/api/documents/${state.activeDocument.id}/import`, {
    method: 'POST',
    body: JSON.stringify({ userId: state.currentUserId, filename: file.name, content })
  });

  state.activeDocument = result.document;
  renderActiveDocument();
  showMessage(elements.editorMessage, `${file.name} was appended to this draft.`);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

async function uploadAttachment(file) {
  if (!state.activeDocument) return;
  const lowerName = file.name.toLowerCase();
  const allowed = ['.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg'];
  if (!allowed.some((extension) => lowerName.endsWith(extension))) {
    showMessage(elements.editorMessage, 'Supported attachment types are .txt, .md, .pdf, .png, .jpg, and .jpeg.', 'error');
    return;
  }

  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
    showMessage(elements.editorMessage, 'Attachments must be between 1 byte and 1 MB.', 'error');
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const result = await apiRequest(`/api/documents/${state.activeDocument.id}/attachments`, {
    method: 'POST',
    body: JSON.stringify({
      userId: state.currentUserId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      dataUrl
    })
  });

  state.activeDocument = result.document;
  renderActiveDocument();
  showMessage(elements.editorMessage, `${file.name} is now attached to this document.`);
}

function isSelectionInsideEditor() {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode) return false;
  return elements.editor.contains(selection.anchorNode);
}

function updateToolbarState() {
  const buttons = document.querySelectorAll('#toolbar button[data-command]');

  buttons.forEach((button) => button.classList.remove('active'));

  if (!isSelectionInsideEditor()) {
    return;
  }

  const blockValue = String(document.queryCommandValue('formatBlock') || '')
    .replace(/[<>]/g, '')
    .toUpperCase();

  buttons.forEach((button) => {
    const command = button.dataset.command;
    const value = String(button.dataset.value || '').toUpperCase();

    let isActive = false;

    if (
      command === 'bold' ||
      command === 'italic' ||
      command === 'underline' ||
      command === 'insertUnorderedList' ||
      command === 'insertOrderedList'
    ) {
      isActive = document.queryCommandState(command);
    } else if (command === 'formatBlock') {
      if (value === 'P') {
        isActive = blockValue === 'P' || blockValue === 'DIV' || blockValue === '';
      } else {
        isActive = blockValue === value;
      }
    }

    button.classList.toggle('active', isActive);
  });
}

function executeToolbarCommand(event) {
  const button = event.target.closest('button[data-command]');
  if (!button) return;
  const command = button.dataset.command;
  const value = button.dataset.value || null;
  elements.editor.focus();

  if (command === 'formatBlock' && value === 'P') {
    const selection = window.getSelection();
    const anchorNode = selection && selection.anchorNode;
    const container = anchorNode && anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
    const insideListItem = container && container.closest && container.closest('li');

    if (insideListItem) {
      const list = insideListItem.closest('ul, ol');
      if (list?.tagName === 'UL') {
        document.execCommand('insertUnorderedList', false, null);
      } else if (list?.tagName === 'OL') {
        document.execCommand('insertOrderedList', false, null);
      }
    }

    document.execCommand('formatBlock', false, 'P');
    handleDraftInput();
    updateToolbarState();
    return;
  }

  document.execCommand(command, false, value);
  handleDraftInput();
  updateToolbarState();
}


function openDocumentFromClick(event) {
  const button = event.target.closest('[data-open-document]');
  if (!button) return;
  loadDocument(button.dataset.openDocument).catch((error) => {
    showMessage(elements.message, error.message, 'error');
  });
}

function handleRouting() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) {
    switchView('dashboard');
    return;
  }

  if (hash.startsWith('doc/')) {
    const documentId = hash.split('/')[1];
    if (documentId) {
      loadDocument(documentId).catch(() => {
        switchView('dashboard');
      });
      return;
    }
  }

  switchView('dashboard');
}

async function bootstrap() {
  try {
    const result = await apiRequest('/api/users', { headers: {} });
    state.users = result.users;
    if (!state.currentUserId || !state.users.some((user) => user.id === state.currentUserId)) {
      setCurrentUser(state.users[0].id);
    }
    renderUsers();
    await loadDocuments();
    handleRouting();
  } catch (error) {
    showMessage(elements.message, error.message, 'error');
  }
}

elements.userSelect.addEventListener('change', async (event) => {
  setCurrentUser(event.target.value);
  state.activeDocument = null;
  state.hasUnsavedChanges = false;
  clearPendingAutosave();
  switchView('dashboard');
  location.hash = '';
  await loadDocuments();
});

elements.newDocumentButton.addEventListener('click', () => {
  createDocument().catch((error) => showMessage(elements.message, error.message, 'error'));
});

elements.refreshButton.addEventListener('click', () => {
  loadDocuments()
    .then(() => showMessage(elements.message, 'Document list refreshed.'))
    .catch((error) => showMessage(elements.message, error.message, 'error'));
});

elements.backButton.addEventListener('click', async () => {
  if (state.hasUnsavedChanges) {
    try {
      await saveDocument({ silent: true, source: 'manual' });
    } catch {
      // keep the error message shown by saveDocument
    }
  }
  await loadDocuments();
  state.activeDocument = null;
  switchView('dashboard');
  location.hash = '';
});

elements.saveButton.addEventListener('click', () => {
  saveDocument({ silent: false, source: 'manual' }).catch((error) => showMessage(elements.editorMessage, error.message, 'error'));
});

elements.shareButton.addEventListener('click', () => {
  shareDocument().catch((error) => showMessage(elements.editorMessage, error.message, 'error'));
});

document.getElementById('toolbar').addEventListener('click', executeToolbarCommand);

elements.documentTitle.addEventListener('input', handleDraftInput);

elements.editor.addEventListener('input', handleDraftInput);

elements.editor.addEventListener('keyup', updateToolbarState);
elements.editor.addEventListener('mouseup', updateToolbarState);
elements.editor.addEventListener('focus', updateToolbarState);
document.addEventListener('selectionchange', updateToolbarState);

elements.themeToggle?.addEventListener('click', toggleTheme);
initializeTheme();

elements.ownedDocuments.addEventListener('click', openDocumentFromClick);

elements.sharedDocuments.addEventListener('click', openDocumentFromClick);

elements.fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (file) {
    try {
      await importFileAsNewDocument(file);
    } catch (error) {
      showMessage(elements.message, error.message, 'error');
    }
  }
  event.target.value = '';
});

elements.draftImportInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (file) {
    try {
      await importFileIntoCurrentDocument(file);
    } catch (error) {
      showMessage(elements.editorMessage, error.message, 'error');
    }
  }
  event.target.value = '';
});

elements.attachmentInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (file) {
    try {
      await uploadAttachment(file);
    } catch (error) {
      showMessage(elements.editorMessage, error.message, 'error');
    }
  }
  event.target.value = '';
});

window.addEventListener('hashchange', handleRouting);

window.addEventListener('beforeunload', (event) => {
  if (!state.hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
});

bootstrap();
