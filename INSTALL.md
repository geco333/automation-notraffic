# Traffic Management Frontend — Install & Run

Instructions to install, configure, and run the project (including database setup).

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS) — [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)

---

## 1. Install the project

1. Unzip the project (if you received a zip file) into a folder, e.g. `traffic-management-frontend`.
2. Open a terminal in that folder.
3. Install dependencies:

```bash
npm install
```

This will create the `node_modules` folder. Do not commit it; it is excluded from the zip.

---

## 2. Run the project

Start the development server:

```bash
npm run dev
```

- The app will be available at **http://localhost:3000**
- Open that URL in your browser to use the app.

Other commands:

- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`
- **Type-check:** `npm run lint`

---

## 3. Database (Firebase Firestore)

The app can persist **signal configuration**, **traffic light configuration**, and **Near-Miss data** in Firebase Firestore. Without Firebase, it uses **localStorage** and static/mock data.

### Option A: Use the app without a database

You can run the app as-is. It will:

- Use mock data for the dashboard (signals, alerts) if the backend API is not available.
- Save cycle drafts and traffic light configuration in the browser’s **localStorage**.

No extra setup is required.

### Option B: Use Firebase Firestore

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project (or use an existing one).

2. **Enable Firestore**
   - In the project, go to **Build → Firestore Database**.
   - Click **Create database** and choose **Start in test mode** (or set your own rules).

3. **Get your app config**
   - Go to **Project settings** (gear icon) → **Your apps**.
   - Add a **Web app** if you haven’t already.
   - Copy the **firebaseConfig** object (apiKey, authDomain, projectId, etc.).

4. **Create a `.env` file in the project root**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and fill in your Firebase values:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
     ```
   - Restart the dev server after changing `.env`.

5. **Collections used**
   - `signalConfig` — cycle seconds and signal metadata per signal.
   - `trafficLightConfig` — green/yellow/red durations per traffic light (per signal).
   - `nearMissByLeg` — Near-Miss Events by leg data per signal.

---

## 4. Optional: Backend API and Google Maps

- **Backend API**  
  The app proxies `/api` and `/ws` to **http://localhost:8000**. If you have a backend running on port 8000, it will be used for signals and alerts. Otherwise, the app uses mock data.

- **Google Maps (Dashboard)**  
  The dashboard uses a default Google Maps key for the map. To use your own key, add to `.env`:
  ```
  VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
  ```

---

## 5. Quick reference

| Step              | Command / Action                    |
|-------------------|-------------------------------------|
| Install           | `npm install`                       |
| Run dev server    | `npm run dev` → http://localhost:3000 |
| Copy env template | `cp .env.example .env`              |
| Configure DB      | Edit `.env` with Firebase config   |

---

## 6. Troubleshooting

- **Port 3000 in use**  
  Change the port in `vite.config.js` (e.g. `server.port: 3001`).

- **Firebase not saving**  
  Ensure `.env` has all `VITE_FIREBASE_*` variables and you restarted `npm run dev` after editing `.env`.

- **Map not loading**  
  Check the browser console; if needed, set `VITE_GOOGLE_MAPS_API_KEY` in `.env`.
