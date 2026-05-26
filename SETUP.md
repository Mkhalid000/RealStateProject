# RealReels — Full Setup Guide

Three standalone apps — each has its own `node_modules` and runs independently (no monorepo tooling):

```
/website     Vite + React (JS) — luxury public site + admin panel
/server      NestJS REST + WebSocket API   (the backend; shared types in server/src/shared)
/mobile      React Native (Android) app
```

## 0. Prerequisites
- Node 20+, npm
- Android Studio + emulator (for mobile; iOS needs a Mac)
- Free accounts: **Neon** (Postgres), **Cloudinary** (media)

## 1. Install
Each app installs on its own:
```bash
cd server  && npm install && cd ..
cd website && npm install && cd ..
cd mobile  && npm install && cd ..
```

## 2. Backend (server)
1. **Neon:** https://neon.tech → create project → copy connection string.
2. Edit `server/.env`:
   - `DATABASE_URL` = Neon string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` = long random strings
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
3. Create tables + admin:
```bash
cd server
npx prisma migrate dev --name init
npm run db:seed          # admin@realreels.app / admin12345
npm run start:dev        # http://localhost:4000/api
```

## 3. Website (public site + admin)
```bash
cd website
# .env already points to http://localhost:4000/api
npm run dev              # http://localhost:3000
```
- Public site: `/` (home), `/properties`, `/about`, `/contact`
- Admin: click **Admin Login** (or go to `/login`) → sign in with the seeded admin → `/admin` panel (overview, users/verification, properties, reels, boosts).

## 4. Mobile app (Android)
```bash
# server must be running. Emulator reaches host via 10.0.2.2 (already set in mobile/.env)
# real device: set mobile/.env API_URL to http://<PC-LAN-IP>:4000/api
cd mobile
npm start -- --reset-cache      # terminal 1: Metro
npm run android                 # terminal 2: build + install
```

## 5. End-to-end test
1. Website `/` → luxury home loads; `/properties` lists live data from the API.
2. Website → **Admin Login** → sign in as admin → **Overview** shows counts.
3. Mobile → Sign up as **Agent** → appears in admin **Users**.
4. Admin → **Verify** that agent.
5. Mobile (agent) → Profile shows "Verified" after re-login.
6. (Phase 2+) agent uploads a reel → appears in mobile Feed + admin **Reels**.

## What works now
- **Backend (complete):** JWT auth (access+refresh, roles user/agent/admin), profiles, properties (CRUD + filters + save), reels (feed w/ boost priority, like, comment), follow, realtime DM (Socket.IO), notifications, boosts + subscriptions (payments stubbed), Cloudinary signed uploads, admin endpoints.
- **Website (complete):** luxury animated public site (Home, Properties w/ filters + live data, Property detail, About, Contact) + admin login → panel (overview stats, users verify/role, properties & reels moderation, boosts).
- **Mobile:** auth (register/login/logout) wired to the API; 5 tabs; feed/listings/chat screens are placeholders to be filled next.

## Next (mobile feature screens)
Reels feed (react-native-video), create reel, property listings + filters, DM UI (Socket.IO client), notifications, boost/subscription UI. Backend endpoints for all of these already exist.

## Hosting (free, later)
- DB: Neon · API: Render free web service (`prisma migrate deploy` on release) · Website: Vercel (SPA rewrite in `website/vercel.json`) · Mobile: build APK locally / Play Store.

## Production payments note
Boosts & subscriptions are stubbed. Apple/Google require native IAP for digital goods (use RevenueCat); Stripe is fine for booking commissions (real-world service).
