# Full-stack conversion

## Retained

- Original Groww-inspired navigation, typography, card/progress styling and mobile layouts (`src/style.css`, `src/refinements.css`).
- Onboarding stages, Path dashboard, roadmap, goals, contribution/adjustment sheets, educational Decode layout and restrained styling.
- A recoverable source snapshot of the former Vite entrypoint is outside the app at `../groww-path-ui-before-fullstack.zip`.

## Replaced

- Removed `src/main.jsx` and Vite `index.html`; no hardcoded user, balances, fake timers or sample Decode responses remain in the application entrypoint.
- `package.json` and lockfile now install Next.js, TypeScript, Supabase SSR, OpenAI, Zod, lint and test tooling.
- `.openai/hosting.json` retains the existing Site identity, but its obsolete static `dist` deployment declaration is removed. A Node-compatible Next.js host is required; no new deployment was attempted.

## Added

| Files | Responsibility |
| --- | --- |
| `app/layout.tsx`, `app/app.css`, `components/shell.tsx` | Shared responsive shell and dynamic server rendering |
| `app/**/page.tsx` | Actual URL routes for auth, onboarding, goals, Path, Decode, profile, learning and supporting pages |
| `app/api/[...resource]/route.ts` | Validated authenticated data mutations and Decode |
| `app/api/auth/[action]/route.ts`, `app/auth/callback/route.ts` | Email/password sessions and confirmation callback |
| `components/auth-form.tsx`, `onboarding.tsx`, `goal-form.tsx`, `goal-management.tsx`, `profile-form.tsx` | Persistent account/profile/goal forms |
| `components/money-actions.tsx`, `goal-card.tsx` | Database-backed contributions, adjustments and dynamic balances |
| `components/decode-form.tsx`, `decode-result.tsx` | Arbitrary claim input and validated saved analyses |
| `components/ui.tsx`, `lesson-action.tsx` | Accessible native dialogs, loading/error feedback and saved learning progress |
| `lib/server.ts`, `lib/http.ts`, `lib/supabase/*`, `proxy.ts` | Per-request authenticated data access, HTTP errors and session refresh |
| `lib/path-engine.ts`, `lib/validation.ts`, `lib/format.ts`, `lib/lessons.ts` | Deterministic business logic and validation, independent of presentation |
| `lib/ai/decode.ts`, `lib/ai/policy.ts` | Server-only structured OpenAI request and response backstop |
| `types/domain.ts` | Typed domain entities |
| `supabase/migrations/202610110001_initial.sql` | Tables, constraints, RLS, transaction RPCs and rate limit |
| `tests/*.test.ts`, `tests/integration/supabase.test.ts` | Business rules, real PostgreSQL/RLS tests, optional live Supabase checks |
| `scripts/seed.mjs`, `scripts/smoke.mjs` | Explicit development seed and non-mutating HTTP checks |
| `.env.example`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore` | Runtime/configuration and secret-file protection |
| `README.md`, `EVALS.md`, `VERIFICATION.md` | Exact setup, acceptance cases and evidence |

External credentials are not present in source control. Normal accounts never use the optional seed automatically.
