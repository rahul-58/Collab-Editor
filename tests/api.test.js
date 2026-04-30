const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/server');

async function makeServer() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajaia-editor-'));
  const dataFile = path.join(tempDir, 'db.json');
  const publicDir = path.join(__dirname, '..', 'public');
  const server = createApp({ dataFile, publicDir });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    cleanup: () => {
      server.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

test('owner can share a document and recipient can access it, non-owner cannot reshare', async () => {
  const runtime = await makeServer();

  try {
    const createResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_alex', title: 'Quarterly Plan', contentHtml: '<p>Draft</p>' })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    const shareResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_alex', email: 'maya@ajaia.local' })
    });
    assert.equal(shareResponse.status, 201);

    const mayaAccessResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}?userId=user_maya`);
    assert.equal(mayaAccessResponse.status, 200);
    const mayaDocument = await mayaAccessResponse.json();
    assert.equal(mayaDocument.document.title, 'Quarterly Plan');

    const forbiddenShareResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_maya', email: 'sam@ajaia.local' })
    });
    assert.equal(forbiddenShareResponse.status, 403);
  } finally {
    runtime.cleanup();
  }
});

test('markdown import creates a formatted document', async () => {
  const runtime = await makeServer();

  try {
    const importResponse = await fetch(`${runtime.baseUrl}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_alex',
        filename: 'notes.md',
        content: '# Hello\n\n- item one\n- item two\n\n**Bold** text'
      })
    });

    assert.equal(importResponse.status, 201);
    const payload = await importResponse.json();
    assert.match(payload.document.contentHtml, /<h1>Hello<\/h1>/);
    assert.match(payload.document.contentHtml, /<ul>/);
    assert.match(payload.document.contentHtml, /<strong>Bold<\/strong>/);
  } finally {
    runtime.cleanup();
  }
});

test('import into an existing draft appends the imported content for editors', async () => {
  const runtime = await makeServer();

  try {
    const createResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_alex', title: 'Working Draft', contentHtml: '<p>Before import</p>' })
    });
    const created = await createResponse.json();

    const importResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_alex',
        filename: 'append.md',
        content: '## Imported section\n\n- follow up item'
      })
    });

    assert.equal(importResponse.status, 200);
    const payload = await importResponse.json();
    assert.match(payload.document.contentHtml, /Before import/);
    assert.match(payload.document.contentHtml, /<hr>/);
    assert.match(payload.document.contentHtml, /<h2>Imported section<\/h2>/);
    assert.match(payload.document.contentHtml, /follow up item/);
  } finally {
    runtime.cleanup();
  }
});

test('attachments are stored with the document and access is enforced on download', async () => {
  const runtime = await makeServer();

  try {
    const createResponse = await fetch(`${runtime.baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_alex', title: 'Attachment Doc', contentHtml: '<p>Attachment host</p>' })
    });
    const created = await createResponse.json();

    const attachmentText = 'Attached reference material';
    const dataUrl = `data:text/plain;base64,${Buffer.from(attachmentText).toString('base64')}`;
    const attachmentResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_alex',
        filename: 'reference.txt',
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(attachmentText),
        dataUrl
      })
    });

    assert.equal(attachmentResponse.status, 201);
    const attachmentPayload = await attachmentResponse.json();
    assert.equal(attachmentPayload.document.attachments.length, 1);

    const shareResponse = await fetch(`${runtime.baseUrl}/api/documents/${created.document.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_alex', email: 'maya@ajaia.local' })
    });
    assert.equal(shareResponse.status, 201);

    const downloadResponse = await fetch(
      `${runtime.baseUrl}/api/documents/${created.document.id}/attachments/${attachmentPayload.attachment.id}?userId=user_maya`
    );
    assert.equal(downloadResponse.status, 200);
    const downloadedText = await downloadResponse.text();
    assert.equal(downloadedText, attachmentText);

    const forbiddenDownload = await fetch(
      `${runtime.baseUrl}/api/documents/${created.document.id}/attachments/${attachmentPayload.attachment.id}?userId=user_sam`
    );
    assert.equal(forbiddenDownload.status, 403);
  } finally {
    runtime.cleanup();
  }
});
