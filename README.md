# Ajaia Collab Editor

This is a lightweight collaborative document editor built for the Ajaia take-home assignment.

I intentionally scoped it to one solid end-to-end workflow instead of trying to recreate all of Google Docs. The app lets a seeded user create documents, format content in the browser, share documents with another seeded user, attach supporting files, and reopen everything after refresh.

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

There is no full auth flow in this version. I used seeded users to keep the project focused on document behavior, sharing, and persistence.

## Tech stack

- Node.js
- Express
- Vanilla HTML, CSS, and JavaScript
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

## Notes on persistence

This app stores data locally on disk. Documents, shares, and attachments remain available after refresh and app restart.

For local development this works out of the box. For deployment, use a host with persistent storage.

## Deployment

This project is set up for Railway-style deployment with persistent volume support.

Files included for that:
- `Dockerfile`
- `railway.json`
- `DEPLOYMENT.md`

## Known limitations

This is intentionally scoped and does not include:
- real-time collaboration
- comments or suggestion mode
- version history
- granular permissions beyond basic shared access
- full user authentication
- `.docx` import

## Why the scope looks like this

The goal here was to ship a working collaborative editor slice that feels coherent in a short timebox. I prioritized document creation, editing, import, sharing, persistence, and basic usability over more ambitious features that would have spread the work too thin.

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
