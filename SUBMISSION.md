# Submission

This folder contains my submission for the Ajaia collaborative document editor assignment.

## Included

- Full application source code
- `README.md` - Project overview, features, and local setup
- `architecture-note.md` - Architecture decisions and tradeoffs
- `ai-workflow-note.md` - How AI tools supported development
- `SUBMISSION.md` - Submission details and links
- `DEPLOYMENT.md` - Deployment configuration and setup
- `LOCAL-VERIFICATION.md` - Local test results and verification steps
- `walkthrough-video-url.txt` - Walkthrough recording link
- `sample-files/` - Sample files for import testing
- `tests/` - Automated API tests
- `Dockerfile` and `railway.json` - Deployment configuration

## Main features included

- create a new document
- rename a document
- edit rich text in the browser
- autosave and manual save
- reopen saved documents
- import `.txt` and `.md` files as new documents
- import `.txt` and `.md` files into an existing draft
- upload document attachments
- share a document with another seeded user
- visible distinction between owned and shared documents
- persistence after refresh and restart

## Seeded users

- Alex Johnson — `alex@ajaia.local`
- Maya Patel — `maya@ajaia.local`
- Sam Lee — `sam@ajaia.local`

## Automated test coverage included

The suite covers the main sharing and file-handling paths.

Run with:

```bash
npm test
```

## Live deployment

Live URL: `https://collab-editor-production-9cf3.up.railway.app/`

## Walkthrough video

Video URL: `https://www.loom.com/share/53fbce2050c1475dbb2a71086664344a`

## What is complete

The core document flow works end to end:
create, edit, save, share, import, attach and reopen.

## What is intentionally not included

- real-time collaboration
- comments or suggestions
- version history
- export
- advanced role-based permissions
- full auth

## What I would build next with a little more time

If I had another 2 to 4 hours, I would most likely add:
1. a more polished editor experience
2. stronger attachment UX
3. more automated coverage around permission and editor edge cases
4. a small stretch feature like version history or document export
