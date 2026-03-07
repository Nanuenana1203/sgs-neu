import { NextResponse } from "next/server";
import { BASE, KEY, headers, requireAuth, toBool } from "../../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* ---------- GET ---------- */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!BASE || !KEY)
    return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  const { id } = await ctx.params;

  const url = `${BASE}/rest/v1/artikel?id=eq.${encodeURIComponent(id)}`;
  const r = await fetch(url, { headers, cache: "no-store" });
  const t = await r.text();

  if (!r.ok)
    return NextResponse.json(
      { ok: false, where: "select", status: r.status, detail: t.slice(0, 400) },
      { status: 502 }
    );

  const rows = JSON.parse(t || "[]");
  return NextResponse.json({ ok: true, artikel: rows[0] ?? null });
}

/* ---------- PUT ---------- */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (!BASE || !KEY)
    return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  const { id } = await ctx.params;
  const body: Record<string, unknown> = await req.json().catch(() => ({}));

  if (!body || Object.keys(body).length === 0)
    return NextResponse.json({ ok: false, error: "EMPTY_PATCH" }, { status: 400 });

  // Only allow known fields — no arbitrary column injection
  const patch: Record<string, unknown> = {};
  if (body.bezeichnung !== undefined) patch.bezeichnung = String(body.bezeichnung).trim();
  if (body.artnr !== undefined) patch.artnr = body.artnr == null || body.artnr === "" ? null : String(body.artnr);
  if (body.kachel !== undefined) patch.kachel = toBool(body.kachel);
  if (body.aktiv  !== undefined) patch.aktiv  = toBool(body.aktiv);
  if (body.artikelgruppe !== undefined) patch.artikelgruppe = body.artikelgruppe ? String(body.artikelgruppe) : null;
  for (let i = 1; i <= 9; i++) {
    const key = `preis${i}` as keyof typeof body;
    if (body[key] !== undefined) patch[key] = numOrNull(body[key]);
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ ok: false, error: "EMPTY_PATCH" }, { status: 400 });

  const url = `${BASE}/rest/v1/artikel?id=eq.${encodeURIComponent(id)}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });

  const t = await r.text();
  if (!r.ok)
    return NextResponse.json(
      { ok: false, where: "update", status: r.status, detail: t.slice(0, 400) },
      { status: 502 }
    );

  const rows = JSON.parse(t || "[]");
  return NextResponse.json({ ok: true, artikel: rows[0] ?? null });
}

/* ---------- PATCH alias ---------- */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return PUT(req, ctx);
}

/* ---------- DELETE ---------- */
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (!BASE || !KEY)
    return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  const { id } = await ctx.params;

  const url = `${BASE}/rest/v1/artikel?id=eq.${encodeURIComponent(id)}`;
  const r = await fetch(url, { method: "DELETE", headers });

  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json(
      { ok: false, where: "delete", status: r.status, detail: t.slice(0, 400) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
