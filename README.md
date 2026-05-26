# RealReels — Real Estate Platform

A luxury public website + admin panel, a NestJS backend, and an Instagram-style reels mobile app.

## Structure (each folder is fully standalone)
```
/website     Vite + React (JS) — public luxury site + admin login/panel
/server      NestJS REST + WebSocket API (the backend)  — shared types live in server/src/shared
/mobile      React Native (CLI, JS) app — buyers & agents
```
No monorepo tooling — `website`, `server`, and `mobile` each have their own `node_modules` and are installed/run independently.

## Tech
- **Website:** Vite + React + React Router + Framer Motion (JavaScript/.jsx), luxury animated UI + admin dashboard. Deploy on Vercel (free).
- **Backend:** NestJS + Prisma + PostgreSQL (Neon free), JWT auth, Socket.IO, Cloudinary.
- **Mobile:** React Native CLI + React Navigation + React Query (JavaScript/.jsx).

## Quick start
```
# backend  (set server/.env first — see SETUP.md)
cd server && npm install && npm run start:dev      # http://localhost:4000/api

# website  (public site + admin)
cd website && npm install && npm run dev           # http://localhost:3000

# mobile (Android)
cd mobile && npm install && npm start              # then: npm run android
```

See `server/README.md` and `SETUP.md` for environment variables and hosting (Neon, Render, Vercel, Cloudinary).
