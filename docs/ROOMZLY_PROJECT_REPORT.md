# Roomzly Project Report

Generated on 2026-06-05.

## 1. Executive Summary

Roomzly is a full-stack real estate discovery and management platform for rooms, PGs, apartments, villas, premium homes, and commercial rentals. The application supports public property discovery, authenticated user accounts, owner listing workflows, bookings, wishlist, compare, chat, notifications, verification, reporting, analytics, and admin moderation.

The project is split into two main applications:

- `Frontend`: React + TypeScript single-page application built with Vite, TanStack Router, TanStack Query, Tailwind CSS, Zustand, Radix UI, and Firebase Hosting.
- `Backend`: Node.js + TypeScript Express API using Prisma ORM, PostgreSQL, Redis, JWT authentication, Socket.IO, Cloudinary, Zod validation, Pino logging, Helmet, CORS, and Railway deployment.

The production target is:

- Frontend hosting: Firebase Hosting
- Backend hosting: Railway
- Database: PostgreSQL
- Cache/session utilities: Redis
- Media storage: Cloudinary

The application is designed as a marketplace with three major user classes:

- Residents: search properties, save listings, compare, book, message owners, report issues.
- Owners: create and manage listings, upload images/documents, manage bookings, respond to messages.
- Admins: moderate users, listings, reports, verification documents, and platform health.

## 2. Project Objectives

The main objective of Roomzly is to provide a trusted real estate discovery platform where users can find verified rental and residential spaces and communicate directly with property owners.

Core goals:

- Provide fast and usable property search across categories, location, budget, and listing attributes.
- Support verified owner and property workflows to improve trust.
- Allow residents to save, compare, book, review, and message owners.
- Give owners a dashboard for managing properties, bookings, analytics, and messages.
- Give admins moderation and verification controls.
- Keep frontend and backend deployable independently.
- Support production-grade security practices: JWT auth, secure refresh cookies, CORS restrictions, rate limiting, validation, and role-based access.

## 3. Repository Structure

```text
roomzly-hub-main/
  Backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      config/
      docs/
      lib/
      middleware/
      modules/
      schemas/
      socket/
      app.ts
      routes.ts
      server.ts
    package.json
    railway.json
  Frontend/
    src/
      assets/
      components/
      lib/
      routes/
      stores/
      main.tsx
      styles.css
    firebase.json
    vite.config.ts
    vite.firebase.config.ts
    package.json
  docs/
    PRODUCTION_DEPLOYMENT.md
    ROOMZLY_IMPLEMENTATION_TASKS.md
    ROOMZLY_PROJECT_REPORT.md
```

## 4. Technology Stack

### Frontend

| Area            | Technology                               |
| --------------- | ---------------------------------------- |
| Language        | TypeScript                               |
| UI runtime      | React 19                                 |
| Build tool      | Vite                                     |
| Routing         | TanStack Router                          |
| Server state    | TanStack Query                           |
| Client state    | Zustand                                  |
| Styling         | Tailwind CSS                             |
| UI primitives   | Radix UI / local shadcn-style components |
| Icons           | Lucide React                             |
| Animation       | Framer Motion                            |
| Maps            | Leaflet                                  |
| Realtime client | Socket.IO Client                         |
| Hosting         | Firebase Hosting                         |

### Backend

| Area                | Technology                               |
| ------------------- | ---------------------------------------- |
| Runtime             | Node.js 22+                              |
| Language            | TypeScript                               |
| Framework           | Express 5                                |
| ORM                 | Prisma                                   |
| Database            | PostgreSQL                               |
| Cache/rate limiting | Redis through ioredis                    |
| Auth                | JWT access tokens and refresh tokens     |
| Realtime            | Socket.IO                                |
| Uploads             | Cloudinary and Multer memory storage     |
| Validation          | Zod                                      |
| Logging             | Pino and pino-http                       |
| API docs            | Swagger/OpenAPI                          |
| Security middleware | Helmet, CORS, cookie-parser, compression |
| Deployment          | Railway                                  |

## 5. Frontend Architecture

The frontend is a Vite React single-page app. `Frontend/index.html` owns the actual document shell and mounts the React app into `#root` through `src/main.tsx`.

Important architectural rule:

- `src/routes/__root.tsx` must not render `<html>`, `<head>`, `<body>`, `HeadContent`, `Scripts`, or `shellComponent`.

This project previously had a production freeze caused by rendering a document shell inside the SPA root. The fixed architecture keeps `__root.tsx` as an ordinary React component tree:

```text
QueryClientProvider
  AuthBootstrap
    InteractionRecovery
    Navbar
    main
      Outlet
    Footer
    MobileBottomNav
    Toaster
```

### Key Frontend Areas

| Area             | Files                                                                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root app shell   | `src/routes/__root.tsx`                                                                                                                                                                                                                             |
| Home page        | `src/routes/index.tsx`                                                                                                                                                                                                                              |
| Explore/search   | `src/routes/explore.tsx`                                                                                                                                                                                                                            |
| Listing detail   | `src/routes/listing.$slug.tsx`                                                                                                                                                                                                                      |
| Auth pages       | `src/routes/auth.login.tsx`, `auth.signup.tsx`, `auth.forgot-password.tsx`, `auth.reset-password.tsx`                                                                                                                                               |
| Dashboard layout | `src/routes/dashboard.tsx`                                                                                                                                                                                                                          |
| Dashboard pages  | `dashboard.index.tsx`, `dashboard.my-listings.tsx`, `dashboard.add-property.tsx`, `dashboard.edit-property.$id.tsx`, `dashboard.bookings.tsx`, `dashboard.messages.tsx`, `dashboard.analytics.tsx`, `dashboard.settings.tsx`, `dashboard.admin.tsx` |
| Shared layout    | `components/layout/Navbar.tsx`, `MobileBottomNav.tsx`, `Footer.tsx`                                                                                                                                                                                 |
| Property cards   | `components/property/PropertyCard.tsx`                                                                                                                                                                                                              |
| Auth bootstrap   | `components/auth/AuthBootstrap.tsx`                                                                                                                                                                                                                 |
| Runtime recovery | `components/runtime/InteractionRecovery.tsx`                                                                                                                                                                                                        |

### Frontend Routing

The project uses file-based route definitions under `Frontend/src/routes`. The generated `routeTree.gen.ts` maps route files to TanStack Router route definitions.

Important route groups:

- Public marketing/static routes: `/about`, `/contact`, `/privacy`, `/terms`, `/security`, `/cookies`, `/careers`, `/press`, `/journal`
- Discovery routes: `/`, `/explore`, `/search-map`, `/wishlist`, `/compare`
- SEO landing routes: `/rooms-in-dehradun`, `/pg-in-dehradun`, `/pg-in-prem-nagar`, `/flats-in-dehradun`, `/properties-in-uttarakhand`, `/premium-homes`, `/verified-owners`, `/pg-hostels`
- Listing details: `/listing/$slug`
- Auth routes: `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`
- Dashboard routes: `/dashboard`, `/dashboard/messages`, `/dashboard/bookings`, `/dashboard/settings`, and owner/admin subroutes

### Frontend State

Frontend state is split by responsibility:

- TanStack Query handles API data fetching, caching, invalidation, and mutation state.
- Zustand stores handle durable or app-level client state:
  - `auth.ts`: current user/session/access token/bootstrap state.
  - `wishlist.ts`: saved property IDs and local sync.
  - `compare.ts`: compared property IDs.

### Mobile Experience

The mobile UI includes:

- A public bottom navigation dock with Home, Explore, Saved, Chat, and Profile/Sign in.
- Scroll-aware nav behavior that hides while scrolling down and reappears while scrolling up.
- A dashboard-specific mobile header and sidebar.
- A mobile-first chat layout where the inbox list and active conversation are separate phone views.

## 6. Backend Architecture

The backend is an Express API served under `/api/v1`. `src/app.ts` creates the Express application, applies global middleware, exposes health endpoints, mounts API routes, and registers error handling.

Main backend flow:

```text
HTTP request
  -> Express route
  -> security/rate/auth/role middleware
  -> Zod validation middleware
  -> controller
  -> service/business logic
  -> Prisma/Redis/Cloudinary/Socket.IO
  -> standardized JSON response
```

### Backend Entry Points

| File                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `src/server.ts`        | Starts HTTP server and attaches Socket.IO |
| `src/app.ts`           | Creates Express app and global middleware |
| `src/routes.ts`        | Mounts module routers                     |
| `src/config/env.ts`    | Environment parsing and runtime config    |
| `src/socket/socket.ts` | Socket.IO authentication and rooms        |

### Global Middleware

The backend uses:

- `helmet` for security headers.
- `cors` with configured allowed origins and credentials.
- `compression` for response compression.
- `express.json` and `express.urlencoded` with `1mb` limits.
- `cookie-parser` for refresh token cookies.
- `pino-http` for HTTP logging.
- Redis-backed/global rate limiting.
- Centralized error middleware.

### Health Endpoints

| Endpoint      | Purpose                      |
| ------------- | ---------------------------- |
| `GET /health` | Basic process health         |
| `GET /ready`  | Database and Redis readiness |

## 7. Backend Modules and API Coverage

All API module routes are mounted from `Backend/src/routes.ts` under `/api/v1`.

| Module        | Base Path        | Responsibility                                                                                  |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| Auth          | `/auth`          | Register, login, Google auth, refresh, logout, current user, phone verification, password reset |
| Properties    | `/properties`    | Search, detail, facets, owner listings, CRUD, images, reviews, verification documents           |
| Bookings      | `/bookings`      | Booking creation, listing, confirmation, cancellation, export                                   |
| Wishlist      | `/wishlist`      | Saved property synchronization                                                                  |
| Messages      | `/messages`      | Threads, messages, attachments, read state, deletion                                            |
| Analytics     | `/analytics`     | Overview, revenue, top properties, traffic                                                      |
| Uploads       | `/upload`        | Cloudinary upload endpoints                                                                     |
| Users         | `/users`         | Profile, avatar, documents, user account workflows                                              |
| Notifications | `/notifications` | Persisted user notifications                                                                    |
| Admin         | `/admin`         | Admin moderation and audit workflows                                                            |
| Reports       | `/reports`       | User/listing/thread reports                                                                     |

### Auth Endpoints

```text
GET  /api/v1/auth/config
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/verify-phone
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Property Endpoints

```text
GET    /api/v1/properties
GET    /api/v1/properties/meta/facets
POST   /api/v1/properties/batch
GET    /api/v1/properties/owner/listings
GET    /api/v1/properties/:slug/reviews
GET    /api/v1/properties/:slug
POST   /api/v1/properties
PATCH  /api/v1/properties/:id
POST   /api/v1/properties/:id/images
GET    /api/v1/properties/:id/verification-documents
POST   /api/v1/properties/:id/verification-documents
POST   /api/v1/properties/:id/reviews
PATCH  /api/v1/properties/:id/reviews/:reviewId
DELETE /api/v1/properties/:id/reviews/:reviewId
DELETE /api/v1/properties/:id/images/:imageId
DELETE /api/v1/properties/:id
```

### Message Endpoints

```text
GET    /api/v1/messages/threads
GET    /api/v1/messages/threads/:threadId
POST   /api/v1/messages/threads
POST   /api/v1/messages/threads/:threadId/messages
POST   /api/v1/messages/threads/:threadId/messages/attachments
PATCH  /api/v1/messages/threads/:threadId/read
DELETE /api/v1/messages/threads/:threadId
```

## 8. Database Design

The database uses Prisma with PostgreSQL. The schema supports marketplace listings, authentication, bookings, messaging, notifications, verification, reports, reviews, admin audit logs, and analytics events.

### Main Models

| Model                          | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `User`                         | Platform account with role, profile, phone verification, auth state |
| `AuthAccount`                  | OAuth provider account linkage                                      |
| `RefreshToken`                 | Hashed refresh token records                                        |
| `Property`                     | Real estate listing                                                 |
| `PropertyImage`                | Listing image metadata                                              |
| `Booking`                      | Resident booking requests and status                                |
| `MessageThread`                | Conversation container                                              |
| `ThreadParticipant`            | Thread membership and read state                                    |
| `Message`                      | Chat message                                                        |
| `MessageAttachment`            | Chat file/image attachment metadata                                 |
| `Review`                       | Property user reviews                                               |
| `Wishlist`                     | Saved properties                                                    |
| `Notification`                 | Persisted notification events                                       |
| `VerificationDocument`         | User verification documents                                         |
| `PropertyVerificationDocument` | Property verification documents                                     |
| `Report`                       | Reports for properties/users/message threads                        |
| `AdminAuditLog`                | Admin action history                                                |
| `AnalyticsEvent`               | Property/platform event tracking                                    |

### Important Enums

- `UserRole`: `RESIDENT`, `OWNER`, `ADMIN`
- `PropertyCategory`: `APARTMENT`, `VILLA`, `STUDIO`, `LOFT`, `PG`, `COMMERCIAL`
- `BookingStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`
- `VerificationStatus`: `MISSING`, `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `RESUBMISSION_REQUESTED`
- `NotificationType`: `BOOKING`, `MESSAGE`, `WISHLIST`, `SYSTEM`, `VERIFICATION`

### Indexing Strategy

The schema includes indexes for common query paths:

- Users by role, active state, and phone verification.
- Properties by city, state, country, locality, coordinates, category, price, owner, verified, premium, active, created date.
- Bookings by property/status/check-in and guest/status.
- Threads by property and participants by user.
- Messages by thread/date and sender.
- Wishlist uniqueness by user/property.
- Notifications by user/read state.
- Reports by target/status/date.
- Analytics by property/event/date.

## 9. Authentication and Authorization

The platform uses JWT-based auth:

- Access tokens authenticate API requests and sockets.
- Refresh tokens are stored as hashed records and transported through secure HTTP-only cookies.
- Passwords are hashed with bcryptjs.
- Password reset uses temporary tokens.
- Google auth is supported through backend config and OAuth account linkage.

Authorization is role-based:

- `RESIDENT`: normal user, can search, save, book, message, review, and report.
- `OWNER`: can create/manage properties and owner workflows after phone verification.
- `ADMIN`: can access admin moderation and verification workflows.

Owner-sensitive routes require:

- Authenticated user.
- `OWNER` or `ADMIN` role.
- Verified phone where required.

## 10. Realtime Messaging and Notifications

Socket.IO is attached to the backend HTTP server.

Socket behavior:

- Socket handshakes require a JWT access token.
- On connect, sockets join `user:{userId}`.
- Users may join `thread:{threadId}` only if they are participants.
- Typing events are broadcast to other thread participants.
- Backend utility functions emit to user rooms and thread rooms.

Realtime event examples:

- `new_message`
- `typing`
- `messages_read`
- `thread_deleted`
- `new_notification`
- Booking-related events

The frontend uses `socket.io-client` for dashboard messages and notifications.

## 11. File Uploads and Media

The backend uses Multer memory storage and Cloudinary. It avoids writing uploaded files to local disk.

Upload use cases:

- Property images.
- Avatar/profile images.
- Chat attachments.
- User verification documents.
- Property verification documents.

Important limits:

- Property image upload: up to 10 images, 10MB each.
- Chat attachment upload: up to 3 files, 5MB each.
- Property verification document upload: one file, 8MB.

## 12. Deployment Architecture

### Frontend on Firebase Hosting

Firebase serves static files from `Frontend/dist/client`.

Important config:

- `npm run build:firebase` builds the deployable artifact.
- Firebase rewrites all routes to `/index.html` for SPA routing.
- `/assets/**` and image/font files receive long immutable cache headers.
- `/index.html` and route-like paths use `no-cache`.

Deploy command:

```powershell
cd Frontend
npm run build:firebase
firebase deploy --only hosting
```

### Backend on Railway

Railway runs the Express API.

Important scripts:

```text
npm run railway:build
npm run start:prod
```

`start:prod` runs Prisma migrations and starts `dist/server.js`.

Health checks:

```text
GET /health
GET /ready
```

## 13. Environment Configuration

### Frontend

Required production variable:

```text
VITE_API_URL=https://YOUR_RAILWAY_BACKEND_DOMAIN/api/v1
```

### Backend

Important backend variables:

```text
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://YOUR_FIREBASE_OR_CUSTOM_DOMAIN
ADDITIONAL_CORS_ORIGINS=
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SAME_SITE=none
COOKIE_DOMAIN=
GOOGLE_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Secrets must be stored in Railway/Firebase or local `.env` files and must not be committed.

## 14. Security Design

Security controls present in the project:

- Helmet security headers.
- Production CORS allowlist.
- Socket.IO CORS allowlist.
- JWT authentication.
- Secure refresh cookie strategy.
- Hashed refresh tokens.
- Role-based middleware.
- Phone verification gates for owner workflows.
- Zod request validation.
- Upload MIME and size restrictions.
- Rate limiting.
- Centralized error handling.
- Production error responses that avoid exposing internals.
- Admin audit logs.

Recommended security hardening:

- Rotate all production secrets before launch.
- Confirm Redis requires authentication and is not publicly exposed.
- Confirm SMTP SPF/DKIM records.
- Add CI checks for lint, build, tests, Prisma generate, and migrations.
- Add monitoring/error tracking.

## 15. Performance and Optimization

Frontend performance work includes:

- Firebase production build with chunking.
- Lazy-loaded map-heavy Leaflet components.
- Static asset caching with immutable cache headers.
- Query caching through TanStack Query.
- Local state stored in small Zustand slices.
- Native controls on performance-sensitive explore filters.
- Mobile chat layout optimized for small screens.

Important production freeze lesson:

- Do not render a TanStack Start document shell inside the Vite SPA root.
- Keep `<html>`, `<head>`, `<body>`, font links, and metadata in `Frontend/index.html`.
- `__root.tsx` should render providers and app layout only.
- Avoid adding `shellComponent`, `HeadContent`, or `Scripts` to `__root.tsx`.

Validation commands used for the freeze fix:

```powershell
cd Frontend
npm run build:firebase
npm run preview:firebase -- --host 127.0.0.1 --port 4175
npm run debug:freeze -- http://127.0.0.1:4175/explore --mode=all
```

Expected healthy diagnostic signals:

```text
nestedDocumentTags: 0
Interaction returned: ok true
Heartbeat after interaction: responsive
```

## 16. Testing and Validation

Available commands:

### Frontend

```powershell
cd Frontend
npm run build
npm run build:firebase
npm run lint
npm run preview:firebase
npm run debug:freeze -- http://127.0.0.1:4175/explore --mode=all
```

### Backend

```powershell
cd Backend
npm run build
npm test
npm run prisma:generate
npm run prisma:deploy
```

Recommended smoke tests:

- Open home page.
- Search/filter listings.
- Open listing detail.
- Log in and refresh the page.
- Save a property.
- Compare properties.
- Start a chat from listing detail.
- Open `/dashboard/messages` on mobile and desktop.
- Submit booking request.
- Owner creates listing and uploads images.
- Admin verifies documents and reviews reports.
- Refresh nested Firebase routes and confirm no 404.
- Check backend `/health` and `/ready`.

## 17. Current Known Risks

| Risk                                              | Impact                             | Mitigation                                                        |
| ------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Reintroducing root document shell in `__root.tsx` | Input/routing freeze in production | Keep document tags in `index.html`; review root changes carefully |
| Missing/incorrect `VITE_API_URL`                  | Frontend cannot reach backend      | Use deployed Railway `/api/v1` URL                                |
| CORS mismatch                                     | Login/API failures in production   | Set `FRONTEND_URL` and `ADDITIONAL_CORS_ORIGINS` correctly        |
| Cookie SameSite mismatch                          | Refresh/session issues             | Use `COOKIE_SAME_SITE=none` for Firebase-to-Railway cross-site    |
| Redis unavailable                                 | Rate limit/cache degraded          | Monitor `/ready`; gracefully degrade where implemented            |
| Missing SMTP                                      | Password reset emails fail         | Configure SMTP and verify domain                                  |
| Unseeded admin                                    | Admin dashboard unavailable        | Promote first admin through SQL                                   |

## 18. Future Scope

Recommended next improvements:

- Add CI pipeline for frontend build, backend build, Prisma generate, lint, and tests.
- Add Playwright end-to-end tests for auth, search, listing, dashboard, and chat.
- Add production error monitoring such as Sentry.
- Add analytics dashboards for real user behavior.
- Add staging Firebase and Railway environments.
- Add image moderation and document review queue improvements.
- Add push notifications or email notifications for booking/message events.
- Add payment/rent collection integration if business requirements require it.
- Add saved search alerts.
- Add map clustering and location-based recommendations.
- Add stronger search ranking and full-text search improvements.

## 19. Developer Setup

### Frontend

```powershell
cd Frontend
npm install
npm run dev
```

### Backend

```powershell
cd Backend
npm install
npm run prisma:generate
npm run dev
```

### Database

For a new local database:

```powershell
cd Backend
npm run prisma:migrate
npm run db:seed
```

## 20. Conclusion

Roomzly is a production-oriented full-stack real estate platform with a clear separation between frontend and backend responsibilities. The frontend provides discovery, listing, dashboard, and mobile chat experiences. The backend provides secure APIs, authentication, role-based workflows, real-time chat, file uploads, verification, analytics, and admin moderation.

The most important architectural stability rule is to keep the frontend as a normal Vite SPA: `index.html` owns the document, while `__root.tsx` owns only the React application layout. Following that rule prevents the input-focus and routing freeze that was previously diagnosed and fixed.

With Firebase Hosting, Railway, PostgreSQL, Redis, and Cloudinary configured correctly, the project is ready for production smoke testing and iterative launch hardening.
