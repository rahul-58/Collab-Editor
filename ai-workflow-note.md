# AI Workflow Note

## AI tools used

- ChatGPT for scoping, architecture tradeoffs, API shape, UI wording and implementation drafting

## Where AI materially sped up the work

AI was most useful for:

- narrowing the assignment into a realistic product slice
- drafting the storage and API responsibilities before coding
- accelerating repetitive implementation work such as validation branches, autosave state handling and documentation structure
- reviewing whether the end-to-end demo flow clearly matched the project instructions

## What I changed or rejected

I rejected broader AI-suggested stacks that added avoidable complexity for the timebox, including frameworks and editors that would have increased setup, dependency, or deployment risk.

I avoided adding unnecessary complexity, especially around authentication, database infrastructure, and advanced file parsing.

Some of the decisions I made were:

- Using seeded users instead of building a full authentication system
- Using file-based persistence instead of introducing a database
- Limiting document imports to `.txt` and `.md` instead of adding partial `.docx` support
- Supporting imports into existing drafts without building a complex document conversion system
- Implementing basic owner-managed sharing instead of advanced role-based permissions
- Keeping attachment storage simple rather than introducing an external object storage service

During testing, I also made changes based on actual UI behavior. I fixed the paragraph control inside lists, added autosave, improved toolbar highlighting, and adjusted the light and dark themes for better consistency.

I treated AI-generated suggestions as starting points and kept the final implementation focused on what I could test and explain.

## How I verified correctness and quality

I verified the implementation by:

- running automated tests for sharing, import, draft import and attachment-access flows
- verifying the main product path manually: create, edit, autosave, refresh, import, attach, share, switch user, reopen and download
- checking access control cases such as non-owner sharing attempts and unauthorized attachment downloads
- confirming unsupported upload validation in the UI and API
- keeping the architecture small enough that the main flows are easy to inspect end to end

## Reliability note

Any AI-generated draft output was treated as a starting point, not the source of truth. Final structure, scope cuts, validation choices and API behavior were kept intentionally simple so the resulting product is easier to reason about and test.
