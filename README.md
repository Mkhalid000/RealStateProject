# RealReels — Monorepo

Real estate app: Instagram-style property reels + listings, with agent tools and an admin dashboard.

## Structure
```
/mobile      React Native (CLI) app — buyers & agents
/server      NestJS REST + WebSocket API (the backend)
/dashboard   Next.js admin dashboard
/shared      Shared TypeScript types, enums & DTOs
```

## Tech
- **Backend:** NestJS + Prisma + PostgreSQL (Neon free), JWT auth, Socket.IO, Cloudinary
- **Dashboard:** Next.js (Vercel free)
- **Mobile:** React Native CLI + React Navigation + React Query
- **Shared:** one TypeScript types package across all three

## Quick start
Each package has its own README/setup. Typical dev flow:
```
# backend
cd server && npm install && npm run start:dev

# dashboard
cd dashboard && npm install && npm run dev

# mobile (Android)
cd mobile && npm install && npm start
# new terminal: cd mobile && npm run android
```

See `server/README.md` and `SETUP.md` for environment variables and hosting (Neon, Render, Vercel, Cloudinary).
