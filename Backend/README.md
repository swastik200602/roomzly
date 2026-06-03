# Roomzly Backend

Production-oriented Express + Prisma backend for the Roomzly frontend.

## Stack

- Node.js + TypeScript strict mode
- Express.js
- Prisma ORM
- PostgreSQL
- JWT access/refresh auth
- Redis with graceful degradation
- Socket.io
- Cloudinary uploads
- Zod validation
- Pino logging
- Swagger/OpenAPI in development at `/api-docs`

## Setup

1. Copy `.env.example` to `.env`.
2. Fill database, Redis, JWT, Cloudinary, and email values.
3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run migrations:

```bash
npm run prisma:migrate
```

6. Start development server:

```bash
npm run dev
```

## API Base

All API routes live under:

```txt
/api/v1
```

All JSON endpoints use:

```json
{
  "success": true,
  "data": {}
}
```

or:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Implemented Modules

- Auth: register, login, refresh rotation, logout, forgot/reset password, current user.
- Properties: list, detail, owner listings, create, update, soft delete, image attach/delete.
- Bookings: list, create, confirm, cancel, CSV export.
- Wishlist: list, add, remove, sync.
- Messages: threads, detail, create thread, send message.
- Analytics: overview, revenue, top properties, traffic placeholder.
- Uploads: Cloudinary image/images.
- Socket.io: JWT auth, user rooms, thread rooms, typing, notification events.
