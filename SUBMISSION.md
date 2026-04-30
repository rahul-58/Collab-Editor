# Submission

This folder contains my submission for the Ajaia collaborative document editor assignment.

## Included

- source code
- `README.md`
- `architecture-note.md`
- `ai-workflow-note.md`
- `SUBMISSION.md`
- `DEPLOYMENT.md`
- sample files for import testing
- automated tests

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

At least one meaningful automated test is included. The suite covers the main sharing and file-handling paths.

Run with:

```bash
npm test
```

## Live deployment

Live URL: `ADD_LIVE_URL_HERE`

## Walkthrough video

Video URL: `ADD_VIDEO_URL_HERE`

## What is complete

The core document flow works end to end:
create, edit, save, share, import, attach, and reopen.

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
