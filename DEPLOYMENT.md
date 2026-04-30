# Deployment Notes

This app uses file-based persistence, so it should be deployed on a host that supports persistent storage.

I prepared it for Railway because that is a straightforward fit for a small app that needs a mounted volume.

## Recommended deployment target

Railway with a persistent volume mounted at `/data`

## High-level steps

1. Push the repository to GitHub
2. Create a new Railway project from the repo
3. Attach a persistent volume
4. Mount the volume at `/data`
5. Deploy the service
6. Verify the app and health endpoint

## Health check

After deployment, open:

`/api/health`

## Post-deploy smoke test

1. Open the app
2. Create a document
3. Add formatting
4. Refresh
5. Share with another seeded user
6. Open as the other user
7. Import a `.txt` or `.md` file
8. Upload an attachment
9. Confirm the data is still there after another refresh

## Why Railway

This version writes to local storage on disk. That is simple for local development, but it means serverless-only platforms are not a good fit unless the storage layer is changed first.
