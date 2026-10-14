# NaPack --- Personal PWA

A personal Progressive Web Application built with **React, TypeScript,
Vite, Node.js, and Express**. The project uses Docker and Docker Compose
so the Node.js runtime and project dependencies run in containers rather
than being installed directly on the Mac.

## Contents

-   [Prerequisites](#prerequisites)
-   [Project structure](#project-structure)
-   [Start local development](#start-local-development)
-   [Open the app](#open-the-app)
-   [Run the production preview and test PWA
    features](#run-the-production-preview-and-test-pwa-features)
-   [Useful Docker commands](#useful-docker-commands)
-   [Troubleshooting](#troubleshooting)
-   [Development notes](#development-notes)

## Prerequisites

Install these applications on your Mac:

-   [Docker Desktop for
    Mac](https://www.docker.com/products/docker-desktop/) --- use the
    Apple Silicon version for a MacBook with an M-series chip.
-   [Visual Studio Code](https://code.visualstudio.com/).
-   The Microsoft **Dev Containers** extension for VS Code.

Start Docker Desktop before running Docker commands.

**You do not need to install Node.js or npm on macOS.** They are
provided by the project's Docker image.

## Project structure

``` text
NaPack/
├── .devcontainer/
│   ├── Dockerfile
│   └── devcontainer.json
├── frontend/
│   ├── public/
│   │   ├── pwa-192x192.png
│   │   └── pwa-512x512.png
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── compose.yaml
```

Some generated files and folders, such as `dist/` and `node_modules`,
are omitted from this overview.

## Start local development

### 1. Open the project

Open the `NaPack` folder in VS Code.

If you use the Mac Terminal, change to the project directory first. For
example:

``` bash
cd ~/Projects/NaPack
code .
```

Adjust the path if the project is stored somewhere else.

### 2. Open the Dev Container

In VS Code:

1.  Press `Cmd + Shift + P`.
2.  Select **Dev Containers: Reopen in Container**.
3.  Wait for the container to build and VS Code to connect.

Use the **VS Code integrated terminal connected to the Dev Container**
for Node.js and npm commands.

Verify the environment:

``` bash
pwd
node --version
npm --version
```

The workspace should be `/workspace`, and Node.js should report version
22.x.

### 3. Start the frontend and backend

Open the **Mac Terminal** (outside the Dev Container), go to the project
root, and run:

``` bash
docker compose up --build frontend backend
```

Keep this terminal open to see application logs. To run the services in
the background instead, use:

``` bash
docker compose up -d --build frontend backend
```

The Compose services install dependencies in Docker-managed named
volumes and start the development servers.

### 4. Open the app

-   **Frontend:** http://localhost:5173
-   **Backend health endpoint:** http://localhost:3000/api/health

The health endpoint should return JSON similar to:

``` json
{
  "status": "healthy",
  "timestamp": "2026-10-13T08:00:00.000Z"
}
```

The timestamp will differ. The frontend sends `/api/health` requests
through Vite's proxy to the backend service.

### 5. Stop local development

If Compose is running in the foreground, press `Ctrl + C`.

If you started it in the background, run this from the project root in
the Mac Terminal:

``` bash
docker compose down
```

This stops and removes the project containers but preserves the named
dependency volumes.

## Run the production preview and test PWA features

The development server on port `5173` is for coding. To test the built
frontend and its generated service worker, use Vite's preview server.

### 1. Build the frontend

Run in the **VS Code Dev Container terminal**:

``` bash
cd /workspace/frontend
npm run build
```

Resolve any build errors before continuing.

### 2. Start the preview server

If the normal frontend service is running, the Compose configuration may
already reserve host port `4173` because it maps `4173:4173`. To avoid a
port conflict, publish the temporary preview container on host port
`4174` instead:

``` bash
docker compose run --rm --no-deps \
  -p 4174:4173 \
  frontend npm run preview -- --host 0.0.0.0 --port 4173
```

Run this command from the **Mac Terminal**, in the project root. Keep
the terminal open while testing.

Open:

-   **Production preview:** http://localhost:4174

If port `4174` is also in use, choose another free host port and map it
to container port `4173`, for example `-p 4175:4173`.

### 3. Verify PWA features in Chrome

Open the preview URL, then press `Cmd + Option + I` to open DevTools.

Check:

-   **Application → Manifest:** verify the app name, display mode, and
    icons.
-   **Application → Service Workers:** verify that the service worker is
    registered.
-   **Network:** test offline behavior after loading the app once.

The configured manifest expects these real PNG files:

``` text
frontend/public/pwa-192x192.png
frontend/public/pwa-512x512.png
```

A successful page load alone does not confirm that the app is
installable or works offline. Offline caching covers eligible
application assets; the Node.js API will still be unavailable when the
backend cannot be reached. Browser install prompts and PWA capabilities
vary by browser.

To stop the preview, press `Ctrl + C` in the terminal running it.

## Useful Docker commands

Run these commands from the **Mac Terminal**, in the directory
containing `compose.yaml`.

  ----------------------------------------------------------------------------------
  Task                                Command
  ----------------------------------- ----------------------------------------------
  Start frontend and backend          `docker compose up frontend backend`

  Build and start services            `docker compose up --build frontend backend`

  Start services in background        `docker compose up -d frontend backend`

  List Compose services               `docker compose ps`

  Follow service logs                 `docker compose logs -f frontend backend`

  View frontend logs                  `docker compose logs -f frontend`

  View backend logs                   `docker compose logs -f backend`

  Stop services                       `docker compose down`

  Rebuild after Dockerfile changes    `docker compose up --build frontend backend`
  ----------------------------------------------------------------------------------

Run these commands in the **VS Code Dev Container terminal** for
frontend and backend tasks:

``` bash
# Frontend
cd /workspace/frontend
npm run build

# Backend
cd /workspace/backend
npm run build
```

Do not use `docker compose down -v` unless you intentionally want to
delete the named dependency volumes too.

## Troubleshooting

### `docker: command not found`

You are likely running a Docker command inside the Dev Container. Run
Docker Compose commands from the **Mac Terminal**, with Docker Desktop
running. Use the Dev Container terminal for npm and application
development commands.

### `port is already allocated`

Another container or process is using the requested host port.

Check running containers:

``` bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Check a particular port on macOS, for example `4173`:

``` bash
lsof -nP -iTCP:4173 -sTCP:LISTEN
```

Stop only the container or process you have identified as safe to stop.
If the development frontend is running and publishing `4173:4173`, use
the preview command above with host port `4174`.

### The frontend loads but shows `API unavailable`

Check the backend logs:

``` bash
docker compose logs -f backend
```

Verify the backend health endpoint from the Mac Terminal:

``` bash
curl http://localhost:3000/api/health
```

Confirm the Vite proxy in `frontend/vite.config.ts` targets
`http://backend:3000` and that both services are on the same Compose
project network.

### PWA manifest or service worker is missing

1.  Build the frontend again with `npm run build` from
    `/workspace/frontend`.
2.  Start the preview server and open the preview URL, not just the
    development URL.
3.  Inspect Chrome DevTools **Application → Manifest** and **Application
    → Service Workers**.
4.  Check that both manifest icon files exist and are valid PNGs.
5.  Review the browser Console and preview-server output for errors.

## Development notes

-   Source code is stored in the project folder on the Mac and mounted
    into containers.
-   `frontend_node_modules` and `backend_node_modules` are
    Docker-managed named volumes.
-   Frontend development uses Vite on port `5173`; the Express API
    listens on port `3000`.
-   The Vite proxy forwards `/api` requests to the backend container.
-   The preview server serves the built frontend and is intended for
    local verification, not production hosting.
-   Before deploying, configure production serving, HTTPS, environment
    variables, logging, error handling, and appropriate CORS/security
    policies.

## Deploy NaPack for free with Firebase Hosting

NaPack can be hosted as a static PWA on Firebase Hosting's Spark (no-cost) plan. The production frontend does not require the Express health-check backend. The scheduled trip reminders continue to run in GitHub Actions.

### One-time Firebase setup

1. In Firebase Console, select the existing project used by NaPack. Keep the project on the **Spark plan**; do not upgrade to Blaze or attach billing.
2. In **Authentication → Sign-in method**, enable **Anonymous** sign-in.
3. Ensure **Cloud Firestore** is created and **Cloud Messaging** is enabled for the project.
4. In **Project settings → Cloud Messaging**, obtain the Web Push certificate key pair (VAPID public key). Use that public key for `VITE_FIREBASE_VAPID_KEY`.
5. Review `firestore.rules`. These rules allow signed-in users to read and write only within their own `users/{uid}/...` path and deny all other client access.

### GitHub repository secrets

Add these under **Repository → Settings → Secrets and variables → Actions → New repository secret**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

The first seven values are the web app configuration from Firebase Console. `FIREBASE_SERVICE_ACCOUNT_JSON` must be the full JSON contents of a service-account key authorized to deploy Firebase Hosting/Firestore rules and to send FCM messages. Store it only in GitHub Secrets; never commit the JSON key file. Keep the project on Spark and do not enable paid services.

### Deploy

1. Commit and push the project to the repository's `main` branch.
2. Open the repository's **Actions** tab and select **Deploy NaPack to Firebase Hosting**.
3. Choose **Run workflow** if you want to deploy manually, then wait for the build and deploy jobs to finish.
4. Open the `web.app` URL printed by Firebase CLI. Use HTTPS for push notifications.

The workflow runs `npm ci` and `npm run build` before deployment. It deploys the hosting output and Firestore rules together. If the build fails, the workflow stops before deployment.

### Test on a phone

- Open the HTTPS `web.app` URL on the phone.
- On iPhone/iPad, use iOS/iPadOS 16.4 or later and add NaPack to the Home Screen before enabling web push notifications.
- Enable notifications from inside NaPack after installing/opening it as appropriate for the browser.
- In GitHub Actions, run **Test NaPack Push Notification** manually to test FCM delivery.
- The daily reminder workflow runs at 00:00 UTC (08:00 Philippines time). It sends reminders for active trips departing the following day.

A successful GitHub Actions run means FCM accepted the message, not a guarantee that every device displayed it. Confirm delivery on the target phone. GitHub-hosted Actions has usage limits and scheduled workflows can be delayed; it is not a guaranteed real-time notification service.

### Local environment

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the Firebase web-app values for local development. `.env.local` is intentionally excluded from the deployment package and should remain untracked.
