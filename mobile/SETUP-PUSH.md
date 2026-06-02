# Push Notifications (Firebase Cloud Messaging) — Setup

In-app notifications already work over REST. This adds **tray/push** notifications
(when the app is in background or closed) via Firebase Cloud Messaging (Android).

Two notification types are wired on the backend:

- **Property status** — when a user/agent posts a property (`pending`), and when an
  admin approves (`verified`) / rejects (`rejected`) it.
- **New reel** — when an agent the user follows posts a reel.

Everything is already coded. You only need to do the Firebase steps below and run
the install + rebuild.

---

## 1. Create a Firebase project (Firebase Console)

1. Go to https://console.firebase.google.com → **Add project** → name it
   (e.g. `aurevia`). Disable Analytics (not needed). Create.

## 2. Add an Android app

1. In the project → **Add app → Android**.
2. **Android package name** must match the app exactly: `com.realstate`
   (from `mobile/android/app/src/main/AndroidManifest.xml`).
3. App nickname: anything. Skip the SHA‑1 (not needed for FCM).
4. **Download `google-services.json`** and place it at:

   ```
   mobile/android/app/google-services.json
   ```

## 3. Download the service-account key (for the backend to send push)

1. Firebase Console → ⚙ **Project settings → Service accounts**.
2. **Generate new private key** → downloads a JSON file.
3. Open the JSON, copy its **entire contents** onto one line, and add it to the
   **server** `.env` as `FIREBASE_SERVICE_ACCOUNT` (single‑quoted):

   ```
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"…", … }'
   ```

   Restart the server. On boot it should log `Firebase push initialised.`
   (If the var is missing it logs `push disabled` and the app still works — just no tray push.)

---

## 4. Run the DB migration (server)

The schema gained a `DeviceToken` table + a `property_status` notification type.

```bash
cd server
npx prisma migrate dev --name add_device_tokens_and_property_status
# (or, against an existing prod DB:  npx prisma migrate deploy)
npx prisma generate
```

---

## 5. Install the mobile libraries

```bash
cd mobile
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Android Gradle config

**`mobile/android/build.gradle`** — add the Google services classpath:

```gradle
buildscript {
  dependencies {
    // …existing…
    classpath("com.google.gms:google-services:4.4.2")
  }
}
```

**`mobile/android/app/build.gradle`** — apply the plugin near the top, just
under the other `apply plugin` lines:

```gradle
apply plugin: "com.android.application"
apply plugin: "com.google.gms.google-services"   // ← add this
```

---

## 6. Wire it into the app

**`mobile/index.js`** — register the background handler **before** `AppRegistry`
(top of file, after imports):

```js
import messaging from '@react-native-firebase/messaging';

// Background/quit: the OS shows the tray notification automatically because the
// server sends a `notification` payload. This handler just needs to exist.
messaging().setBackgroundMessageHandler(async () => {});
```

**`mobile/App.jsx`** — start push once the user is signed in. Inside the `App`
component add:

```js
import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {setupPush} from './src/lib/push';
import {useAuthStore} from './src/store/authStore';

// …inside App(), with access to queryClient + user:
const user = useAuthStore(s => s.user);
useEffect(() => {
  if (!user) return;
  let cleanup = () => {};
  setupPush(() =>
    queryClient.invalidateQueries({queryKey: ['notifications']}),
  ).then(fn => (cleanup = fn));
  return () => cleanup();
}, [user]);
```

> The helper `mobile/src/lib/push.js` requests permission, gets the FCM token,
> registers it with the backend (`POST /notifications/device-token`), and
> refreshes the in-app list on foreground messages.

(Optional) On logout, call `teardownPush()` from `src/lib/push.js` before
clearing the session so the device stops receiving that user's pushes.

---

## 7. Rebuild

A native module was added, so a Metro reload is **not** enough — rebuild:

```bash
cd mobile
npx react-native run-android
```

---

## Test checklist

- Post a property → you get a **"Listing submitted"** notification (tray if app
  backgrounded; in the bell list either way).
- Admin approves it (dashboard) → **"Listing approved"** push.
- An agent you follow posts a reel → **"New reel posted"** push.
- Tap a tray notification → app opens; property notifications deep-link to the
  listing.
