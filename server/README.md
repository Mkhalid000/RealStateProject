# RealReels — Backend (NestJS)

REST + WebSocket API. Postgres via Prisma, JWT auth, Socket.IO realtime, ImageKit uploads.

## Setup
1. **Database (Neon, free):** https://neon.tech → create project → copy connection string into `.env` `DATABASE_URL`.
2. **ImageKit:** dashboard (Developer → API Keys) se public key / private key / URL endpoint → `.env`.
3. Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

```bash
# from repo root
npm install
npm --workspace shared run build      # build shared types

cd server
npx prisma migrate dev --name init    # create tables in Neon
npm run db:seed                        # creates admin@realreels.app / admin12345
npm run start:dev                      # http://localhost:4000/api
```

## API surface (prefix `/api`)
| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Profiles | `GET /profiles/:id`, `PATCH /profiles/me` |
| Properties | `GET /properties` (filters: q, type, minPrice, maxPrice, agentId, page, limit), `GET /properties/:id`, `POST/PATCH/DELETE /properties[/:id]`, `POST/DELETE /properties/:id/save`, `GET /properties/saved/mine` |
| Reels | `GET /reels/feed`, `GET /reels/:id`, `POST/DELETE /reels[/:id]`, `POST/DELETE /reels/:id/like`, `GET/POST /reels/:id/comments`, `DELETE /reels/comments/:commentId` |
| Social | `POST/DELETE /social/follow/:agentId`, `GET /social/following`, `GET /social/:agentId/followers` |
| Chat | `GET/POST /chat/conversations`, `GET/POST /chat/conversations/:id/messages` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/read-all` |
| Billing | `GET /billing/plans`, `POST/GET /billing/boosts`, `GET/POST /billing/subscription` |
| Uploads | `GET /uploads/signature` (ImageKit client-upload auth params) |
| Admin | `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id/verify`, `/role`, `DELETE /admin/reels|properties/:id`, `GET /admin/boosts`, `POST /admin/boosts/expire` |

## Realtime (Socket.IO)
- Connect: `io('http://localhost:4000', { auth: { token: <accessToken> } })`
- Server joins each socket to room `user:<id>` → pushes `notification` events.
- `emit('conversation:join', { conversationId })` to receive live `message` events.

## Auth model
- Access token (15m) in `Authorization: Bearer`. Refresh token (30d) rotated on `/auth/refresh`, hashed in DB (revocable).
- Roles: `user`, `agent`, `admin`. Global `JwtAuthGuard` (opt out with `@Public()`) + `RolesGuard` (`@Roles()`).

## Payments
Boosts & subscriptions are **stubbed** (activate immediately, no charge). Wire Stripe (web/commission) and RevenueCat + native IAP (mobile digital goods) before production.

## Deploy (free)
- DB: Neon. API: Render free web service (`npm run build` → `npm run start:prod`, set env vars, run `prisma migrate deploy` on release).
