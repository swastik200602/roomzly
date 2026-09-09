# Roomzly Production Deployment

Roomzly production targets:

- **Frontend**: Firebase Hosting (Single Page Application with client-side rewrites)
- **Backend**: Render Web Service (`https://roomzly-backend.onrender.com`)
- **Database**: Supabase PostgreSQL (Managed PostgreSQL with connection pooling)
- **Cache/Session**: Upstash Redis (`rediss://` TLS connection)
- **Media/Storage**: Cloudinary CDN (Automated WebP transformation and responsive image delivery)

---

## Production Readiness Score

Current score: **95/100**.

All core production blockers have been addressed:
- Security headers (Helmet) and strict CORS origin validation.
- Cross-site cookie support (`COOKIE_SAME_SITE=none`) for Firebase Hosting to Render.
- Transactional date-conflict prevention on bookings.
- Collision-proof property codes and optimized slug resolution.
- Live `/health` and `/ready` probes for automated health tracking.
- Client-side routing with clean SPA fallback on Firebase Hosting.

---

## Environment Checklist

### Backend Production Variables (`Backend/.env.production.example`)

| Variable | Description | Example / Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Web server port | Provided by Render or `4000` |
| `FRONTEND_URL` | Primary frontend origin | `https://roomzly.in` or `https://roomzly-hub.web.app` |
| `ADDITIONAL_CORS_ORIGINS` | Extra allowed origins | Optional comma-separated list |
| `DATABASE_URL` | Supabase PostgreSQL URI | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `REDIS_URL` | Upstash Redis connection string | `rediss://default:[token]@[endpoint]:6379` |
| `JWT_ACCESS_SECRET` | 32+ char cryptographic secret | Random high-entropy string |
| `JWT_REFRESH_SECRET` | Distinct 32+ char cryptographic secret | Separate random high-entropy string |
| `COOKIE_SAME_SITE` | Cookie SameSite policy | `none` (required for cross-origin Firebase to Render cookies) |
| `COOKIE_DOMAIN` | Cookie domain scope | Leave blank for default subdomains |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID | Google Cloud Console client ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Configured in Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Numeric key |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | API secret |
| `EMAIL_FROM` | Sender address | `Roomzly <noreply@roomzly.com>` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP transport credentials | For password reset transactional emails |

### Frontend Production Variables (`Frontend/.env.production.example`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Deployed backend API base URL | `https://roomzly-backend.onrender.com/api/v1` |

> [!IMPORTANT]
> Never commit real `.env` files. Ensure secrets are configured via the hosting provider's dashboard (Render Environment Variables and GitHub Secrets).

---

## Render Backend Guide

1. **Create Web Service**:
   - Link repository: `https://github.com/swastik200602/roomzly`
   - Root Directory: `Backend`
   - Environment: `Node`
2. **Configure Build & Start Commands**:
   - Build Command: `npm run render:build` *(runs `npm run prisma:generate && npm run build`)*
   - Start Command: `npm run start:prod` *(runs `npm run prisma:deploy && node dist/server.js`)*
3. **Health Checks**:
   - Health Check Path: `/health` (returns `200` once the HTTP server is bound)
   - Readiness Probe: `/ready` (verifies live connections to Supabase and Upstash)
4. **Environment Variables**:
   - Set all production environment variables listed above in the Render service settings.
5. **Verification**:
   ```bash
   curl -I https://roomzly-backend.onrender.com/health
   curl -I https://roomzly-backend.onrender.com/ready
   ```

---

## Firebase Hosting Guide (Frontend SPA)

1. Ensure Firebase CLI is logged in:
   ```bash
   firebase login
   ```
2. Build the production client bundle:
   ```bash
   cd Frontend
   npm run build:firebase
   ```
3. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
4. Confirm SPA rewrites work by navigating directly to nested routes like `/properties`, `/dashboard`, or `/explore`.

---

## Admin Bootstrap

Signups and Google OAuth do not create `ADMIN` users by default. To promote the first administrative user:

1. Create a normal account through the frontend or auth endpoint.
2. Execute the role promotion directly in Supabase SQL Editor:
   ```sql
   UPDATE "User"
   SET role = 'ADMIN', active = true
   WHERE email = 'admin@yourdomain.com';
   ```
3. The user now has full access to the verification review queues, report moderation, and audit trails.

---

## Production Security & Resilience

- **Headers**: Helmet enabled with secure default headers.
- **CORS**: Restricted strictly to allowed origins (`FRONTEND_URL` and `ADDITIONAL_CORS_ORIGINS`).
- **WebSockets**: Socket.IO configured with identical CORS restrictions.
- **Tokens**: 15-minute access token + rotating 7-day refresh tokens saved in DB with revocable sessions.
- **Rate Limiting**: Sliding token-bucket via Upstash Redis with graceful fallback to DB/in-memory if Redis is temporarily unreachable.
- **Data Integrity**: Double-booking prevention validated inside database transactions.
