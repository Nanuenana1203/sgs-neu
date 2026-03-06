# Code Reviewer Memory - SGS Projekt

## Projekt-Architektur
- Next.js 16 App Router mit Route Groups: (auth), (app), (standalone)
- Supabase REST API via fetch (Service Role Key), NICHT JS Client in API-Routes
- Auth: `sgs_user` httpOnly cookie (JSON mit id, name, isAdmin), 8h TTL
- Middleware prueft nur `sgs_session` (non-httpOnly Cookie), NICHT `sgs_user`
- `app/api/_supabase.ts` definiert BASE, KEY, headers -- aber viele Routes definieren diese lokal statt zu importieren

## Bekannte kritische Probleme (Stand: 2026-03-05)
- **Session-Cookie Vertrauensproblem**: `sgs_user` Cookie-Inhalt wird client-seitig vertraut (isAdmin aus Cookie gelesen, nicht aus DB validiert)
- **Keine serverseitige Auth in API-Routes**: Die meisten API-Routes (artikel, mitglieder, bahnen, users, zeitregeln) pruefen KEIN Cookie/Session -- jeder mit Zugang kann CRUD-Operationen ausfuehren
- **Nur `/api/withdrawal` prueft Session** -- alle anderen schreibenden API-Routes sind ungeschuetzt
- **Middleware falsch**: Prueft `sgs_session` Cookie, aber Login setzt `sgs_user` als httpOnly -- `sgs_session` wird client-seitig als non-httpOnly gesetzt
- **`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`** Fallback in vielen Dateien -- Service Role Key darf NIEMALS public sein
- **Kasse GET Route** (`/api/kasse/route.ts`) nutzt Supabase JS Client statt fetch-Pattern

## Code-Duplizierung
- BASE/KEY/headers werden in ~15 Dateien lokal definiert statt aus `_supabase.ts` importiert
- `isAdmin`/`istadmin` Boolean-Parsing wird an mindestens 6 Stellen dupliziert
- Mitglieder-Suchkomponente identisch in Kasse und Kassenbuch kopiert

## TypeScript-Probleme
- Viele `any`-Typen in API-Routes und Components
- `app/api/mitglieder/[id]/route.ts` Zeile 77: PATCH export ohne Typ-Annotation (`req, ctx` untyped)
- `app/(auth)/page.tsx` Zeile 11: `onSubmit(e)` ohne Typ-Annotation

## Backup/Tote Dateien
- `page.backup.loop.tsx`, `page.backup.loopfix.tsx`, `page.before-storno.tsx`, `page.kacheln-border-backup.tsx`, `page.preisfix.tsx`
- `route.backup.kachel.ts`, `route.backup.preise.ts`
- `middleware.disabled.ts`
