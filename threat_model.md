# Threat Model

## Project Overview

HobbyLink is a production-facing Next.js 15 App Router application for hobby-based social networking and offline events. It uses React 19 on the frontend and Supabase for authentication, Postgres data storage, row-level security, storage buckets, realtime features, and deployable Edge Functions. Optional production integrations include Stripe for subscriptions, Resend for transactional email, VAPID/Web Push for notifications, and Sentry for observability.

Primary users are end users of the social/event platform, administrators using `/admin`, public API consumers using bearer API keys, and trusted third-party services such as Stripe webhooks. In production, `NODE_ENV` can be assumed to be `production`, TLS is handled by the deployment platform, and mockup sandbox environments are not considered production-reachable unless code paths explicitly deploy there.

## Assets

- **User accounts and active sessions** — Supabase-authenticated sessions, password-reset and OAuth flows, and admin eligibility derived from the `profiles.is_admin` flag. Compromise enables account takeover or privileged dashboard access.
- **Private user data** — profile metadata, social graph, DMs, account-export bundles, notifications, blocks, reports, and phone-verification state. Exposure affects user privacy and trust.
- **Event data and participation state** — event details, invitations, participant status, event discussions, galleries, reviews, and organizer actions. Unauthorized modification can disrupt real-world meetups.
- **Public API credentials** — bearer keys stored hashed in `api_keys`, plus associated scopes/tier/rate-limit state. Leakage or weak validation enables scraping or abuse of the read API.
- **Billing and subscription state** — Stripe checkout sessions, webhook-driven subscription updates, and stored provider IDs. Tampering can grant premium access or disrupt billing.
- **Application secrets and privileged credentials** — `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Resend keys, VAPID private key, and any Edge Function secrets. Exposure or misuse bypasses normal row-level security.

## Trust Boundaries

- **Browser / mobile client ↔ Next.js server** — all route handlers, server actions, and server components must treat client input as untrusted, even when a user is authenticated.
- **Next.js server ↔ Supabase session-scoped client** — most app queries execute under the caller's auth context and rely on RLS. Server code must not assume client-only checks are sufficient.
- **Next.js server ↔ Supabase service-role client** — selected helpers and API routes intentionally bypass RLS. Any missing scope/filter logic here can become high-impact data exposure or privilege escalation.
- **Public API consumers ↔ `/api/public/v1/*`** — these endpoints trust bearer API keys rather than browser sessions and must validate keys, scopes, and rate limits independently.
- **External services ↔ webhook/integration endpoints** — Stripe webhook traffic crosses an untrusted boundary and must be authenticated cryptographically before changing billing state.
- **Supabase Edge Functions ↔ database/storage** — functions under `supabase/functions/` are production-relevant if deployed and typically operate with elevated credentials, so their inputs and outputs remain security-sensitive.
- **Public / authenticated / admin boundaries** — marketing and public event/community surfaces differ materially from authenticated features and `/admin` controls; enforcement must happen server-side, not only in layout or client code.

## Scan Anchors

- **Production entry points:** `app/**/page.tsx`, `app/**/route.ts`, `middleware.ts`, `app/auth/callback/route.ts`, and server actions under `app/**/actions.ts` and `lib/**/actions.ts`.
- **Highest-risk code areas:** `app/admin/**`, `app/api/public/v1/**`, `app/api/billing/**`, `app/api/stripe/**`, `lib/public-api.ts`, `lib/supabase/**`, service-role helpers in `app/(main)/settings/actions.ts`, `app/(main)/matching/actions.ts`, and `lib/referrals/actions.ts`.
- **Production-relevant backend logic:** SQL migrations in `scripts/*.sql` and deployable handlers in `supabase/functions/**` because they define RLS, storage policy, and privileged execution behavior.
- **Usually dev-only and lower-priority:** `tests/`, `docs/`, `.next/`, `.local/`, and generated artifacts. `scripts/*.sql` are not dev-only because they define production database policy.

## Validated Attack Patterns

- **Business rules enforced only in Next.js are insufficient** — if rules such as match-only messaging, event capacity/waitlists, or API-key plan limits are not also enforced in RLS or DB-side constraints, authenticated users can bypass the app with direct Supabase calls.
- **Public storage buckets override table-level privacy assumptions** — if a table is access-controlled but its backing bucket is public, the file itself must be treated as public regardless of app-layer queries.
- **Supabase Edge Functions must authenticate callers explicitly** — deployable functions that use the service-role key cannot rely on documentation comments or scheduler intent; they must verify a trusted bearer or caller role before doing privileged work.
- **`SECURITY DEFINER` functions in exposed schemas are privileged entry points** — any RPC left callable from `public` must either validate caller authorization internally or have execute privileges revoked from untrusted roles.
- **User-writable metadata used in trust decisions is untrusted** — rows such as API keys, plan/tier markers, or revocation state must not be both user-editable and later consumed as authoritative security state by server-side code.

## Threat Categories

### Spoofing

Authentication is session-cookie based through Supabase SSR, with API-key auth for `/api/public/v1/*` and Stripe signature auth for `/api/stripe/webhook`. Protected routes, route handlers, and especially Server Actions must verify the current user and any required role every time they mutate data. Admin-only operations MUST re-check `profiles.is_admin` server-side rather than relying on page routing, layouts, or hidden UI.

### Tampering

Users can create posts, messages, events, invitations, reports, uploads, and billing requests. All user-controlled fields, IDs, URLs, storage paths, and redirect targets MUST be validated on the server. Business rules such as who may message whom, who may upload or delete event photos, who may join or cancel events, and where Stripe should redirect after checkout MUST be enforced server-side and must not trust client state, headers, or comments about intended behavior.

### Information Disclosure

This project stores sensitive social and messaging data, profile visibility settings, invitation state, exports, and privileged operational metadata. Session-scoped Supabase access should rely on RLS, but any service-role path MUST explicitly filter results to the intended audience because it bypasses RLS entirely. API responses, download endpoints, logs, analytics ingestion, and admin/system pages MUST avoid exposing secrets, internal errors, or data outside the caller's authorized scope.

### Denial of Service

High-frequency actions include messaging, matching, reports, presence heartbeats, analytics ingest, and public API access. Public-facing and abuse-prone endpoints MUST have effective production-grade rate limiting or bounded work. Security-sensitive throttles MUST not silently fail open in a way that allows easy brute-force, scraping, or spam once the backing limiter or deployment topology changes.

### Elevation of Privilege

The most important privilege boundaries are regular user → admin, session user → service-role operations, and API key → full database access. Any action that uses `SUPABASE_SERVICE_ROLE_KEY`, admin-only tables, webhook-driven subscription updates, or privileged auth admin APIs MUST constrain the operation to the authenticated caller's intended resources. Missing filters or weak checks in these paths can turn minor input issues into full data access or account-impacting privilege escalation.

### Repudiation

Admin moderation, suspension, feature-flag changes, billing changes, and report resolution affect user rights and platform integrity. These actions SHOULD preserve attributable actor identity and timestamps in the database so abuse or mistakes can be investigated later. When privileged actions lack durable actor attribution, operational recovery and dispute resolution become much harder.
