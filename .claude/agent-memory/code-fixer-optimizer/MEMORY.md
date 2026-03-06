# Code Fixer/Optimizer Agent Memory

## Project: SGS Next.js 16 + Supabase

### Key Architectural Conventions
- All API routes use fetch-based Supabase REST API. No Supabase JS client in API routes.
- Shared helpers are in `app/api/_supabase.ts`: exports `BASE`, `KEY`, `headers`, `requireAuth`, `toBool`, `SessionUser`
- Auth cookie: `sgs_user` (httpOnly, JSON: `{ id: number, name: string, isAdmin: boolean }`)
- `requireAuth()` reads `sgs_user` cookie and returns `SessionUser | null`
- `toBool()` normalizes boolean values from DB (handles true/1/"true"/"t"/"yes")

### Security Patterns Established
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` fallback MUST NOT exist anywhere — service role key is server-only
- All protected API routes must call `requireAuth()` at the top
- Admin-only routes additionally check `if (!user.isAdmin) return 403`
- `/api/session` validates the user against the DB (reads fresh `istadmin`) instead of blindly trusting the cookie
- `/api/buchungen` DELETE validates email ownership before deleting

### Fixed Issues (2026-03-05)
- K2: Removed NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY fallback from all files
- K1: Added requireAuth() to all protected API routes
- K3: Session route now does DB lookup to validate isAdmin
- K4: Buchungen DELETE now validates email ownership
- K6: Kassenbuch uses encodeURIComponent for all URL params
- K7: kasse/route.ts converted from Supabase JS client to fetch pattern
- W1: logout now deletes sgs_user (httpOnly) cookie correctly
- W2: middleware now checks sgs_user cookie, expanded to all protected paths
- W3: All duplicate BASE/KEY/headers definitions replaced with shared import
- W4: artikel/[id] PUT now filters to only allowed fields
- W5: dashboard `today` moved inside Page() function
- M1: toBool() centralized in _supabase.ts
- M4: EditClient.tsx refactored to React state (no more document.getElementById)
- M5/M6: Deleted backup files, disabled middleware, dead lib/supabase.ts
- M6: auth layout no longer nests html/body tags
- M7: removed duplicate Suspense wrapper in bahnbuchung-public
- G1: removed duplicate pb-* classes in app layout
- G6: after-login cookie names cleaned up to ["sgs_user", "sgs_session"]

### Pre-Existing Issues (NOT from our changes)
- ESLint: circular reference in config (config tool issue, not code issue)
- TypeScript: `artnr` vs `anr` type mismatch in artikel/page.tsx (pre-existing)
- TypeScript: JSX namespace in kasse/page.tsx (pre-existing)

### Database Schema Notes
- `benutzer` table: `id`, `name`, `kennwort`, `istadmin` (bool), `erlaubter_rechner_hash`
- `benutzer.istadmin` is stored as PostgreSQL boolean, but can arrive as various types — always use toBool()
- Non-admin users require device approval via `erlaubter_rechner_hash`

### File Paths
- Shared Supabase helpers: `app/api/_supabase.ts`
- Auth cookie name: `sgs_user`
- Session API: `app/api/session/route.ts`
- Login API: `app/api/login/route.ts`
- Logout API: `app/api/logout/route.ts`
- Middleware: `middleware.ts`
