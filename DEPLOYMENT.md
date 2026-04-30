# Deployment guide

This app is deployment-ready for Railway.

## Recommended target: Railway

The app stores documents, shares, and attachments in a local JSON file. That means it needs persistent disk or volume support in production. Railway volumes support persistent storage and expose the `RAILWAY_VOLUME_MOUNT_PATH` runtime variable automatically, which this project now reads to place `db.json` on the mounted volume. Railway supports volumes on Free and Trial plans, with a default size of 0.5 GB on those plans. Railway also supports config-as-code and startup health checks, both of which are included in this repo. citeturn304492search1turn304492search0turn304492search2turn472642search1turn472642search5

## What is already included in this repo

- `railway.json` with `npm start` and health check path `/api/health`
- `Dockerfile` for a portable container build
- automatic production data-path resolution:
  - `DATA_FILE` if you set it manually
  - otherwise `RAILWAY_VOLUME_MOUNT_PATH/db.json` when a Railway volume is attached

## Before deployment

1. Push this project to a GitHub repository.
2. Create a new Railway project and add a service from that repo.
3. Attach a volume to the service and set the mount path to `/data`.
4. Railway should detect the Node app automatically. If needed, keep the start command as `npm start`.
5. Add no extra environment variables unless you want to override the data path manually.
6. Deploy and then open `/api/health` to verify the service is healthy.

## Post-deploy smoke test

1. Open the app URL.
2. Create a document as Alex.
3. Refresh to confirm persistence.
4. Share with Maya.
5. Switch to Maya and confirm access.
6. Upload an attachment and download it.
7. Restart or redeploy once, then confirm the same data is still present.

## Why not Vercel for this version

Vercel’s filesystem is not suitable for persistent writes in this app shape. Their docs recommend persisting written files to object storage instead. This app would need a storage refactor before Vercel would be a good durable target. citeturn433031search20turn433031search2

## Why not free Render for this version

Render free web services do not preserve local filesystem changes, and Render persistent disks require a paid web service. That makes Railway the cleaner fit for this exact file-based implementation. citeturn472642search2turn472642search0
