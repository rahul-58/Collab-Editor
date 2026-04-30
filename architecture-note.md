# Architecture Note

I treated this as a product slice, not a full document platform.

The assignment leaves room for a lot of possible directions, so I made an early decision to focus on one reliable workflow: a user can create a document, edit it in the browser, share it with another user, import text content from a file, attach supporting files, and come back to it later without losing work.

## What I prioritized

The most important thing for me was that the core flow actually work from start to finish.

That meant prioritizing:

- document creation and reopening
- a usable in-browser rich text editor
- persistence after refresh and restart
- a simple but real sharing model
- file handling that fits the document workflow
- enough validation and tests to make the app feel stable

I spent less time on breadth and more time on making those pieces hang together.

## Frontend

The frontend is a small single-page app built with plain HTML, CSS, and JavaScript. I kept it this way to reduce setup overhead and make the logic easy to follow in a take-home setting.

The UI has two main states:

- dashboard
- document editor

The dashboard separates owned documents from shared documents, which makes the sharing model obvious right away.

The editor supports the formatting needed for the assignment:
- bold
- italic
- underline
- headings
- bulleted lists
- numbered lists
- paragraph reset

I also added autosave because it improves the editor experience a lot for relatively little complexity.

## Backend

The backend is an Express server with a small set of REST endpoints for:

- listing users
- creating and updating documents
- sharing documents
- importing files
- uploading attachments
- downloading attachments
- health checks

The access model is intentionally simple:
- every document has one owner
- owners can share with another seeded user
- shared users can open and edit the document
- only the owner can manage sharing

That was enough to demonstrate document ownership and access control without getting stuck in full auth and role management.

## Persistence

I used a file-based store for this version.

That choice was mostly about time and reliability. It let me keep the project easy to run locally while still preserving:
- documents
- formatted content
- sharing relationships
- attachments

For a take-home project, this felt like the right tradeoff. It is simple, visible, and easy to reason about. The downside is that deployment needs persistent disk or a mounted volume, which is why the deployment notes target Railway rather than a purely serverless host.

## File handling choices

I supported `.txt` and `.md` for document import.

That was deliberate. These are easy to parse cleanly and let me demonstrate the workflow without spending time on messy `.docx` conversion or third-party document parsing.

I handled file upload in two ways:
- import into a new document
- import into an existing draft

I also added document attachments because that is a realistic part of a shared writing workflow and fits the prompt well.

## What I left out

I intentionally did not build:
- real-time collaboration
- live cursors
- comments
- suggestion mode
- version history
- export
- full login/authentication
- role-based permission levels beyond basic shared access

All of those are reasonable next steps, but they were not necessary to show the core product and engineering decisions in the time available.

## If I had another few hours

The next things I would add are:

1. a more robust editor implementation
2. better mobile layout for the editor
3. stronger attachment handling and previews
4. cleaner document activity metadata
5. either proper auth or a slightly clearer seeded-user switcher
6. a richer test suite around editor save and permission edge cases

## Summary

The main tradeoff in this project was depth over breadth.

I chose a smaller surface area and tried to make the core behavior feel complete:
create, edit, save, import, attach, share, reopen.
