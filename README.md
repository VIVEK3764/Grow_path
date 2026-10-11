# Groww Path

A full-stack financial-priority, savings-goal and financial-literacy application. Accounts and records live in Supabase, and Decode analyzes arbitrary financial claims through a server-side OpenAI request. The app records money users have already allocated; it does **not** move money, connect bank accounts, or execute investments.

## Architecture

- **Application:** Next.js 16 App Router, TypeScript, React 19. The refined prototype's CSS and visual components are retained instead of replacing them with a generic Tailwind template.
- **Routes:** `/`, `/login`, `/signup`, `/onboarding`, `/onboarding/goal`, `/onboarding/contribution`, `/path`, `/path/roadmap`, `/goals`, `/goals/new`, `/goals/[id]`, `/decode`, `/decode/history`, `/decode/[id]`, `/profile`, `/explore`, `/investments`, `/learn/[id]`.
- **Backend:** authenticated Next.js Route Handlers under `app/api`; Zod validates every mutation. Server components load private data on each request (no static caching of accounts).
- **Database:** Supabase PostgreSQL. Financial writes run in `mutate_path`, a PostgreSQL transaction. A profile row lock serializes a user's writes. Request UUIDs prevent duplicate contributions. Goal and monthly balances are recomputed inside the same transaction.
- **Authentication:** Supabase email/password and cookie sessions via `@supabase/ssr`; `proxy.ts` refreshes sessions. Server code verifies the user before accessing private data. Returning users skip onboarding. Logout removes the current session.
- **Authorization:** RLS restricts all private tables to `auth.uid() = user_id`. Authenticated users have read access and narrow RPC execution; they cannot directly overwrite balance columns. Every SECURITY DEFINER RPC obtains the caller ID from `auth.uid()`, uses a fixed search path, and filters ownership. The app does not use the service-role key.
- **Path Engine:** `lib/path-engine.ts` produces financial priorities, allocations and simple dates, never security recommendations. Rules are 70/30 safety/goal for NONE, 50/50 for PARTIAL, and 0/100 for ESTABLISHED. With no other active goal, an unestablished cushion receives the baseline. The equivalent SQL rules execute monthly contributions transactionally; update both and their tests when changing allocation rules. Paused goals receive no allocation. Zero plans produce no date estimate.
- **Decode:** `lib/ai/decode.ts` uses the OpenAI Responses API with a strict Zod structured-output schema. It validates before saving, enforces an educational prompt and a conservative advice-pattern backstop, and sends no API secret to the browser. Database-backed limits allow 10 attempts per user per hour, including provider failures. No mock response is substituted.

## Requirements

Node.js **22.14+** and npm; a Supabase project; an OpenAI API key with model access and available billing credit. Production must run a Node-compatible Next.js server (for example Vercel); this is no longer a static Vite export.

## Local setup (PowerShell)

```powershell
cd C:\Users\gkrmv\Desktop\grow_app\groww-path
npm install
# Only if .env.local does not already exist:
Copy-Item .env.example .env.local
```

Open `.env.local`, fill in the values below, apply the migration, then:

```powershell
npm run dev
```

Open **http://127.0.0.1:3000**. The older Vite ports 5173/5174 are not the full-stack app. Restart the server after changing environment settings.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon/publishable key; RLS protects rows |
| `OPENAI_API_KEY` | Server-only OpenAI API key; required for Decode |
| `OPENAI_MODEL` | Structured-output model, default `gpt-4.1-mini`; must be available to your project |
| `APP_ORIGIN` | `http://127.0.0.1:3000` locally; exact HTTPS origin in production |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional, **only** for the explicitly invoked live integration test's disposable-account setup/cleanup. Not used by application routes or components. Never prefix with NEXT_PUBLIC. |
| `SEED_EMAIL`, `SEED_PASSWORD` | Optional existing, confirmed development account for `npm run seed` |

`.env.local` and other secret environment files are ignored by Git. Do not place any key in client components, source files, or chat messages. Only the Supabase URL and public key belong in the browser bundle.

## Exact Supabase setup

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API** (or the project's Connect dialog), copy the project URL and public anon/publishable key into `.env.local`.
3. Open **SQL Editor → New query**. Paste the complete file `supabase/migrations/202610110001_initial.sql` and click **Run**. Run it once on a fresh project. It is wrapped in a transaction; a failure rolls back the migration. Existing projects need their schema reviewed before applying it.
4. In **Authentication → Providers**, enable Email with password sign-in. Keep email confirmation enabled for a production-like flow; configure SMTP before a public launch.
5. In **Authentication → URL Configuration**, set Site URL to `http://127.0.0.1:3000` and add `http://127.0.0.1:3000/auth/callback` to Redirect URLs. If using `localhost` instead, use it consistently in these settings and `APP_ORIGIN`.
6. Start the app, register, confirm the email in the **same browser used to sign up** (PKCE), and complete onboarding. If confirmation opens on a different browser/device, finish confirmation and sign in normally on the original browser.
7. Register a second account and run the isolation cases in `EVALS.md`.

For a project already managed by the Supabase CLI, put this migration in that project's migrations directory, then run `npx supabase link --project-ref YOUR_PROJECT_REF` and `npx supabase db push`. Do not apply the same schema twice through different mechanisms.

### Schema

| Table | Main data and constraints |
| --- | --- |
| `profiles` | One row per auth user; name, age, life stage, income type/amount, comfortable contribution, safety status/target, persisted onboarding step and completion |
| `goals` | Owner, name/category, target/current amount, target date, priority, ACTIVE/PAUSED/COMPLETED; one safety goal per user |
| `contributions` | Owner, goal, amount, type, request UUID, timestamp; unique owner/request/goal prevents duplicate writes |
| `monthly_plans` | One row per owner/month, baseline, nullable override, recorded total; months use Asia/Kolkata |
| `path_steps` | Owner, allowed priority type, title/description, order, status and JSON metadata; regenerated from financial records |
| `decode_history` | Owner, original input, classification, validated JSON analysis, creation time |
| `decode_limits` | Atomic per-user hourly request counter |
| `learning_progress` | One completion per user/lesson |

Goal deletion asks for confirmation and removes the goal, while preserving its contribution ledger with a null goal reference and preserving monthly totals. Marking a goal complete is an explicit user status; it does not invent contributions. Safety status can be self-reported independently of tracked money; the UI makes this distinction explicit.

## Exact OpenAI setup

1. Create an API key for your project in the [OpenAI platform](https://platform.openai.com/api-keys); enable API billing/credit and appropriate model access.
2. Set `OPENAI_API_KEY` in `.env.local` **without** a `NEXT_PUBLIC_` prefix.
3. Keep `OPENAI_MODEL=gpt-4.1-mini`, or choose another available model supporting Responses structured outputs.
4. Restart Next.js, sign in, and open `/decode`. Enter a new claim and submit. A successful analysis is saved and opens `/decode/[id]`.
5. Check `/decode/history`, refresh, and confirm the saved record remains. Missing keys/provider failures show a retryable error, not a fabricated result.

Decode sends the submitted claim to OpenAI (`store: false`) and stores the validated result in the user's Supabase history. The app clearly tells users not to include account details. Analysis is AI-generated, can be wrong, and does not check live sources. Prompting and a small pattern guard are not a guarantee of safe model behavior: run the manual AI evaluations before launch.

## Tests and checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` uses Node's test runner and a real embedded PostgreSQL engine (PGlite) **only in tests**. It applies the SQL migration and exercises RLS, user isolation, idempotency, balances, monthly allocation, adjustments, goal updates/deletion and rate limits. No test storage is used as an application fallback.

With a local server already running, `node scripts/smoke.mjs` checks unauthenticated HTTP behavior, redirects, invalid inputs and cross-origin rejection without creating users or calling AI.

For optional tests against your real Supabase project:

```powershell
npm run test:integration
```

This test requires the URL, public key and service-role key. It creates two disposable confirmed test accounts, checks login/session refresh, persistence and cross-user isolation, then deletes only those accounts in `finally`. It skips when those credentials are absent. It does not test email delivery or make paid OpenAI calls. See `EVALS.md` for the full browser journey and AI cases.

## Optional seed

Create a separate, confirmed empty development account. Set `SEED_EMAIL` and `SEED_PASSWORD`, then:

```powershell
npm run seed
```

This seeds Rohan's profile, a MacBook goal, ₹34,500 in goal contributions and ₹6,000 in safety contributions. These historical-example amounts are recorded **this month** by the seed, so that month's total is ₹40,500, not a fabricated ₹1,500. It refuses to overwrite an account with goals. Normal signups start with zero tracked savings, and the seed is never run automatically.

## Production build and deployment

```powershell
npm run build
npm start
```

For Vercel, set the project root to `groww-path`, select Next.js, and set the environment variables **before building**. Add the deployed HTTPS origin and `/auth/callback` to Supabase's URL allowlist; set `APP_ORIGIN` to that origin. Apply the migration to the intended production Supabase project before enabling signups. Do not deploy the old `dist` output or use static hosting.

Before launch: run the live evaluations, configure SMTP and Supabase auth rate limits, set OpenAI spending limits, verify RLS in the production database, test recovery/email confirmation, review privacy/retention requirements, and set monitoring/backups. Keep all service keys server-side. This project has not been deployed by this change.

## Verification and limitations

See `VERIFICATION.md` for commands actually run and their results. Unit/database tests are not a claim that live signup, email, or AI calls passed; those require configured external services. Missing configuration is a deliberate setup screen with no fake fallback.

History views show the latest 100 contributions/analyses. Financial values are INR records, not an audited bank ledger. Goal date estimates exclude returns and cannot predict variable income. There is no password-recovery UI, account-deletion UI, payment gateway or financial-account integration in this scope.

The production dependency audit reported zero vulnerabilities. The development lint dependency tree reports a `braces` advisory with no compatible fix; npm proposes downgrading the Next ESLint preset to 14.2.35. That incompatible downgrade was not applied. Do not lint untrusted repositories/patterns with this toolchain until the upstream advisory is resolved.

Implementation references: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
