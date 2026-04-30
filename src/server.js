const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { JsonStore } = require('./store');
const { markdownToHtml, textToHtml } = require('./markdown');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const MAX_ATTACHMENT_BYTES = 1_000_000;
const ATTACHMENT_EXTENSION_ALLOWLIST = new Set(['.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg']);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendBuffer(res, statusCode, buffer, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(buffer);
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 5_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseJsonBody(bodyText) {
  if (!bodyText) return {};
  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
}

function validateUser(store, userId) {
  if (!userId) return null;
  return store.getUserById(userId);
}

function serveStaticFile(req, res, publicDir) {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  const targetPath = requestPath === '/' ? '/index.html' : requestPath;
  const normalizedPath = path.normalize(targetPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    sendText(res, 403, 'Forbidden');
    return true;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  if (requestPath === '/' || !path.extname(requestPath)) {
    const fallbackPath = path.join(publicDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(fallbackPath).pipe(res);
    return true;
  }

  return false;
}

function importContentToHtml(filename, content) {
  const lowerName = filename.toLowerCase();
  if (!(lowerName.endsWith('.txt') || lowerName.endsWith('.md'))) {
    return { error: 'unsupported_import_type' };
  }
  return {
    contentHtml: lowerName.endsWith('.md') ? markdownToHtml(content) : textToHtml(content),
    title: filename.replace(/\.(txt|md)$/i, '')
  };
}

function isAllowedAttachment(filename) {
  const extension = path.extname(String(filename || '')).toLowerCase();
  return ATTACHMENT_EXTENSION_ALLOWLIST.has(extension);
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  try {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], 'base64')
    };
  } catch {
    return null;
  }
}

function createApp(options = {}) {
  const store = options.store || new JsonStore({ filePath: options.dataFile });
  store.ensureInitialized();
  const publicDir = options.publicDir || path.join(process.cwd(), 'public');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    res.setHeader('Cache-Control', 'no-store');

    try {
      if (req.method === 'GET' && url.pathname === '/api/health') {
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/users') {
        sendJson(res, 200, { users: store.listUsers() });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/documents') {
        const userId = url.searchParams.get('userId');
        const user = validateUser(store, userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        sendJson(res, 200, store.listDocumentsForUser(userId));
        return;
      }

      if (req.method === 'GET' && /^\/api\/documents\/[^/]+$/.test(url.pathname)) {
        const documentId = url.pathname.split('/').pop();
        const userId = url.searchParams.get('userId');
        const user = validateUser(store, userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const document = store.getDocumentForUser(documentId, userId);
        if (!document) {
          sendJson(res, 404, { error: 'Document not found or access denied.' });
          return;
        }

        sendJson(res, 200, { document });
        return;
      }

      if (req.method === 'GET' && /^\/api\/documents\/[^/]+\/attachments\/[^/]+$/.test(url.pathname)) {
        const [, , , documentId, , attachmentId] = url.pathname.split('/');
        const userId = url.searchParams.get('userId');
        const user = validateUser(store, userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const result = store.getAttachmentForUser({ documentId, attachmentId, userId: user.id });
        if (result.error === 'forbidden') {
          sendJson(res, 403, { error: 'You do not have permission to access this attachment.' });
          return;
        }
        if (result.error === 'not_found') {
          sendJson(res, 404, { error: 'Attachment not found.' });
          return;
        }

        const parsed = parseDataUrl(result.attachment.dataUrl);
        if (!parsed) {
          sendJson(res, 500, { error: 'Attachment payload is invalid.' });
          return;
        }

        sendBuffer(res, 200, parsed.buffer, {
          'Content-Type': result.attachment.mimeType || parsed.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${result.attachment.filename.replace(/"/g, '')}"`,
          'Content-Length': String(parsed.buffer.length)
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/documents') {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const document = store.createDocument({
          ownerId: user.id,
          title: body.title,
          contentHtml: typeof body.contentHtml === 'string' ? body.contentHtml : '<p></p>'
        });

        sendJson(res, 201, { document });
        return;
      }

      if (req.method === 'PATCH' && /^\/api\/documents\/[^/]+$/.test(url.pathname)) {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const result = store.updateDocument({
          documentId: url.pathname.split('/').pop(),
          userId: user.id,
          title: body.title,
          contentHtml: body.contentHtml
        });

        if (result.error === 'not_found') {
          sendJson(res, 404, { error: 'Document not found.' });
          return;
        }

        if (result.error === 'forbidden') {
          sendJson(res, 403, { error: 'You do not have permission to edit this document.' });
          return;
        }

        sendJson(res, 200, { document: result.document });
        return;
      }

      if (req.method === 'POST' && /^\/api\/documents\/[^/]+\/share$/.test(url.pathname)) {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const result = store.shareDocument({
          documentId: url.pathname.split('/')[3],
          ownerUserId: user.id,
          targetEmail: body.email
        });

        if (result.error === 'not_found') {
          sendJson(res, 404, { error: 'Document not found.' });
          return;
        }
        if (result.error === 'forbidden') {
          sendJson(res, 403, { error: 'Only the document owner can manage sharing.' });
          return;
        }
        if (result.error === 'user_not_found') {
          sendJson(res, 400, { error: 'No seeded user found for that email.' });
          return;
        }
        if (result.error === 'cannot_share_with_owner') {
          sendJson(res, 400, { error: 'The owner already has access to this document.' });
          return;
        }
        if (result.error === 'already_shared') {
          sendJson(res, 409, { error: 'That user already has access.' });
          return;
        }

        sendJson(res, 201, { share: result.share, targetUser: result.targetUser });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/import') {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const filename = String(body.filename || '').trim();
        const content = typeof body.content === 'string' ? body.content : '';

        if (!filename) {
          sendJson(res, 400, { error: 'A filename is required.' });
          return;
        }

        const imported = importContentToHtml(filename, content);
        if (imported.error === 'unsupported_import_type') {
          sendJson(res, 400, { error: 'Only .txt and .md files are supported for import.' });
          return;
        }

        const document = store.createDocument({
          ownerId: user.id,
          title: imported.title,
          contentHtml: imported.contentHtml
        });

        sendJson(res, 201, { document });
        return;
      }

      if (req.method === 'POST' && /^\/api\/documents\/[^/]+\/import$/.test(url.pathname)) {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const filename = String(body.filename || '').trim();
        const content = typeof body.content === 'string' ? body.content : '';
        if (!filename) {
          sendJson(res, 400, { error: 'A filename is required.' });
          return;
        }

        const imported = importContentToHtml(filename, content);
        if (imported.error === 'unsupported_import_type') {
          sendJson(res, 400, { error: 'Only .txt and .md files are supported for import.' });
          return;
        }

        const result = store.importIntoDocument({
          documentId: url.pathname.split('/')[3],
          userId: user.id,
          importedHtml: imported.contentHtml
        });

        if (result.error === 'not_found') {
          sendJson(res, 404, { error: 'Document not found.' });
          return;
        }
        if (result.error === 'forbidden') {
          sendJson(res, 403, { error: 'You do not have permission to edit this document.' });
          return;
        }

        sendJson(res, 200, { document: result.document });
        return;
      }

      if (req.method === 'POST' && /^\/api\/documents\/[^/]+\/attachments$/.test(url.pathname)) {
        const body = parseJsonBody(await readRequestBody(req));
        if (!body) {
          sendJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const user = validateUser(store, body.userId);
        if (!user) {
          sendJson(res, 400, { error: 'Valid userId is required.' });
          return;
        }

        const filename = String(body.filename || '').trim();
        const mimeType = String(body.mimeType || '').trim() || 'application/octet-stream';
        const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
        const sizeBytes = Number(body.sizeBytes) || 0;

        if (!filename) {
          sendJson(res, 400, { error: 'A filename is required.' });
          return;
        }

        if (!isAllowedAttachment(filename)) {
          sendJson(res, 400, { error: 'Supported attachment types are .txt, .md, .pdf, .png, .jpg, and .jpeg.' });
          return;
        }

        if (!dataUrl.startsWith('data:')) {
          sendJson(res, 400, { error: 'Attachment payload is missing or invalid.' });
          return;
        }

        if (sizeBytes <= 0 || sizeBytes > MAX_ATTACHMENT_BYTES) {
          sendJson(res, 400, { error: 'Attachments must be between 1 byte and 1 MB.' });
          return;
        }

        const parsed = parseDataUrl(dataUrl);
        if (!parsed || parsed.buffer.length !== sizeBytes) {
          sendJson(res, 400, { error: 'Attachment payload could not be verified.' });
          return;
        }

        const result = store.addAttachment({
          documentId: url.pathname.split('/')[3],
          userId: user.id,
          filename,
          mimeType,
          dataUrl,
          sizeBytes
        });

        if (result.error === 'not_found') {
          sendJson(res, 404, { error: 'Document not found.' });
          return;
        }
        if (result.error === 'forbidden') {
          sendJson(res, 403, { error: 'You do not have permission to attach files to this document.' });
          return;
        }

        sendJson(res, 201, { attachment: result.attachment, document: result.document });
        return;
      }

      if (serveStaticFile(req, res, publicDir)) {
        return;
      }

      notFound(res);
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'Something went wrong on the server.' });
    }
  });

  return server;
}

function resolveDataFile() {
  if (process.env.DATA_FILE) {
    return path.resolve(process.env.DATA_FILE);
  }

  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'db.json');
  }

  return undefined;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const dataFile = resolveDataFile();
  const server = createApp({ dataFile, publicDir: path.join(process.cwd(), 'public') });
  server.listen(port, () => {
    console.log(`Ajaia Collab Editor running at http://localhost:${port}`);
  });
}

module.exports = {
  createApp,
  resolveDataFile
};
