# RealReels — Full Setup Guide

Monorepo: **mobile** (React Native), **server** (NestJS API), **dashboard** (Next.js admin), **shared** (TS types).

```
/server      NestJS REST + WebSocket API   (the backend)
/dashboard   Next.js admin dashboard
/mobile      React Native (Android) app
/shared      shared TypeScript types
```

## 0. Prerequisites
- Node 20+, npm
- Android Studio + emulator (for mobile; iOS needs a Mac)
- Free accounts: **Neon** (Postgres), **Cloudinary** (media)

## 1. Install (from repo root)
```bash
npm install
npm --workspace shared run build
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

## 3. Admin dashboard
```bash
cd dashboard
# .env.local already points to http://localhost:4000/api
npm run dev              # http://localhost:3000  -> login with seeded admin
```

## 4. Mobile app (Android)
```bash
# server must be running. Emulator reaches host via 10.0.2.2 (already set in mobile/.env)
# real device: set mobile/.env API_URL to http://<PC-LAN-IP>:4000/api
cd mobile
npm start -- --reset-cache      # terminal 1: Metro
npm run android                 # terminal 2: build + install
```

## 5. End-to-end test
1. Dashboard → login as admin → **Overview** shows counts.
2. Mobile → Sign up as **Agent** → appears in dashboard **Users**.
3. Dashboard → **Verify** that agent.
4. Mobile (agent) → Profile shows "Verified" after re-login.
5. (Phase 2+) agent uploads a reel → appears in mobile Feed + dashboard **Reels**.

## What works now
- **Backend (complete):** JWT auth (access+refresh, roles user/agent/admin), profiles, properties (CRUD + filters + save), reels (feed w/ boost priority, like, comment), follow, realtime DM (Socket.IO), notifications, boosts + subscriptions (payments stubbed), Cloudinary signed uploads, admin endpoints.
- **Dashboard (complete):** login, overview stats, users (verify + role), properties & reels moderation, boosts.
- **Mobile:** auth (register/login/logout) wired to the API; 5 tabs; feed/listings/chat screens are placeholders to be filled next.

## Next (mobile feature screens)
Reels feed (react-native-video), create reel, property listings + filters, DM UI (Socket.IO client), notifications, boost/subscription UI. Backend endpoints for all of these already exist.

## Hosting (free, later)
- DB: Neon · API: Render free web service (`prisma migrate deploy` on release) · Dashboard: Vercel · Mobile: build APK locally / Play Store.

## Production payments note
Boosts & subscriptions are stubbed. Apple/Google require native IAP for digital goods (use RevenueCat); Stripe is fine for booking commissions (real-world service).
