# Local Verification Summary

Verified locally:

- `npm test` passes with 4/4 tests green
- `GET /api/health` returns `{ "ok": true }`
- `GET /api/users` returns the seeded user list
- the root route serves the app shell

Manual smoke-test path to run in a browser:

1. start the app with `npm start`
2. open `http://localhost:3000`
3. create a document as Alex
4. type and pause to confirm autosave updates the status badge
5. format text with heading, paragraph, and list controls
6. append one of the files from `sample-files/` into the active draft
7. attach a small file to the document
8. share with Maya
9. switch user to Maya
10. open the shared document and confirm the attachment can be downloaded
