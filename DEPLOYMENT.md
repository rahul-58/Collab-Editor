# Deployment Notes

## Current Deployment

Collab Editor is deployed on Railway and connected to the GitHub repository.

**Live Application:** https://collab-editor-production-9cf3.up.railway.app/

**GitHub Repository:** https://github.com/rahul-58/Collab-Editor

The application uses Docker for deployment and a Railway persistent volume mounted at `/data`.

Documents, sharing information, and attachments are stored on the persistent volume so they remain available after application restarts and redeployments.

## Deployment Setup

I followed these steps to deploy the application:

1. Pushed the source code to GitHub.
2. Created a Railway project connected to the repository.
3. Configured the application using the existing Dockerfile and Railway configuration.
4. Attached a persistent volume mounted at `/data`.
5. Generated a public Railway domain.
6. Configured `/api/health` as the health check endpoint.
7. Deployed and tested the application.

## Health Check

The application exposes a health check endpoint:

https://collab-editor-production-9cf3.up.railway.app/api/health

A successful response indicates that the application server is running.

## Production Verification

I used the following checks to test the deployed application:

1. Open the application using the public Railway URL.
2. Create a document and rename it.
3. Apply rich-text formatting.
4. Confirm autosave preserves changes after refresh.
5. Share a document with another seeded user.
6. Switch users and open the shared document.
7. Import a `.txt` or `.md` file.
8. Upload and download a document attachment.
9. Confirm documents remain available after refresh.

## Why Railway

The application uses file-based persistence, so it needs storage that survives container restarts.

Railway provides persistent volumes, allowing me to deploy the application without adding a separate database.

This approach works well for a small project. For a larger application, I would move document metadata to PostgreSQL and attachments to object storage.