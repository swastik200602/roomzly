# Roomzly Full-Stack Implementation Tasks

Saved from the user's implementation brief on 2026-06-01.

## Mission

Deliver a production-ready Roomzly full-stack system by using the existing frontend UX as the source of truth, reverse-engineering backend requirements from it, implementing the backend, and connecting the frontend with minimal disruption.

## Required Stack

Frontend:
- TanStack Start
- React
- TypeScript
- TailwindCSS
- Shadcn/UI
- TanStack Query
- Zustand
- Framer Motion

Backend:
- Node.js
- TypeScript strict mode
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Redis via ioredis
- Socket.io
- Cloudinary
- Zod
- bcryptjs
- Nodemailer or Resend
- Pino logger
- Swagger/OpenAPI

## Architecture Rules

- All APIs must live under `/api/v1`.
- Follow strict flow: routes -> middleware -> controller -> service -> Prisma/data layer.
- Routes only register endpoints, middleware, validation, and guards.
- Controllers only parse requests, call services, and return standardized responses.
- Services own business logic, transactions, cache invalidation, socket emissions, and notifications.
- Prisma must not be used directly in routes or controllers.
- Use small modules, no dead code, no duplicate logic, no giant files, and no `any`.

## Standard API Responses

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Paginated:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Backend Modules

- Auth: register, login, refresh rotation, logout, forgot password, reset password, current user.
- Users/profiles: profile, avatar, notifications, verification.
- Properties: search, details, owner CRUD, soft delete, image upload, cache-aware listing flow.
- Uploads: Cloudinary memory uploads, image validation, avatar/property transformations.
- Wishlist: get, add, remove, sync from frontend Zustand.
- Bookings: create, availability checks, confirm, cancel, export CSV.
- Messages/chat: threads, participants, messages, unread tracking, realtime sockets.
- Analytics: overview, revenue, top properties, traffic architecture.
- Notifications: persisted events plus socket delivery.
- Healthcheck and observability.
- Swagger/OpenAPI docs.
- Tests for auth, properties, bookings, wishlist, messages, analytics.

## Core Database Models

- User
- RefreshToken
- Property
- PropertyImage
- Booking
- MessageThread
- ThreadParticipant
- Message
- Wishlist
- Notification
- Verification/document records
- Analytics/event records

Use PostgreSQL normalization, Prisma relations, indexes, enums, transactions, and pagination-ready query patterns.

## Auth Requirements

- Access token expiry: 15 minutes.
- Refresh token expiry: 7 days.
- Store only hashed refresh tokens.
- Refresh token rotation is mandatory.
- Refresh token cookie must be `httpOnly` and `secure` in production. Use `sameSite=none` for cross-site Firebase Hosting to Railway deployments, or `sameSite=lax/strict` only when frontend and API share a same-site domain strategy.
- Password hashing with `bcryptjs`.
- Password reset tokens generated with `crypto.randomBytes`, hashed in Redis, TTL 15 minutes.
- Roles: `RESIDENT`, `OWNER`, `ADMIN`.
- Middleware: `authenticate`, `requireRole()`.

## Security Requirements

- Helmet.
- CORS.
- Zod validation on all request payloads.
- JWT verification.
- Redis-backed rate limiting.
- Sanitization.
- Secure cookies.
- Never trust client user IDs, roles, pricing, or frontend state.
- No production stack trace leaks.

Rate limits:
- Login: 5/minute/IP.
- Register: 3/minute/IP.
- Forgot password: 3/15 minutes/IP.
- Uploads: 20/minute/user.
- Global: 100/minute/IP.

## Property Requirements

Endpoints:

```txt
GET    /api/v1/properties
GET    /api/v1/properties/:slug
POST   /api/v1/properties
PATCH  /api/v1/properties/:id
DELETE /api/v1/properties/:id
POST   /api/v1/properties/:id/images
DELETE /api/v1/properties/:id/images/:imageId
GET    /api/v1/properties/owner/listings
```

Create flow:
- OWNER only.
- Generate unique slug using slugified title and numeric suffixes.
- Generate unique property code like `001_APT`, `002_VLA`, `003_PG`.
- Soft delete with `active=false`.

Filtering:
- `q`, `category`, `city`, `minPrice`, `maxPrice`, `beds`, `premium`, `verified`, `sort`, `page`, `limit`.
- Sorts: `featured`, `price-asc`, `price-desc`, `newest`, `popular`.
- PostgreSQL full-text search over title, city, and category.
- Required indexes: slug, city, category, price, ownerId, verified, premium, active, createdAt.

Cache:
- `properties:list:{queryHash}` for 5 minutes.
- `properties:detail:{slug}` for 10 minutes.
- Gracefully degrade if Redis fails.
- Invalidate relevant caches on create/update/delete/image changes.

## Upload Requirements

- Cloudinary only.
- No disk writes.
- `multer` memory storage.
- Allowed formats: jpeg, png, webp.
- Property uploads: max 10 images, max 10MB each.
- Avatar path: `roomzly/avatars/{userId}`.
- Property path: `roomzly/properties/{propertyId}/{timestamp}`.
- Avatar transform: 400x400, face crop, quality auto, webp.
- Property transform: width 1200, quality auto:good, webp.

Endpoints:

```txt
POST /api/v1/upload/image
POST /api/v1/upload/images
```

Return:

```json
{
  "url": "https://...",
  "publicId": "roomzly/..."
}
```

## Socket.io Requirements

- Attach to same HTTP server.
- Authenticate sockets with JWT.
- Join `user:{userId}` on connect.
- Thread rooms for chat.

Server to client:
- `new_booking`
- `booking_confirmed`
- `booking_cancelled`
- `new_message`
- `new_notification`

Client to server:
- `join_thread`
- `leave_thread`
- `typing`

## Booking Requirements

Endpoints:

```txt
GET    /api/v1/bookings
GET    /api/v1/bookings/my
POST   /api/v1/bookings
PATCH  /api/v1/bookings/:id/confirm
PATCH  /api/v1/bookings/:id/cancel
GET    /api/v1/bookings/export
```

Create flow:
- Validate dates, property, guest.
- Prevent overlap where `existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn`.
- Check PENDING and CONFIRMED bookings.
- Calculate nights and total server-side.
- Use a transaction.
- Create notification.
- Emit socket event.
- Send email without crashing if email fails.

Authorization:
- Guests manage own bookings.
- Owners manage bookings for own properties.
- Admins have full access.

## Messaging Requirements

Endpoints:

```txt
GET  /api/v1/messages/threads
GET  /api/v1/messages/threads/:threadId
POST /api/v1/messages/threads
POST /api/v1/messages/threads/:threadId/messages
```

Rules:
- Support property conversations and two-user conversations.
- Reuse existing thread if present.
- Persist messages before socket emission.
- Track unread and last-read timestamps.

## Analytics Requirements

Endpoints:

```txt
GET /api/v1/analytics/overview
GET /api/v1/analytics/revenue
GET /api/v1/analytics/top-properties
GET /api/v1/analytics/traffic
```

Overview:
- Total revenue.
- Total views.
- Total saves.
- Total inquiries.
- Redis cache TTL 1 hour.

Revenue:
- 12-month current and previous period series from confirmed bookings.

## Required Schema Files

```txt
auth.schema.ts
users.schema.ts
properties.schema.ts
bookings.schema.ts
messages.schema.ts
wishlist.schema.ts
analytics.schema.ts
upload.schema.ts
```

## Deployment Targets

- Frontend: Vercel.
- Backend: Railway.
- Database: Neon PostgreSQL.
- Redis: Upstash Redis.

## Completion Criteria

- Frontend analyzed.
- Backend implemented.
- Frontend connected.
- Auth working.
- Queries integrated.
- Sockets working.
- Uploads working.
- Cache working.
- Validations working.
- Tests configured.
- Production readiness achieved.
