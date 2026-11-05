# BusyFrnd — hyper-local marketplace + AI storefront builder

A monorepo containing a **customer marketplace** (web + mobile), a **vendor studio** with a voice-first AI buddy (web + mobile),
an **admin review portal**, and the **NestJS/PostgreSQL backend** behind all of them. Everything is TypeScript.

| App | Path | Stack | Port |
|---|---|---|---|
| Backend API | `apps/api` | NestJS 11, Prisma 6, PostgreSQL 16 | 4000 |
| Customer website | `apps/customer-web` | Next.js 15 (App Router) | 3000 |
| Vendor website | `apps/vendor-web` | Next.js 15 | 3001 |
| Admin portal | `apps/admin-web` | Next.js 15 | 3002 |
| Customer mobile app | `apps/customer-mobile` | Expo SDK 53 / React Native 0.79 (Android + iOS) | – |
| Vendor mobile app | `apps/vendor-mobile` | Expo SDK 53 / React Native 0.79 (Android + iOS) | – |

Shared packages: `packages/shared` (types, pricing rules, plans, 64 layout templates, en/hi/ta strings, geo), `packages/api-client` (typed fetch client used by all 5 front-ends),
`packages/web-ui` (React: provider, store renderer, voice hook, CSS), `packages/mobile-core` (React Native: provider, UI kit, store renderer, voice, location, payments).

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # defaults work: mock OTP + mock payments + rule-based AI fallback
pnpm db:up                                   # PostgreSQL via docker compose (or point DATABASE_URL at your own)
pnpm --filter @busyfrnd/api prisma:generate
pnpm db:migrate && pnpm db:seed              # seeds admin, demo vendor, demo customer, 3 published demo stores
pnpm build:packages
pnpm dev:api                                 # http://localhost:4000/api/health
pnpm dev:customer-web & pnpm dev:vendor-web & pnpm dev:admin-web
bash scripts/smoke.sh                        # end-to-end API check (login → cart → pay → vendor → admin)
```

**Demo logins (seed data, mock OTP is always `123456`)**

| Role | Credentials |
|---|---|
| Customer | phone `9999900002`, OTP `123456` |
| Vendor | phone `9999900001`, email `demo.vendor@busyfrnd.app`, SMS OTP `123456`, email OTP `123456` (on the Pro plan) |
| Admin | `admin@busyfrnd.app` / `admin12345` (change via `ADMIN_EMAIL`/`ADMIN_PASSWORD` before seeding) |

Seed stores are placed around Chennai (13.0827, 80.2707), which is also the default location in the apps. Set your location in the app to see them elsewhere.

### Mobile apps
```bash
pnpm dev:customer-mobile      # Expo dev server (use a development build: voice + push need native modules, not Expo Go)
pnpm dev:vendor-mobile
```
On an Android emulator the API is `http://10.0.2.2:4000`. On a real phone use your machine's LAN IP.
Both apps have a **Server settings** panel on the login screen to point at any API URL, so a pre-built APK can be tested against your own server without rebuilding.

## Pre-built binaries
* **Android (APK)** – `scripts/build-mobile.sh android [customer|vendor|all]` builds release APKs into `prebuilt/android/` (needs JDK 17 + Android SDK).
  `API_URL=https://api.yourdomain.com scripts/build-mobile.sh android all` bakes your API address in. `ANDROID_ARCHS` selects ABIs (default `arm64-v8a,x86_64`).
* **iOS** – cannot be built on Linux/Windows. `scripts/build-mobile.sh ios` (macOS + Xcode) produces simulator `.app` bundles. Installable device / TestFlight builds need an
  Apple Developer account: `pnpm --filter @busyfrnd/customer-mobile build:production` (EAS; profiles in each app's `eas.json`).
* **CI** – `.github/workflows/mobile-builds.yml` builds Android APKs on Ubuntu and iOS simulator apps on macOS and uploads them as artifacts.
* Store-ready signed bundles (AAB/IPA): EAS `production` profile. Replace `app.busyfrnd.*` bundle IDs and add your EAS `projectId`.

## What's implemented

**Customer** – mobile-number OTP login (email optional) · nearby stores within a user-set radius (1–50 km, default 20) via bounding-box + haversine ·
store search and cross-store product/service search · **one cart per store** · checkout with **pickup (no delivery fee) or delivery** · **full payment, or part payment only if the store enabled it** ·
Cashfree hosted checkout · order tracking · "ready for pickup" notifications (in-app + Expo push) · English / हिन्दी / தமிழ் · settings (radius, language, location).

**Vendor** – mobile **and** email OTP both mandatory · voice onboarding in en/hi/ta: speak → AI drafts name, category, items, prices, delivery → review → pick layout from live previews → location → create ·
every store gets its own template (64 layouts: 3 Basic / 20 Plus / 41 Pro, each a different section structure + palette) · item management with stock toggles ·
configurable **delivery fee** (flat, low-order tier e.g. ₹50 below ₹199, free-above threshold), **platform fee, handling charge, visiting charge** (services only), **part-payment toggle + %** ·
**pickup / delivery toggles — at least one must stay on** (enforced in API and UI) · publish to **web, app, or both** · order board with status transitions + customer notifications ·
**AI Buddy** voice assistant answering sales questions in the vendor's language · subscriptions.

**Admin** – review queue → full storefront preview (exactly what customers see) → approve / reject (with feedback) / suspend / reinstate · vendors (change plan) · customers · orders · platform stats.
A vendor **cannot publish until an admin approves** the store; editing the name/description/images of a live store sends it back to review.

**Plans** – 60-day trial (all layouts, limited AI tokens, 2 stores) → Free (basic layouts, web only, tiny AI quota) · **Plus** (20+ layouts, 5 stores) · **Pro** (all layouts, 10 stores, most tokens).
Limits enforced in the API (layout tier, published-store count, app channel, AI token quota). **Prices are placeholders** in `packages/shared/src/plans.ts`.

## Architecture notes
* **Money** is integer paise everywhere. All fee logic lives in one pure, tested function (`computePrice` in `packages/shared/src/money.ts`) used by the API at quote/checkout and by the UIs for display.
* **Auth** – the API issues its own JWT. `AUTH_PROVIDER=mock` (default) uses built-in OTP with pluggable `SmsProvider`/`EmailProvider` (`apps/api/src/auth/providers.ts`); the dummy SMS provider logs the OTP
  and accepts `MOCK_OTP_CODE`. For **Clerk**, set `AUTH_PROVIDER=clerk` + `CLERK_SECRET_KEY` and have the apps call `POST /api/auth/clerk/exchange` with a Clerk session token
  (the exchange endpoint requires a verified phone, plus a verified email for vendors). The Clerk SDK UI is **not** wired into the front-ends yet — see "Not done" below.
* **Payments** – Cashfree PG v2023-08-01. The API creates the order, serves a small hosted checkout page (`/pay/checkout`) that all clients open (in-app browser on mobile), verifies the
  `x-webhook-signature` HMAC on the webhook, and reconciles with Cashfree's order status on return/poll. Without keys a **mock gateway** with success/failure buttons is used. Vendor subscriptions use the same flow.
  Redirect targets are allow-listed (`busyfrnd-*://` and `CORS_ORIGINS`).
* **AI** – Anthropic API (`ANTHROPIC_API_KEY`, model via `AI_MODEL`). Two endpoints: `/ai/onboarding` (transcript → structured store draft) and `/ai/assistant` (answers only from the vendor's own sales data, replies in their language).
  Token usage is metered per vendor against the plan quota. With no key, a deterministic rule-based fallback keeps the flows working (lower quality). Speech-to-text runs **on device/browser**
  (`expo-speech-recognition` / Web Speech API) and replies are spoken with the platform TTS — no audio is sent to the backend.
* **Data model** – see `apps/api/prisma/schema.prisma`. Cart is unique on (user, store). Orders snapshot line items and fees at checkout.

## Environment variables
See `apps/api/.env.example`. Front-ends: `NEXT_PUBLIC_API_URL` (web), `EXPO_PUBLIC_API_URL` (mobile). Add every web origin to `CORS_ORIGINS` (it is also the post-payment redirect allow-list).

## Deploying
* API: `docker build -f apps/api/Dockerfile -t busyfrnd-api .` (runs `prisma migrate deploy` on start) · set `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_API_URL`, Cashfree keys, `CORS_ORIGINS`.
  Set Cashfree's webhook URL to `${PUBLIC_API_URL}/api/payments/cashfree/webhook`.
* Websites: each is a standard Next.js app (Vercel or `next start`).

## Honest status / not done
* **Not verified on real devices or simulators.** The mobile apps were type-checked, bundled with Metro for Android and iOS, and native Android projects were generated/compiled in this repo's build environment, but nothing was run on a phone.
  Voice recognition, push notifications and the in-app payment browser in particular need a device test.
* **Cashfree is untested against the live sandbox** (no credentials here); the mock gateway path is what was exercised end to end. Webhook signature verification has unit tests.
* **Clerk UI** is not integrated in the apps; only the server-side exchange is implemented (needs your Clerk instance; note Clerk's SMS coverage/DLT for India must be confirmed with Clerk).
* **SMS DLT provider**: only the dummy provider exists; implement `SmsProvider` for MSG91/Twilio/etc. before launch. Email OTP uses SMTP (`EMAIL_PROVIDER=smtp`, `SMTP_URL`) or logs in mock mode.
* **Voice-driven layout choice**: layouts are chosen by tapping live previews (voice drives the profile/items/reports, not the layout picker).
* Vendors cannot upload product images yet (image URLs are supported in the API; placeholders are shown). No refunds flow for cancelled paid orders. No real delivery-agent tracking (vendor marks "out for delivery").
* Plan prices, 60-day trial length (`TRIAL_DAYS`), token quotas and the template catalogue are starting points to tune.
* Only the pure fee/geo/plan logic and a few units have automated tests; there is an end-to-end API smoke script (`scripts/smoke.sh`) but no UI tests.
