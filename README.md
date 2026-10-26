# Ajaia Collab Editor

This is a lightweight collaborative document editor built for the Ajaia take-home assignment.

I intentionally scoped it to one solid end-to-end workflow instead of trying to recreate all of Google Docs. The app lets a seeded user create documents, format content in the browser, share documents with another seeded user, attach supporting files and reopen everything after refresh.

## What it supports

- Create a new document
- Rename a document
- Edit rich text in the browser
- Autosave changes
- Save manually if needed
- Upload a `.txt` or `.md` file as a new document
- Import a `.txt` or `.md` file into an existing draft
- Attach a supporting file to a document
- Share a document with another seeded user
- View owned documents separately from shared documents
- Reopen documents and preserve content after refresh

## Supported file types

### Import into documents
- `.txt`
- `.md`

### Attachments
- `.txt`
- `.md`
- `.pdf`
- `.png`
- `.jpg`
- `.jpeg`

Attachment size limit: 1 MB

## Seeded users

Use these accounts to test the sharing flow:

- Alex Johnson — `alex@ajaia.local`
- Maya Patel — `maya@ajaia.local`
- Sam Lee — `sam@ajaia.local`

There is no full auth flow in this version. I used seeded users to keep the project focused on document behavior, sharing and persistence.

## Tech stack

- Node.js
- Express
- Vanilla HTML, CSS and JavaScript
- Local JSON/file-based persistence
- Jest + Supertest for API tests

I kept the stack simple so I could spend time on the actual product flow instead of framework setup.

## Running locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open:

```bash
http://localhost:3000
```

## Running tests

```bash
npm test
```

## Project structure

- `public/` → frontend files
- `src/server.js` → API and app server
- `src/store.js` → persistence layer
- `tests/` → automated tests
- `sample-files/` → sample files for import testing

## Main user flow to test

1. Select Alex as the active user
2. Create a document
3. Add formatted content
4. Share the document with Maya
5. Switch to Maya
6. Open the shared document
7. Edit it and confirm the changes persist
8. Import a `.md` or `.txt` file into a new document or existing draft
9. Add an attachment and download it

## Persistence

Collab Editor uses file-based storage to save documents, formatting, sharing information, and attachments.

When running locally, the application stores this data on disk.

In production, the application runs on Railway with a persistent volume mounted at `/data`. This keeps documents, sharing information, and attachments available across application restarts and redeployments.

The storage approach is intentionally lightweight for this project. For a larger application with more users and concurrent editing, I would consider PostgreSQL and object storage.

## Deployment

Collab Editor is deployed on Railway using Docker, with a persistent volume mounted at `/data` to store documents and attachments.

The deployment is connected to the GitHub repository, so new commits to the configured branch can trigger a redeployment.

Deployment files:
- `Dockerfile`
- `railway.json`
- `DEPLOYMENT.md`

## Live Deployment

**Live Application:** https://collab-editor-production-9cf3.up.railway.app/

**GitHub Repository:** https://github.com/rahul-58/Collab-Editor

The application can be tested directly in the browser without creating an account. Select any seeded user listed above to try document editing, imports, attachments, and sharing.

The live version uses Railway persistent storage to preserve documents and attachments across application restarts.

## Known limitations

This is intentionally scoped and does not include:
- real-time collaboration
- comments or suggestion mode
- version history
- granular permissions beyond basic shared access
- full user authentication
- `.docx` import

## Why the scope looks like this

The goal was to ship a working collaborative editor slice that feels coherent in a limited time. I prioritized document creation, editing, import, sharing, persistence and basic usability over more features that would have taken more time to be perfected.

## Demo checklist

Before submitting, I used this as the quick regression path:

1. Create a document
2. Rename it
3. Apply formatting
4. Refresh and confirm persistence
5. Share with Maya
6. Open and edit as Maya
7. Import `.txt` or `.md`
8. Attach and download a file
