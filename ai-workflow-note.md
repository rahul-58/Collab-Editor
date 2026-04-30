# AI Workflow Note

## AI tools used

- ChatGPT for scoping, architecture tradeoffs, API shape, UI wording, and implementation drafting

## Where AI materially sped up the work

AI was most useful for:

- narrowing the assignment into a realistic product slice
- drafting the storage and API responsibilities before coding
- accelerating repetitive implementation work such as validation branches, autosave state handling, and documentation structure
- reviewing whether the end-to-end demo flow clearly matched the prompt

## What I changed or rejected

I rejected broader AI-suggested stacks that added avoidable complexity for the timebox, including frameworks and editors that would have increased setup, dependency, or deployment risk.

I also avoided overbuilding permissions, auth, and file parsing. In several places I simplified generated ideas into smaller, more defensible flows:

- seeded users instead of full auth
- file-based persistence instead of premature database setup
- `.txt` and `.md` import only instead of partial `.docx` support
- append-based import into an existing draft instead of cursor-position import logic
- simple owner-managed sharing instead of multi-role access control
- small-file attachment storage in the app store instead of object storage infrastructure

I also corrected generated/editor-draft behavior when the paragraph control inside lists did not match user expectations, and I tightened the autosave approach so it reused the same permission-checked save path as manual saves.

## How I verified correctness and quality

I verified the implementation by:

- running automated tests for sharing, import, draft import, and attachment-access flows
- exercising the main product path manually: create, edit, autosave, refresh, import, attach, share, switch user, reopen, and download
- checking access control cases such as non-owner sharing attempts and unauthorized attachment downloads
- confirming unsupported upload validation in the UI and API
- keeping the architecture small enough that the main flows are easy to inspect end to end

## Reliability note

Any AI-generated draft output was treated as a starting point, not the source of truth. Final structure, scope cuts, validation choices, and API behavior were kept intentionally simple so the resulting product is easier to reason about and test.
