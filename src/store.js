const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_USERS = [
  { id: 'user_alex', name: 'Alex Johnson', email: 'alex@ajaia.local' },
  { id: 'user_maya', name: 'Maya Patel', email: 'maya@ajaia.local' },
  { id: 'user_sam', name: 'Sam Lee', email: 'sam@ajaia.local' }
];

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeFilename(filename, fallback = 'file') {
  const trimmed = String(filename || '').trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120) || fallback;
}

class JsonStore {
  constructor(options = {}) {
    this.filePath = options.filePath || path.join(process.cwd(), 'data', 'db.json');
  }

  ensureInitialized() {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      const seededDocumentId = createId('doc');
      const timestamp = nowIso();
      const seedData = {
        users: DEFAULT_USERS,
        documents: [
          {
            id: seededDocumentId,
            title: 'Welcome to Ajaia Docs',
            contentHtml:
              '<h1>Welcome</h1><p>This seeded document shows the rich text editor and sharing flow.</p><ul><li>Format text</li><li>Autosave changes</li><li>Share with another user</li><li>Attach a supporting file</li></ul>',
            ownerId: 'user_alex',
            createdAt: timestamp,
            updatedAt: timestamp
          }
        ],
        shares: [
          {
            id: createId('share'),
            documentId: seededDocumentId,
            userId: 'user_maya',
            permission: 'edit',
            createdAt: timestamp
          }
        ],
        attachments: []
      };

      this.write(seedData);
      return;
    }

    const normalized = this.normalizeDb(JSON.parse(fs.readFileSync(this.filePath, 'utf8')));
    this.write(normalized);
  }

  normalizeDb(db) {
    const timestamp = nowIso();
    const normalized = {
      users: Array.isArray(db.users) && db.users.length ? db.users : clone(DEFAULT_USERS),
      documents: Array.isArray(db.documents) ? db.documents : [],
      shares: Array.isArray(db.shares) ? db.shares : [],
      attachments: Array.isArray(db.attachments) ? db.attachments : []
    };

    normalized.documents = normalized.documents.map((document) => ({
      id: document.id || createId('doc'),
      title: typeof document.title === 'string' && document.title.trim() ? document.title.trim() : 'Untitled document',
      contentHtml: typeof document.contentHtml === 'string' ? document.contentHtml : '<p></p>',
      ownerId: document.ownerId,
      createdAt: document.createdAt || timestamp,
      updatedAt: document.updatedAt || document.createdAt || timestamp
    }));

    normalized.shares = normalized.shares
      .filter((share) => share.documentId && share.userId)
      .map((share) => ({
        id: share.id || createId('share'),
        documentId: share.documentId,
        userId: share.userId,
        permission: share.permission || 'edit',
        createdAt: share.createdAt || timestamp
      }));

    normalized.attachments = normalized.attachments
      .filter((attachment) => attachment.documentId && attachment.filename && attachment.dataUrl)
      .map((attachment) => ({
        id: attachment.id || createId('att'),
        documentId: attachment.documentId,
        filename: normalizeFilename(attachment.filename),
        mimeType: attachment.mimeType || 'application/octet-stream',
        dataUrl: attachment.dataUrl,
        sizeBytes: Number(attachment.sizeBytes) || 0,
        uploadedBy: attachment.uploadedBy || null,
        createdAt: attachment.createdAt || timestamp
      }));

    return normalized;
  }

  read() {
    this.ensureInitialized();
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }

  write(data) {
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.normalizeDb(data), null, 2));
    fs.renameSync(tempPath, this.filePath);
  }

  listUsers() {
    return clone(this.read().users);
  }

  getUserById(userId) {
    return this.read().users.find((user) => user.id === userId) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    return this.read().users.find((user) => user.email.toLowerCase() === normalized) || null;
  }

  userCanAccessDocument(db, documentId, userId) {
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) return false;
    return document.ownerId === userId || db.shares.some((share) => share.documentId === documentId && share.userId === userId);
  }

  userCanEditDocument(db, documentId, userId) {
    return this.userCanAccessDocument(db, documentId, userId);
  }

  getSharedUsers(db, documentId) {
    return db.shares
      .filter((share) => share.documentId === documentId)
      .map((share) => db.users.find((user) => user.id === share.userId))
      .filter(Boolean)
      .map((user) => ({ id: user.id, name: user.name, email: user.email }));
  }

  getAttachmentsForDocument(db, documentId) {
    return db.attachments
      .filter((attachment) => attachment.documentId === documentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedBy: attachment.uploadedBy,
        createdAt: attachment.createdAt
      }));
  }

  hydrateDocument(db, document, userId) {
    const owner = db.users.find((user) => user.id === document.ownerId) || null;
    return {
      ...clone(document),
      owner,
      sharedUsers: this.getSharedUsers(db, document.id),
      attachments: this.getAttachmentsForDocument(db, document.id),
      canManageSharing: document.ownerId === userId
    };
  }

  listDocumentsForUser(userId) {
    const db = this.read();
    const owned = [];
    const shared = [];

    for (const document of db.documents) {
      const owner = db.users.find((user) => user.id === document.ownerId) || null;
      const summary = {
        id: document.id,
        title: document.title,
        owner,
        updatedAt: document.updatedAt,
        createdAt: document.createdAt,
        sharedUsers: this.getSharedUsers(db, document.id),
        attachmentCount: db.attachments.filter((attachment) => attachment.documentId === document.id).length
      };

      if (document.ownerId === userId) {
        owned.push(summary);
      } else if (db.shares.some((share) => share.documentId === document.id && share.userId === userId)) {
        shared.push(summary);
      }
    }

    owned.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    shared.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return { owned, shared };
  }

  getDocumentForUser(documentId, userId) {
    const db = this.read();
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) return null;
    if (!this.userCanAccessDocument(db, documentId, userId)) return null;
    return clone(this.hydrateDocument(db, document, userId));
  }

  createDocument({ ownerId, title, contentHtml }) {
    const db = this.read();
    const timestamp = nowIso();
    const document = {
      id: createId('doc'),
      title: title && title.trim() ? title.trim() : 'Untitled document',
      contentHtml: contentHtml || '<p></p>',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.documents.push(document);
    this.write(db);
    return clone(document);
  }

  updateDocument({ documentId, userId, title, contentHtml }) {
    const db = this.read();
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) {
      return { error: 'not_found' };
    }

    if (!this.userCanEditDocument(db, documentId, userId)) {
      return { error: 'forbidden' };
    }

    if (typeof title === 'string') {
      document.title = title.trim() ? title.trim() : 'Untitled document';
    }

    if (typeof contentHtml === 'string') {
      document.contentHtml = contentHtml;
    }

    document.updatedAt = nowIso();
    this.write(db);
    return { document: this.getDocumentForUser(documentId, userId) };
  }

  importIntoDocument({ documentId, userId, importedHtml }) {
    const db = this.read();
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) {
      return { error: 'not_found' };
    }

    if (!this.userCanEditDocument(db, documentId, userId)) {
      return { error: 'forbidden' };
    }

    const safeImportedHtml = typeof importedHtml === 'string' && importedHtml.trim() ? importedHtml : '<p></p>';
    const existingContent = typeof document.contentHtml === 'string' && document.contentHtml.trim() ? document.contentHtml : '<p></p>';
    document.contentHtml = `${existingContent}<hr>${safeImportedHtml}`;
    document.updatedAt = nowIso();
    this.write(db);
    return { document: this.getDocumentForUser(documentId, userId) };
  }

  shareDocument({ documentId, ownerUserId, targetEmail }) {
    const db = this.read();
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) {
      return { error: 'not_found' };
    }

    if (document.ownerId !== ownerUserId) {
      return { error: 'forbidden' };
    }

    const targetUser = db.users.find((user) => user.email.toLowerCase() === String(targetEmail || '').trim().toLowerCase());
    if (!targetUser) {
      return { error: 'user_not_found' };
    }

    if (targetUser.id === ownerUserId) {
      return { error: 'cannot_share_with_owner' };
    }

    const existingShare = db.shares.find((share) => share.documentId === documentId && share.userId === targetUser.id);
    if (existingShare) {
      return { error: 'already_shared' };
    }

    const share = {
      id: createId('share'),
      documentId,
      userId: targetUser.id,
      permission: 'edit',
      createdAt: nowIso()
    };

    db.shares.push(share);
    document.updatedAt = nowIso();
    this.write(db);
    return { share: clone(share), targetUser: clone(targetUser) };
  }

  addAttachment({ documentId, userId, filename, mimeType, dataUrl, sizeBytes }) {
    const db = this.read();
    const document = db.documents.find((doc) => doc.id === documentId);
    if (!document) {
      return { error: 'not_found' };
    }

    if (!this.userCanEditDocument(db, documentId, userId)) {
      return { error: 'forbidden' };
    }

    const attachment = {
      id: createId('att'),
      documentId,
      filename: normalizeFilename(filename, 'attachment'),
      mimeType: mimeType || 'application/octet-stream',
      dataUrl,
      sizeBytes: Number(sizeBytes) || 0,
      uploadedBy: userId,
      createdAt: nowIso()
    };

    db.attachments.push(attachment);
    document.updatedAt = nowIso();
    this.write(db);
    return {
      attachment: clone({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedBy: attachment.uploadedBy,
        createdAt: attachment.createdAt
      }),
      document: this.getDocumentForUser(documentId, userId)
    };
  }

  getAttachmentForUser({ documentId, attachmentId, userId }) {
    const db = this.read();
    if (!this.userCanAccessDocument(db, documentId, userId)) {
      return { error: 'forbidden' };
    }

    const attachment = db.attachments.find((item) => item.id === attachmentId && item.documentId === documentId);
    if (!attachment) {
      return { error: 'not_found' };
    }

    return { attachment: clone(attachment) };
  }
}

module.exports = {
  JsonStore,
  DEFAULT_USERS
};
