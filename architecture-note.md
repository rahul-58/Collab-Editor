# Architecture Note

## What I prioritized

I intentionally focused on the smallest product slice that demonstrates judgment across document creation, editing, file handling, sharing, and persistence:

- a usable in-browser editor with a formatting toolbar
- persisted documents that survive refresh
- autosave so the editing flow feels more document-like
- an obvious owner/shared split in the dashboard
- a reliable seeded-user sharing flow
- lightweight file import for both new documents and existing drafts
- document-level attachments that are visible and access-controlled

The goal was a coherent end-to-end experience rather than breadth.

## Why I chose this architecture

I used a small Node HTTP server plus a vanilla frontend for two reasons:

1. it keeps the full stack understandable and easy to verify locally
2. it removes external package risk so the project can be run and tested without dependency resolution issues

For persistence, I chose a local JSON store. The assignment explicitly allows a local file-based store if it is well documented. That let me keep the collaboration logic real while staying inside the timebox.

## Data model

The app persists four collections:

- `users`
- `documents`
- `shares`
- `attachments`

Each document has one owner. Shared access is represented as a separate record so the dashboard can clearly distinguish between documents that a user owns and documents shared with them.

Attachments are stored separately and linked by `documentId`, which keeps the document model simple while still making it possible to enforce access control on attachment downloads.

## Editing model

The editor uses `contenteditable` with browser formatting commands for:

- bold
- italic
- underline
- headings
- paragraph resets
- bulleted lists
- numbered lists

This is not the editor architecture I would use for a production collaborative editor, but it is a practical choice for a scoped take-home because it delivers a working rich-text flow quickly.

Autosave is implemented in the client with a debounced save call to the existing document update endpoint. I kept the persistence path single-purpose instead of creating a separate autosave endpoint, because the same validation and authorization rules apply in both cases.

## File upload decisions

I split file handling into two product-relevant paths:

1. import `.txt` and `.md` into a brand new editable document
2. append `.txt` and `.md` content into an existing draft

That covers both creation and in-progress editing workflows without introducing `.docx` parsing complexity.

For attachments, I allowed a slightly broader set of small reference-file types and stored them directly in the JSON database for this take-home. That is acceptable for a local demo, but in production I would move large-file handling to object storage and keep only metadata in the app database.

## Sharing model

The sharing logic is intentionally simple:

- the owner can grant access to another seeded user
- shared users can open and edit the document
- users with access can download associated attachments
- only the owner can manage sharing

This shows clear access intent without introducing enterprise-style role systems or authentication complexity.

## What I intentionally deprioritized

- real-time collaboration
- comments
- version history
- granular permission levels
- advanced import/export
- full authentication
- deployment-specific database infrastructure

Those would all be reasonable next steps, but they were lower priority than a stable end-to-end core workflow.
