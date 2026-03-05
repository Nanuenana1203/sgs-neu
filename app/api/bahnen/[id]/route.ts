import { NextResponse } from "next/server";

const BASE = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

const headers: Record<string,string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function badId() {
  return NextResponse.json({ ok:false, msg:"invalid id" }, { status:400 });
}

// Einzelne Bahn abrufen
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!BASE || !KEY) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return badId();

  const url = `${BASE}/rest/v1/bahnen?id=eq.${id}&select=id,nummer,name&limit=1`;
  const r = await fetch(url, { headers, cache:"no-store" });
  const arr = await r.json().catch(()=>[]);
  const row = Array.isArray(arr) && arr.length ? arr[0] : null;
  if (!row) return NextResponse.json({ ok:false, msg:"not found" }, { status:404 });
  return NextResponse.json(row, { status: 200 });
}

// Bahn löschen
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!BASE || !KEY) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return badId();

  const r = await fetch(`${BASE}/rest/v1/bahnen?id=eq.${id}`, {
    method:"DELETE",
    headers,
  });
  if (!r.ok) return NextResponse.json({ ok:false }, { status: r.status });
  return new NextResponse(null, { status: 204 });
}

// Bahn aktualisieren
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!BASE || !KEY) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return badId();

  const body = await req.json().catch(()=>({}));
  const payload: Record<string, any> = {};
  if (typeof body.nummer === "string") payload.nummer = body.nummer.trim() || null;
  if (typeof body.name   === "string") payload.name   = body.name.trim()   || null;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok:false, msg:"no fields" }, { status:400 });
  }

  const r = await fetch(`${BASE}/rest/v1/bahnen?id=eq.${id}`, {
    method:"PATCH",
    headers:{ ...headers, Prefer:"return=representation" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(()=>[]);
  const row = Array.isArray(data) && data.length ? data[0] : null;
  if (!r.ok) return NextResponse.json(row ?? { ok:false }, { status: r.status });
  return NextResponse.json(row, { status: 200 });
}
