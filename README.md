# Multiplex Agent Backend
 
A scalable REST API backend for a multi-agent AI chat platform, built with NestJS, Prisma, PostgreSQL, Redis, and Groq, with Stripe and bKash payments.
 
[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
 
## Overview
 
Multiplex Agent Backend lets users chat with multiple AI models through a single API. It covers authentication (email OTP, Google, GitHub), conversations, role-based access, and usage tracking.
 
Premium models are unlocked through Stripe or bKash subscriptions, with automatic PDF invoices by email. Admins manage users, models, subscriptions, and view revenue analytics.
 
## Key Features
 
- Email/OTP registration, JWT auth with refresh, Google and GitHub OAuth
- Multi-model AI chat with premium gating, auto-titled conversations, and token usage tracking
- Stripe and bKash subscriptions (monthly, half-yearly, yearly) with PDF invoicing
- Admin tools: user and model management, analytics
- Request logging, uniform response format `{ success, message, data, meta? }`, startup seeding, and scheduled cleanup jobs

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | `@nestjs/common/core/platform-express@12`, `class-validator` + `class-transformer`, `rxjs` |
| Language | TypeScript 6, ESM (`type: module`), `reflect-metadata` |
| ORM / DB | `prisma@7.10`, `@prisma/client@7.10`, `@prisma/adapter-pg`, `pg@8`, PostgreSQL |
| Auth | `jsonwebtoken`, `bcrypt`, `cookie-parser`, `passport`, `passport-google-oauth20`, `passport-github2` |
| AI | `groq-sdk@1.6` |
| Payments | `stripe@22`, custom bKash `fetch` client, `date-fns` |
| Uploads | `cloudinary@2.11`, `streamifier`, `FileInterceptor (multer)` |
| Cache | `redis@6.2.1` |
| Mail / Template | `nodemailer@10`, `ejs` |
| PDF | `pdfkit` |
| Cron | `node-cron@4.6` |
| Quality | `vitest@4`, `supertest`, `oxlint`, `prettier`, `source-map-support` |

## Project Structure

```text
src/
  main.ts                  # bootstrap: CORS, ValidationPipe, Interceptor, Prisma+Redis, seed, cron, listen
  app.module.ts            # Auth, User, Provider, Message, Subscription, Analytics, Logger
  app.controller.ts        # GET /
  app/
    config/index.ts        # centralized env
    utils/                 # global.prefix, jwt, invoice (PDFKit), seed
    lib/                   # prisma, redis, groq, stripe, cloudinary, nodemailer, passport, bkash, cron, crypto
    common/                # AuthGuard, RolesGuard, @Roles / @CurrentUser, ResponseInterceptor
    template/              # verification.otp.ejs, forgot.password.opt.ejs, reset.Password.ejs
    module/
      auth/                # register, verify, login, me, refresh, forgot, reset, google, github
      user/                # profile-image upload, soft-delete
      provider/            # AI models list / enable / disable
      message/             # prompt -> Groq, conversations CRUD / archive
      subscription/        # checkout (Stripe/bKash), webhook, callback, list / my
      analytics/           # admin aggregates
      logger/              # RequestLoggerMiddleware (global *)
api/[...path].ts           # Vercel serverless entry (cached app.init(), no seed/cron/listen)
prisma/schema/*.prisma     # user, provider, plan, planTemplete, planProviderLimit, subscription, payment, conversion, message, requestsLog, enum
vercel.json                # buildCommand npm run build, maxDuration 60
```


## Auth & Authorization

| Concern | Implementation |
|---------|----------------|
| Register | `bcrypt` hash + 6-digit OTP + pending JSON in Redis + EJS mail |
| Verify | OTP check → `User + Plan(FREE)` transaction → JWT pair + httpOnly cookies |
| JWT | `AuthGuard`: `cookies.accessToken` first, fallback `Bearer`; rejects `isDeleted` / non-`ACTIVE`; attaches `{id,name,email,role}` |
| Refresh | `cookies.refreshToken` → verify `JWT_REFRESH_SECRET` → rotate pair |
| OAuth | `passport-google-oauth20` / `passport-github2` as middleware in `AuthModule`; auto-provision + link IDs; GitHub email via `api.github.com/user/emails` |
| Roles | `@Roles(...Role[])` + `RolesGuard` (401 no-user, 403 mismatch) |
| Cookies | `httpOnly, secure=production, sameSite none|lax, access 30m, refresh 7d, path /` |

Access matrix: `ADMIN` only → user delete, provider all / enable / disable, subscription all, analytics. `USER` only → subscription create. `ADMIN+USER` → message all, subscription my. Authenticated → profile-image, me. Public → register / login / verify / forgot / reset, OAuth, `GET /provider`, bKash callback, Stripe webhook, `GET /`.

## API Endpoints — Complete (30)

> All responses wrapped by `ResponseInterceptor`: `{ success: true, message, data, meta? }`.
> Validation: `whitelist + forbidNonWhitelisted + transform`.

### 1. System

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 1 | GET | `/` | Public | — | Health / root — `{ author, message }` |

### 2. Auth — `api/v1/auth` (11)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 2 | POST | `/api/v1/auth/register` | Public | `{"name": "string, min 3", "email": "string, email", "password": "string, min 8 + upper + lower + number + special"}` | Register → OTP mail, pending payload in Redis |
| 3 | POST | `/api/v1/auth/email-verify` | Public | `{"email": "string", "otp": "string"}` | Verify OTP → create user + FREE plan, set cookies |
| 4 | POST | `/api/v1/auth/login` | Public | `{"email": "string", "password": "string"}` | Credential login, block `BLOCKED/DELETED`, set cookies |
| 5 | GET | `/api/v1/auth/me` | `AuthGuard` | — (cookie `accessToken` or `Bearer`) | Get current profile |
| 6 | POST | `/api/v1/auth/refresh-token` | Cookie | — (cookie `refreshToken`) | Rotate access + refresh pair |
| 7 | POST | `/api/v1/auth/forgot-password` | Public | `{"email": "string"}` | Send forgot-password OTP mail |
| 8 | POST | `/api/v1/auth/reset-password` | Public | `{"email": "string", "otp": "string", "newPassword": "string"}` | Verify OTP, update hashed password |
| 9 | GET | `/api/v1/auth/google` | Public | — | Initiate Google OAuth (`profile email`) |
| 10 | GET | `/api/v1/auth/google/callback` | OAuth | — (`req.user` from Passport) | Google callback → cookies + tokens |
| 11 | GET | `/api/v1/auth/github` | Public | — | Initiate GitHub OAuth (`user:email`) |
| 12 | GET | `/api/v1/auth/github/callback` | OAuth | — (`req.user` from Passport) | GitHub callback → cookies + tokens |

### 3. User — `api/v1/user` (2)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 13 | PATCH | `/api/v1/user/profile-image` | `AuthGuard` | `multipart/form-data` — `file: image/*` (`FileInterceptor('file')`) | Validate size/mimetype, stream to Cloudinary, update `imageURL`, delete old |
| 14 | PATCH | `/api/v1/user/delete/:id` | `AuthGuard + ADMIN` | — (`:id` path param only, no body) | Soft-delete (`isDeleted, DELETED, deletedAt`); cron hard-deletes later |

### 4. Provider (AI Models) — `api/v1/provider` (4)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 15 | GET | `/api/v1/provider/all-model` | `AuthGuard + ADMIN` | — | Admin list all providers incl. disabled / premium |
| 16 | GET | `/api/v1/provider` | Public | — (`?query` passthrough, optional) | Public list enabled models |
| 17 | PUT | `/api/v1/provider/:id` | `AuthGuard + ADMIN` | — (`:id` path param only; `UpdateProviderDto{isEnabled?}` defined but unused) | Enable model |
| 18 | PATCH | `/api/v1/provider/:id` | `AuthGuard + ADMIN` | — (`:id` path param only) | Disable model |

### 5. Message / Chat — `api/v1/message` (6)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 19 | POST | `/api/v1/message` | `AuthGuard + ADMIN,USER` | `{"providerId": "string, required", "prompt": "string, required, max 2000", "conversationId?": "string, optional"}` | Send prompt to Groq; premium gate requires `ACTIVE PREMIUM`; creates conversation (auto-title 45 chars) + message with usage |
| 20 | GET | `/api/v1/message/my-conversation` | `AuthGuard + ADMIN,USER` | — | List own conversations with messages |
| 21 | GET | `/api/v1/message/:id` | `AuthGuard + ADMIN,USER` | — (`:id` path param) | Get single conversation (ownership-checked) |
| 22 | PUT | `/api/v1/message/:id` | `AuthGuard + ADMIN,USER` | `{"title?": "string, optional"}` (`UpdateTitleDto`) | Update conversation title |
| 23 | PATCH | `/api/v1/message/:id` | `AuthGuard + ADMIN,USER` | — (`:id` path param) | Archive (`isArchived=true`) |
| 24 | PATCH | `/api/v1/message/remove/:id` | `AuthGuard + ADMIN,USER` | — (`:id` path param) | Un-archive (`removeArchive`) |

### 6. Subscription & Payments — `api/v1/subscription` (5)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 25 | POST | `/api/v1/subscription` | `AuthGuard + USER` | `{"method": "CARD \| BKASH", "billingCycle": "MONTHLY \| HALF_YEARLY \| YEARLY"}` | `BKASH` → payment URL (`Payment PENDING` + `DRAFT`); `CARD` → Stripe Checkout Session (`metadata{subscriptionId,paymentId}`) |
| 26 | GET | `/api/v1/subscription/bkash/callback` | Public | — (`?paymentID` + `?status` query, `302` redirect to frontend) | Verify / execute bKash, activate subscription |
| 27 | POST | `/api/v1/subscription/webhook` | Public | — (Stripe `rawBody` + header `stripe-signature`; no JSON body) | `checkout.session.completed` → `PAID` + `ACTIVE` (`addMonths/Years`), upgrade plan, PDF invoice + mail |
| 28 | GET | `/api/v1/subscription/all` | `AuthGuard + ADMIN` | — (`?search,page,limit,status,type,sortBy,sortOrder`) | Admin paginated list + `meta{total,page,limit,totalPages}` |
| 29 | GET | `/api/v1/subscription/my` | `AuthGuard + ADMIN,USER` | — (same `IQuery`: `?search,page,limit,status,type,sortBy,sortOrder`) | Own subscriptions paginated |

### 7. Analytics — `api/v1/analytics` (1)

| # | Method | Path | Auth | Request Body / Payload | Description |
|---|--------|------|------|------------------------|-------------|
| 30 | GET | `/api/v1/analytics` | `AuthGuard + ADMIN` | — | Dashboard aggregates: `totalUsers, totalAiProviders/active/premium, totalSubscription, totalActiveSubscriver, totalPayment(PAID), totalRevenue, currentMonthlyRevenue` |

## Environment Variables

| Variable | Used for |
|----------|----------|
| `NODE_ENV`, `PORT` (default 5000), `APP_NAME` | runtime / cookies / listen |
| `DATABASE_URL` | Prisma Postgres + migrations |
| `BACKEND_URL`, `FRONTEND_URL` | CORS origin, callbacks, bKash redirect |
| `BCRYPT_SALT_ROUNDS` | password hashing |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | JWT sign / verify |
| `RADIS_NAME`, `RADIS_PASSWORD`, `RADIS_HOST`, `RADIS_PORT` | Redis (OTP, bKash tokens) |
| `SMTP_USER`, `SMTP_SENDER`, `SMTP_PASSWORD` | Gmail transporter + from address |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | image uploads |
| `TESTER_ADMIN_NAME`, `TESTER_ADMIN_EMAIL`, `TESTER_ADMIN_PASSWORD` | seed admin |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URI` | Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | GitHub OAuth |
| `GROQ_API_KEY`, `ENCRYPTION_KEY` | completions + AES-256-GCM provider keys |
| `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_CALLBACK_URL` | bKash checkout |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe checkout + webhook verify |

## Getting Started
 
```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/multiplex-agent-backend.git
cd multiplex-agent-backend
 
# 2. Install
npm install
 
# 3. Configure env (.env in root, see Environment Variables below)
 
# 4. Database (PostgreSQL reachable via DATABASE_URL)
npx prisma generate
npx prisma migrate dev
# prod: npx prisma migrate deploy
# optional: npx prisma studio
 
# 5. Run
npm run dev         # watch: nest start --watch
npm run start       # single run
npm run build       # nest build -> dist/
npm run start:prod  # node dist/main (after build)
 
# 6. Quality
npm run format      # prettier src/test
npm run lint        # oxlint --type-aware src/ test/
 
# 7. Tests (vitest; no *.spec.ts yet, e2e spec commented out)
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e    # vitest --config ./vitest.config.e2e.ts
 
# 8. Stripe local webhook
npm run stripe:webhook  # stripe listen --forward-to localhost:5000/api/v1/subscription/webhook
```

