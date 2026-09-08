# Roomzly Production Deployment

Roomzly production target:

- Frontend: Firebase Hosting
- Backend: Railway
- Database: Railway PostgreSQL
- Storage: Cloudinary
- Cache/session utilities: managed Redis

## Production Readiness Score

Current score: 82/100.

The main deployment blockers addressed in code are production CORS, cross-site refresh cookies, frontend API configuration, Railway build/start commands, Firebase SPA rewrites, root secret ignores, and health/readiness endpoints.

## Environment Checklist

Backend production variables:

- `NODE_ENV=production`
- `PORT`, normally Railway-provided or `4000`
- `FRONTEND_URL`, your Firebase/custom frontend URL
- `ADDITIONAL_CORS_ORIGINS`, optional comma-separated staging/custom domains
- `DATABASE_URL`, from Railway PostgreSQL
- `REDIS_URL`, managed Redis URL
- `JWT_ACCESS_SECRET`, 32+ random characters
- `JWT_REFRESH_SECRET`, different 32+ random characters
- `COOKIE_SAME_SITE=none` for Firebase Hosting to Railway
- `COOKIE_DOMAIN` blank unless frontend and backend share a parent domain
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- SMTP variables for password reset email

Frontend production variables:

- `VITE_API_URL=https://YOUR_RAILWAY_BACKEND_DOMAIN/api/v1`

Never commit real `.env` files. Use the checked-in `.env.example` files only.

## Railway Backend Guide

1. Create a Railway project.
2. Add PostgreSQL.
3. Add managed Redis or provide an external Redis URL.
4. Create a backend service from the repository `Backend` directory.
5. Set build command: `npm run railway:build`.
6. Set start command: `npm run start:prod`.
7. Set health check path: `/health`.
8. Add all backend environment variables from `Backend/.env.production.example`.
9. Deploy. The start command runs `prisma migrate deploy` before starting the server.
10. Verify:
   - `GET /health` returns `200`.
   - `GET /ready` returns `200` once Postgres and Redis are reachable.

## Firebase Hosting Guide

1. In `Frontend`, create a Firebase project or select the existing project.
2. Set production env locally or in CI using `Frontend/.env.production.example`.
3. Build the Firebase static SPA artifact with `npm run build:firebase`.
4. Deploy with Firebase Hosting using `Frontend/firebase.json`.
5. Verify refreshing nested routes such as `/properties/...`, `/dashboard`, and `/search-map` returns the app, not a 404.

## Admin Bootstrap

Public signup and Google auth must not create `ADMIN` users. First admin should be promoted directly in the production database after creating a normal account:

```sql
UPDATE "User"
SET role = 'ADMIN', active = true
WHERE email = 'admin@example.com';
```

Use a real admin email, then remove direct database access from day-to-day workflows.

## Production Validation Flows

Owner:

- Register as owner.
- Submit mobile number in dashboard settings.
- Create property.
- Upload images.
- Pin location.
- Submit owner/property verification documents.

Tenant:

- Register or log in.
- Search and filter listings.
- Open listing detail.
- View map and directions.
- Save property.
- Chat owner.
- Use call/WhatsApp/share/report actions.

Admin:

- Log in with promoted admin account.
- Review owner documents.
- Review property documents/listings.
- Moderate reports.
- Confirm audit logs are recorded for admin actions.

## Security Review

Implemented:

- Helmet security headers.
- Production CORS restricted to configured origins.
- Socket.IO restricted to the same allowed origins.
- JWT access tokens and rotating refresh tokens.
- HTTP-only refresh cookies.
- Cross-site production cookie support through `COOKIE_SAME_SITE=none`.
- Role middleware for owner/admin routes.
- Owner phone verification gates for property creation, chat-contact sensitive actions, and verification submissions.
- Upload file size limits.
- Upload MIME validation for images and chat PDFs.
- Signed URLs for verification document review.
- Global and route-specific rate limiting.
- Production error responses hide internal details.

Remaining security concerns:

- Confirm SMTP provider credentials and sender domain SPF/DKIM before launch.
- Confirm Redis is not publicly exposed without auth/TLS.
- Rotate all secrets before production if they were ever pasted into local tools or committed.
- Add automated CI checks for build, Prisma generate, and tests.

## Backup Strategy 

- Enable Railway PostgreSQL automated backups before public launch.
- Take a manual database snapshot before every migration.
- Export Cloudinary asset list periodically for disaster recovery tracking.
- Keep `.env.production` values in Railway/Firebase secret stores, not the repo.

## Rollback Strategy

- Keep the previous successful Railway deployment available for rollback.
- For schema changes, prefer backward-compatible migrations.
- Before risky migrations, take a Railway PostgreSQL snapshot.
- If frontend deploy breaks routing/API config, rollback Firebase Hosting to the previous release.

## Launch Blockers

- Production secrets must be generated and configured in Railway/Firebase.
- Production SMTP must be configured and tested for reset emails.
- Railway PostgreSQL and Redis connectivity must pass `/ready`.
- First admin must be bootstrapped manually through SQL.
- Firebase `VITE_API_URL` must point to the deployed Railway API.

## Important

- Add CI for backend build, frontend build, Prisma generate, and migration status.
- Run full production smoke tests using real deployed URLs.
- Review whether to move API to `api.roomzly.com`; if yes, update `FRONTEND_URL`, `COOKIE_DOMAIN`, DNS, and CORS.

## Nice To Have

- Staging Firebase/Railway environments.
- Automated nightly backup verification.
- Error monitoring such as Sentry.
- Centralized log search and alerting.
