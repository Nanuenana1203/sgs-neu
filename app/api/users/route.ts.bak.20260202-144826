import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const BASE = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

const headers: Record<string,string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!BASE || !KEY) return NextResponse.json({ ok:false, where:"env" }, { status:500 });
  const url = `${BASE}/rest/v1/benutzer?select=id,name,email,istadmin&order=name.asc.nullsfirst`;
  const r = await fetch(url, { headers, cache:"no-store" });
  const text = await r.text();
  if (!r.ok) return NextResponse.json({ ok:false, where:"select", status:r.status, detail:text.slice(0,400) }, { status:502 });
  let rows: any[] = []; try { rows = JSON.parse(text); } catch {}
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!BASE || !KEY) return NextResponse.json({ ok:false, where:"env" }, { status:500 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  const name   = String(body?.name ?? body?.p_name ?? "").trim();
  const plain  = String(body?.kennwort ?? body?.password ?? body?.p_password ?? "").trim();
  const email  = (body?.email ?? null) ? String(body.email).trim() : null;
  const isAdmI = body?.istadmin ?? body?.isAdmin ?? false;
  const istadmin = (isAdmI === true || isAdmI === 1 || isAdmI === "1" || String(isAdmI).toLowerCase() === "true" || String(isAdmI).toLowerCase() === "t");

  if (!name || !plain) {
    return NextResponse.json({ ok:false, error:"MISSING_FIELDS" }, { status:400 });
  }

  // doppelte Namen verhindern
  {
    const existsUrl = `${BASE}/rest/v1/benutzer?select=id&name=eq.${encodeURIComponent(name)}&limit=1`;
    const er = await fetch(existsUrl, { headers, cache:"no-store" });
    const arr = await er.json().catch(()=>[]);
    if (Array.isArray(arr) && arr[0]) {
      return NextResponse.json({ ok:false, error:"DUPLICATE_NAME" }, { status:409 });
    }
  }

  const kennwort = await bcrypt.hash(plain, 10);

  const insUrl = `${BASE}/rest/v1/benutzer`;
  const payload = { name, email, istadmin, kennwort };

  const r = await fetch(insUrl, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  if (!r.ok) {
    return NextResponse.json({ ok:false, where:"insert", status:r.status, detail:text.slice(0,400) }, { status:502 });
  }
  let rows: any[] = []; try { rows = JSON.parse(text); } catch {}
  const user = Array.isArray(rows) ? rows[0] : rows;
  return NextResponse.json({ ok:true, user });
}
