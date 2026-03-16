# Traffic Management Platform — Frontend

React frontend for the **Traffic Management Platform**. It provides a UI with mock Auth0-style login, dashboard with map, traffic signal configuration, search parameters (date/time ranges), traffic light configuration, Near-Miss tables, and optional real-time WebSocket updates. Data can be persisted in **Firebase Firestore** or in the browser’s **localStorage** when Firebase is not configured.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database (Firebase Firestore)](#database-firebase-firestore)
- [Running the app](#running-the-app)
- [Scripts](#scripts)
- [Architecture overview](#architecture-overview)
- [Docker](#docker)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS) — [nodejs.org](https://nodejs.org/)
- **npm** (included with Node.js)

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with **qa@test.com** / **test1234**. The app works with mock data when the backend API is unavailable and uses **localStorage** for persistence when Firebase is not configured.

---

## Installation

1. Clone or unzip the project into a folder (e.g. `traffic-management-frontend`).
2. Open a terminal in that folder.
3. Install dependencies:

```bash
npm install
```

4. (Optional) Copy the environment template and add your keys:

```bash
cp .env.example .env
```

Then edit `.env` with your Firebase (and optionally Google Maps) values. See [Configuration](#configuration) and [Database](#database-firebase-firestore) below.

---

## Configuration

Configuration is done via environment variables. Copy `.env.example` to `.env` and fill in the values you need.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | For DB | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | For DB | Firebase auth domain (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | For DB | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | For DB | Firebase storage bucket (e.g. `your-project.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For DB | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | For DB | Firebase Web app ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps API key for the dashboard map (a default key is used if unset) |

Without Firebase variables, the app runs normally but persists **cycle drafts**, **traffic light configuration**, **search parameters (dates)**, and **Near-Miss** data in **localStorage** only.

---

## Database (Firebase Firestore)

The app can persist the following in **Firebase Firestore**:

- Signal configuration (cycle seconds)
- Traffic light configuration (green / yellow / red per leg)
- Search parameters (Time range and Compare to date/time ranges)
- Near-Miss Events by leg data

If Firebase is not configured, all of the above fall back to **localStorage** (and static/mock data where applicable).

### Setting up Firebase Firestore

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project or use an existing one.

2. **Enable Firestore**
   - In the project: **Build → Firestore Database**.
   - Click **Create database** and choose **Start in test mode** (or configure your own security rules).

3. **Get your Web app config**
   - Go to **Project settings** (gear icon) → **Your apps**.
   - Add a **Web app** if you do not have one.
   - Copy the `firebaseConfig` fields: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

4. **Configure the frontend**
   - In the project root, ensure you have a `.env` file (e.g. `cp .env.example .env`).
   - Set the variables as in [Configuration](#configuration):
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
     ```
   - Restart the dev server after changing `.env` (`npm run dev`).

### Firestore collections

| Collection | Description |
|------------|-------------|
| `signalConfig` | Cycle seconds and signal metadata per signal ID. |
| `trafficLightConfig` | Green / yellow / red durations per traffic light (N/S/E/W legs) per signal. |
| `searchParams` | Time range and Compare to date/time ranges (ISO strings) per signal. |
| `nearMissByLeg` | Near-Miss Events by leg table data per signal. |

Documents are keyed by **signal ID** (e.g. `"1"` for `/signals/1`).

---

## Running the app

**Development (with hot reload):**

```bash
npm run dev
```

- App: **http://localhost:3000**
- Login: **qa@test.com** / **test1234** (or **admin@traffic.local** / **admin1234**).

**Production build:**

```bash
npm run build
npm run preview
```

The backend API and WebSocket are optional. The app proxies `/api` and `/ws` to **http://localhost:8000** in development. If nothing is running on port 8000, the app uses mock data for signals and alerts.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (default port 3000). |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run TypeScript check (`tsc --noEmit`). |

---

## Architecture overview

- **Stack:** React 18, TypeScript, Vite 5, React Router 6.
- **Auth:** Mock Auth0 — in-memory login; JWT stored in `sessionStorage` as `traffic_auth_token`.
- **API:** REST under `/api/*` (proxied to backend in dev). Used for signals and alerts when the backend is available.
- **WebSocket:** Optional connection to `/ws/device-status/?token=...` for real-time device status.
- **Persistence:** Firebase Firestore when configured; otherwise **localStorage** for signal config, traffic light config, search params, and Near-Miss data.

### Main flows

1. **Login** → `/login` → redirect to dashboard.
2. **Dashboard** → User, WebSocket status, signals list, alerts, map (Google Maps with markers).
3. **Signals list** → `/signals` → links to signal detail.
4. **Signal detail** → `/signals/:id` → image, Search parameters (date/time), Cycle (seconds), Traffic light configuration, Near-Miss tables, PDF/CSV export. All persisted to Firestore or localStorage as per configuration.

---

## Docker

**Development (Vite, hot reload):**

```bash
docker-compose -f docker-compose.dev.yml up
```

**Production-style (nginx):**

```bash
docker build -t traffic-frontend .
docker run -p 3000:80 traffic-frontend
```

For a full stack, add the backend service and point the frontend proxy to it (see `vite.config.js` and `nginx.conf`).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Port 3000 in use | Change `server.port` in `vite.config.js` (e.g. to `3001`). |
| Firebase not saving | Ensure all `VITE_FIREBASE_*` variables are set in `.env` and restart `npm run dev`. |
| Map not loading | Check the browser console; set `VITE_GOOGLE_MAPS_API_KEY` in `.env` if needed. |
| API/WebSocket errors | The app works without a backend; it will use mock data and localStorage. |

---

For step-by-step install and run instructions (including database), see **INSTALL.md**.
