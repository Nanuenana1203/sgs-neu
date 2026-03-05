import { NextResponse } from "next/server";

const BASE =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

const headers: Record<string, string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- GET ---------- */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
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
  if (!BASE || !KEY)
    return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  const { id } = await ctx.params;
  const body = await req.json();

  if (!body || Object.keys(body).length === 0)
    return NextResponse.json({ ok: false, error: "EMPTY_PATCH" }, { status: 400 });

  const url = `${BASE}/rest/v1/artikel?id=eq.${encodeURIComponent(id)}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(body),
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
export async function PATCH(req: Request, ctx: any) {
  return PUT(req, ctx);
}

/* ---------- DELETE ---------- */
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
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
