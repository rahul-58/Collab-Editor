# Ajaia Collab Editor

A lightweight collaborative document editor built for the Ajaia product-engineering assignment. The app now focuses on a fuller core workflow: create a document, apply basic rich-text formatting, autosave changes, import a text or Markdown file into a new or existing draft, attach supporting files to a document, share that document with another seeded user, and reopen everything after refresh.

## What is included

- Seeded multi-user flow with three demo users
- Create, rename, edit, autosave, manually save, and reopen documents
- Basic rich-text formatting using the browser editing APIs
- Import `.txt` and `.md` files into new editable documents
- Import `.txt` and `.md` files into an existing draft by appending the imported content
- Upload and associate attachments with a document
- Owner vs shared document separation on the dashboard
- Simple sharing model with owner-controlled access
- Local JSON persistence with seeded data
- Automated API tests for sharing, new-document import, draft import, and attachment access

## Supported file types

### Import as editable content

- `.txt`
- `.md`

### Attach to a document

- `.txt`
- `.md`
- `.pdf`
- `.png`
- `.jpg`
- `.jpeg`

Attachment size limit: 1 MB per file.

## Tech stack

- Node.js HTTP server with no runtime dependencies
- Vanilla HTML, CSS, and JavaScript frontend
- File-based JSON persistence in `data/db.json`
- Built-in `node:test` test runner

## Seeded users

Use the user picker in the sidebar to switch between accounts:

- Alex Johnson — `alex@ajaia.local`
- Maya Patel — `maya@ajaia.local`
- Sam Lee — `sam@ajaia.local`

The seeded database starts with one shared document owned by Alex and shared with Maya so the access model is immediately visible.

## Local setup

### Prerequisites

- Node.js 20 or newer

### Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Note: this project does not require external packages, so `npm install` is effectively a no-op and is only included for consistency.

### Run tests

```bash
npm test
```

## Deployment

This project is deployment-ready for Railway. The repo includes `railway.json`, a `Dockerfile`, and server-side support for storing the JSON database on a mounted Railway volume automatically via `RAILWAY_VOLUME_MOUNT_PATH`. See `DEPLOYMENT.md` for the exact hosting steps and post-deploy smoke test.

## Project structure

```text
public/
  index.html
  styles.css
  app.js
src/
  server.js
  store.js
  markdown.js
tests/
  api.test.js
README.md
architecture-note.md
ai-workflow-note.md
SUBMISSION.md
walkthrough-video-url.txt
```

## Product notes

### Core user flow

1. Pick a seeded user from the sidebar
2. Create a new document or import a `.txt`/`.md` file as a new document
3. Format content with the toolbar
4. Let autosave persist changes or click **Save now**
5. Append imported `.txt` or `.md` content into an existing draft when needed
6. Upload a supporting attachment for that document
7. Share the document with another seeded user email
8. Switch users and confirm the document appears in **Shared with me**
9. Reopen and edit the shared document or download the attachment

### Validation and error handling included

- User identity must be valid for every API request
- Empty titles fall back to `Untitled document`
- Unsupported import types are rejected in both UI and API
- Unsupported attachment types are rejected in both UI and API
- Attachments larger than 1 MB are rejected
- Share target must match a seeded user
- Duplicate shares are blocked
- Only owners can manage sharing
- Users without access cannot open, edit, or download attachments for a document

## Known limitations

- This is not real-time collaboration
- The editor uses `contenteditable` and `document.execCommand`, which is acceptable for this scoped assignment but not a long-term editor architecture
- Draft import appends content at the end of the current document instead of inserting at the exact cursor position
- Attachment storage is file-based and embedded in the local JSON store, which is fine for a small demo but not how I would handle production uploads
- There is no delete flow, comments, or version history
- Persistence is file-based rather than database-backed

## What I would build next with another 2–4 hours

- Replace the editor with TipTap or ProseMirror for stronger document semantics
- Improve autosave with field-level dirty indicators and conflict messaging
- Allow import into the current cursor position instead of append-only
- Add delete and duplicate actions for documents and attachments
- Move persistence to SQLite or Postgres with blob/object storage for attachments
- Add user authentication instead of a seeded-user switcher
- Add richer Markdown import and export
