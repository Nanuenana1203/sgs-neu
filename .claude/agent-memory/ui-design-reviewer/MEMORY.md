# UI Design Reviewer Memory - SGS Project

## Project Overview
SGS = Schiesssportverein-Verwaltungssystem (shooting sports club management)
Next.js 16 App Router + Tailwind CSS v4, TypeScript
Three route groups: (auth), (app), (standalone)

## Current Color Palette (as found in code)

Primary blue: #2563eb / bg-blue-600
Primary hover: #1d4ed8 / bg-blue-700
Background gray: #f3f4f6 / bg-slate-100 / bg-gray-50
White panels: #fff / bg-white
Border: #e5e7eb / border-slate-200 / border-gray-200
Text muted: #6b7280 / text-slate-500 / text-gray-500
Text dark: #111 / text-slate-900 / text-slate-800
Danger: #ef4444 / bg-red-600
Success: bg-green-600
Badge amber: #fef3c7 bg, #92400e text

## Styling Method Inconsistency (CRITICAL)
- (app) layout uses Tailwind classes exclusively
- (standalone) pages MIX inline styles and Tailwind - inconsistent within the same page
- Login page uses 100% inline styles (no Tailwind at all)
- dashboard.css defines custom CSS classes (.page-wrap, .card, .hdr, .btn, etc.) - these are NOT used by the main standalone pages (they use their own mix)
- Mitglieder page: inline styles for table, inline styles for buttons, NO Tailwind
- Artikel page: mix (Tailwind for layout, inline styles for table cells)
- Bahnen page: Tailwind for layout, mixed inline for action buttons
- Benutzer page: same pattern as Artikel

## Typography Inconsistency
- Dashboard h1: text-3xl font-bold
- Kasse h1: text-3xl font-semibold
- Artikel h1: text-3xl font-semibold text-center text-slate-800
- Mitglieder h1: inline style fontSize:28 fontWeight:800 textAlign:center
- Bahnen h1: text-3xl font-extrabold (different weight!)
- Kassenbuch h1: text-2xl font-semibold (different size!)
- Kassenbestand h1: text-xl md:text-2xl font-semibold (responsive variant)
- Bahnbuchung h1: text-3xl font-semibold

## Button Inconsistency
- Primary: bg-blue-600 text-white (Artikel, Benutzer, Kasse) vs bg-blue-600 (Bahnen, no extra classes)
- Zurück buttons: bg-slate-200 (Artikel, Benutzer) vs bg-gray-200 (Bahnen) vs inline #e5e7eb (Mitglieder) vs border rounded (Kassenbestand)
- Zurück in Kassenbuch: absolute positioned top-right corner - unique pattern
- Action icons: emoji characters (pencil, trash) as buttons - not accessible

## Emoji Icons Used as Action Buttons (Problem)
All table action columns use raw emoji: ✏️ and 🗑️
- These have no consistent size, no hover state, poor accessibility
- Mitglieder, Artikel, Bahnen, Benutzer all share this pattern

## Card/Container Patterns
- Standalone pages use rounded-xl border bg-white (Kasse, Kassenbuch, Benutzer)
- Artikel uses rounded-2xl border with shadow-sm
- Bahnen uses simple border rounded bg-white (no shadow)
- Kassenbestand uses bg-white/70 (semi-transparent)

## Table Patterns
- thead background: bg-gray-50 (most) vs bg-slate-50 (Artikel, Benutzer) vs bg-gray-100 (Kassenbuch)
- cell padding: Tailwind p-3 (Bahnen) vs inline padding:12 (Mitglieder, Artikel, Benutzer)
- row separator: border-t hover:bg-blue-50 (Kasse) vs borderTop inline (Mitglieder, Artikel, Benutzer)
- Kassenbuch: uses border on each cell (old HTML table style) - differs from all others

## Page Structure Differences
- Standalone pages are full-page with their own header+content (no shared nav)
- Dashboard (app) has sidebar navigation in (app)/layout.tsx
- Kasse/Kassenbuch both have member-search-first flow
- Bahnbuchung-public is the only public-facing page (accessible without login)

## Known Issues to Address
1. No design token system / CSS variables used consistently
2. Login page entirely inline styles - disconnected from design system
3. Emoji action buttons across all admin tables
4. H1 font weight varies: bold / semibold / extrabold across pages
5. Zurück button placement varies: toolbar / absolute top-right / inline
6. Kassenbuch table uses borders on ALL cells (old style), others use row-only separators
7. globals.css only has body padding (160px) - excessive padding for copyright badge
8. dashboard.css defines utility classes that standalone pages do NOT use
9. Storno state in Kasse changes entire page background - jarring UX

## Approved Design Decisions (none yet - first analysis)
