# ITIS 4166/5166 Final Project - Phase 2 Submission Report

## Student
- Name: Khush Patel

## Project
- API Name: WorkFit API (Fitness & Workout Tracker)
- Base URL (Render): `https://<your-render-service>.onrender.com`
- Swagger/OpenAPI URL: `https://<your-render-service>.onrender.com/api-docs`
- Repository URL: `https://github.com/<your-username>/<your-repo>`

---

## 1) Implementation Summary

This implementation follows the approved Phase 1 design:
- **Auth resource**: signup/login with JWT
- **Main resources** (full CRUD):
  - Exercises
  - Workouts
  - Logs
- **Authorization model**:
  - Role-based access (`TRAINER`, `USER`)
  - Ownership-based restrictions where required
- **Database**: PostgreSQL with Prisma schema matching the ER diagram
- **Deployment**: Render

---

## 2) Seed Data / Known Credentials

Use the seeded users below to test authentication and authorization behavior in Swagger:

- Trainer account  
  - Email: `trainer@example.com`  
  - Password: `Password123!`

- Regular user account  
  - Email: `user@example.com`  
  - Password: `Password123!`

- Optional second non-owner user account (for 403 tests)  
  - Email: `not-owner@example.com`  
  - Password: `Password123!`

---

## 3) Testing Plan (Swagger UI)

### General setup before protected endpoints
1. Open Swagger UI.
2. Run `POST /api/auth/login` with one of the credentials above.
3. Copy returned JWT token.
4. Click **Authorize** in Swagger and paste `Bearer <token>`.

---

## 3.1 Authentication Endpoints

### POST `/api/auth/signup`
- Access Control: Public
- Success Case:
  1. Try it out with a new unique email.
  2. Click Execute.
  3. Expect **201 Created** with token and user payload.
- Error Cases:
  - **400 Bad Request**: omit required field (`email` or `password`) or pass invalid email format.
  - **409 Conflict**: reuse an email already registered.

### POST `/api/auth/login`
- Access Control: Public
- Success Case:
  1. Provide valid seeded credentials.
  2. Click Execute.
  3. Expect **200 OK** with token and user payload.
- Error Cases:
  - **400 Bad Request**: omit `email` or `password`.
  - **401 Unauthorized**: wrong password or unknown email.

---

## 3.2 Exercise Endpoints

### POST `/api/exercises`
- Access Control: Trainer only
- Setup: Login as trainer and authorize token.
- Success Case: submit valid body (`name`, `description`, `muscle_group`, `difficulty`) and expect **201 Created**.
- Error Cases:
  - **400 Bad Request**: invalid enum value (for example `difficulty: "EASY"`).
  - **401 Unauthorized**: remove JWT and retry.
  - **403 Forbidden**: login as regular user and retry.

### GET `/api/exercises`
- Access Control: Authenticated users
- Setup: Login as any authenticated user.
- Success Case: execute with no query params and expect **200 OK** list.
- Filter Success Case: execute with valid filters like `?muscle_group=CHEST&difficulty=INTERMEDIATE` and expect **200 OK** filtered list.
- Error Cases:
  - **400 Bad Request**: send malformed query parameters (example: `?difficulty[level]=INTERMEDIATE` or invalid structure not supported by API parser/validator).  
    - This is the missing case added from the Phase 1 document for Phase 2 grading coverage.
  - **401 Unauthorized**: remove JWT and retry.

### GET `/api/exercises/{id}`
- Access Control: Authenticated users
- Success Case: use existing ID and expect **200 OK** object.
- Error Cases:
  - **400 Bad Request**: use invalid ID (`-1`, `abc`).
  - **401 Unauthorized**: remove JWT.
  - **404 Not Found**: use non-existing ID (`9999`).

### PUT `/api/exercises/{id}`
- Access Control: Trainer owner of the exercise
- Setup: login as trainer who created the exercise.
- Success Case: send valid partial update (for example `name`, `difficulty`) and expect **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID or invalid body fields.
  - **401 Unauthorized**: remove JWT.
  - **403 Forbidden**: login as non-owner trainer/user.
  - **404 Not Found**: use non-existing ID.

### DELETE `/api/exercises/{id}`
- Access Control: Trainer owner of the exercise
- Success Case: delete owned exercise and expect **200 OK** with deleted record.
- Error Cases:
  - **400 Bad Request**: invalid ID.
  - **401 Unauthorized**: remove JWT.
  - **403 Forbidden**: non-owner token.
  - **404 Not Found**: non-existing ID.

---

## 3.3 Workout Endpoints

### POST `/api/workouts`
- Access Control: Trainer only
- Setup: login as trainer.
- Success Case: submit valid workout with optional exercises array and expect **201 Created**.
- Error Cases:
  - **400 Bad Request**: invalid fields or invalid `exercise_id` in nested array.
  - **401 Unauthorized**: no token.
  - **403 Forbidden**: regular user token.

### GET `/api/workouts`
- Access Control: Authenticated users
- Success Case: execute with token and expect **200 OK** list.
- Error Cases:
  - **401 Unauthorized**: remove token.

### GET `/api/workouts/{id}`
- Access Control: Authenticated users
- Success Case: existing ID returns **200 OK** with workout and exercise details.
- Error Cases:
  - **400 Bad Request**: invalid ID format/value.
  - **401 Unauthorized**: remove token.
  - **404 Not Found**: non-existing ID.

### PUT `/api/workouts/{id}`
- Access Control: Trainer owner of workout
- Success Case: valid update body returns **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID/body.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: non-owner token.
  - **404 Not Found**: non-existing ID.

### DELETE `/api/workouts/{id}`
- Access Control: Trainer owner of workout
- Success Case: delete owned workout and expect **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: non-owner token.
  - **404 Not Found**: non-existing ID.

---

## 3.4 Log Endpoints

### POST `/api/logs`
- Access Control: Regular users only
- Setup: login as regular user.
- Success Case: submit valid `workout_id`, `duration_min`, optional `notes`, `completed_at` and expect **201 Created**.
- Error Cases:
  - **400 Bad Request**: missing/invalid fields.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: trainer token.
  - **404 Not Found**: workout does not exist.

### GET `/api/logs`
- Access Control: Authenticated user (own logs)
- Success Case: execute with token and expect **200 OK** with own logs.
- Filter Success Case: use valid filters like `?workout_id=1&from=2026-01-01&to=2026-12-31`.
- Error Cases:
  - **400 Bad Request**: malformed filter query parameters (example: `?from[date]=2026-01-01` or unsupported query shape).
  - **401 Unauthorized**: remove token.

### GET `/api/logs/{id}`
- Access Control: Owner of log
- Success Case: owner requests existing log and gets **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: another user requests the log.
  - **404 Not Found**: non-existing ID.

### PUT `/api/logs/{id}`
- Access Control: Owner of log
- Success Case: valid update payload returns **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID/body.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: non-owner token.
  - **404 Not Found**: non-existing ID.

### DELETE `/api/logs/{id}`
- Access Control: Owner of log
- Success Case: owner deletes log and gets **200 OK**.
- Error Cases:
  - **400 Bad Request**: invalid ID.
  - **401 Unauthorized**: remove token.
  - **403 Forbidden**: non-owner token.
  - **404 Not Found**: non-existing ID.

---

## 4) Phase 1 Correction Carried into Phase 2

Added the missing GET error path that was not explicitly listed before:

- **400 Bad Request for malformed query parameters on GET endpoints that support filters** (at minimum `GET /api/exercises`, and similarly for any other filtered GET endpoint like `GET /api/logs`).

This ensures the testing plan fully covers required error-handling scenarios expected by the Phase 2 rubric.
