# WorkFit API - ITIS 4166/5166 Final Project

REST API for a fitness and workout tracker with:

- JWT authentication (`TRAINER` and `USER` roles)
- Full CRUD for Exercises, Workouts, and Logs
- Ownership and role-based authorization
- Swagger documentation at `/api-docs`
- Prisma ORM with PostgreSQL

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Swagger UI

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env`:

   ```env
   DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"
   SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:51215/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"
   PORT=8080
   JWT_SECRET=<your-secret>
   JWT_EXPIRES_IN=1h
   ```

3. Start Prisma local DB (optional, for local development):

   ```bash
   npx prisma dev
   ```

4. Sync schema and seed sample data:

   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

5. Run server:

   ```bash
   npm run start
   ```

## Scripts

- `npm run dev` - start server with watch mode
- `npm run start` - start server
- `npm run lint` - run ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations (dev)
- `npm run prisma:deploy` - apply production migrations
- `npm run prisma:seed` - seed sample data

## Seeded Test Accounts

- Trainer: `trainer@example.com` / `Password123!`
- User: `user@example.com` / `Password123!`
- Non-owner user: `not-owner@example.com` / `Password123!`

## Important Grading Case Included

For filtered GET endpoints, malformed query parameter structures return **400 Bad Request**.

Example:

```http
GET /api/exercises?difficulty[level]=INTERMEDIATE
```

Expected: `400 Bad Request`.
