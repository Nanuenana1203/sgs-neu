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

function badEnv() {
  return !BASE || !KEY;
}

/** GET one member (used by Edit page) */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (badEnv()) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const id =  (await ctx.params).id ;

  const url = `${BASE}/rest/v1/mitglieder`
    + `?select=id,mitgliedsnr,name,strasse,landkz,plz,ort,preisgruppe,ausweisnr,mitglied,gesperrt`
    + `&id=eq.${encodeURIComponent(String(id))}&limit=1`;
  const r = await fetch(url, { headers, cache:"no-store" });
  const t = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, where:"select", status:r.status, detail:t.slice(0,400) }, { status:502 });

  let rows:any[]=[]; try{ rows = JSON.parse(t); } catch {}
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return NextResponse.json({ ok:false, error:"NOT_FOUND" }, { status:404 });
  return NextResponse.json(row);
}

/** UPDATE one member */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (badEnv()) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const id =  (await ctx.params).id ;

  let body:any={}; try{ body = await req.json(); }catch{}
  const row:any = {};
  if (body?.mitgliedsnr !== undefined) row.mitgliedsnr = String(body.mitgliedsnr).trim();
  if (body?.name        !== undefined) row.name        = String(body.name).trim();
  if (body?.strasse     !== undefined) row.strasse     = body.strasse || null;
  if (body?.landkz      !== undefined) row.landkz      = (String(body.landkz).trim() || "D");
  if (body?.plz         !== undefined) row.plz         = body.plz || null;
  if (body?.ort         !== undefined) row.ort         = body.ort || null;
  if (body?.preisgruppe !== undefined) row.preisgruppe = Number.isFinite(+body.preisgruppe) ? parseInt(String(body.preisgruppe),10) : null;
  if (body?.ausweisnr   !== undefined) row.ausweisnr   = body.ausweisnr || null;
  if (body?.mitglied    !== undefined) row.mitglied    = !!body.mitglied;
  if (body?.gesperrt    !== undefined) row.gesperrt    = !!body.gesperrt;

  const url = `${BASE}/rest/v1/mitglieder?id=eq.${encodeURIComponent(String(id))}`;
  const r = await fetch(url, { method:"PATCH", headers, body: JSON.stringify(row), cache:"no-store" });
  const t = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, where:"update", status:r.status, detail:t.slice(0,400) }, { status:502 });

  let rows:any[]=[]; try{ rows = JSON.parse(t); } catch {}
  return NextResponse.json({ ok:true, user: rows?.[0] ?? null });
}

/** DELETE one member (used by trash icon) */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (badEnv()) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const id =  (await ctx.params).id ;

  const url = `${BASE}/rest/v1/mitglieder?id=eq.${encodeURIComponent(String(id))}`;
  const r = await fetch(url, { method:"DELETE", headers, cache:"no-store" });
  const t = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, where:"delete", status:r.status, detail:t.slice(0,400) }, { status:502 });

  return NextResponse.json({ ok:true });
}

export async function PATCH(req, ctx) { return PUT(req, ctx); }
