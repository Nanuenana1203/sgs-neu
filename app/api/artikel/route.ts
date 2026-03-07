import { NextResponse } from "next/server";
import { BASE, KEY, headers, requireAuth, toBool } from "../_supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function numOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* Liste */
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!BASE || !KEY) return NextResponse.json({ ok: false, where: "env" }, { status: 500 });
  const url =
    `${BASE}/rest/v1/artikel` +
    `?select=id,artnr,bezeichnung,kachel,artikelgruppe,preis1,preis2,preis3,preis4,preis5,preis6,preis7,preis8,preis9` +
    `&order=artnr.asc.nullsfirst`;
  const r = await fetch(url, { headers, cache: "no-store" });
  const text = await r.text();
  if (!r.ok) return NextResponse.json({ ok: false, where: "select", status: r.status, detail: text.slice(0, 400) }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text)); } catch { return NextResponse.json([]); }
}

/* Anlegen */
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (!BASE || !KEY) return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const artnr       = (body?.artnr == null || body?.artnr === "") ? null : String(body.artnr);
  const bezeichnung = String(body?.bezeichnung ?? "").trim();

  if (!bezeichnung) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    bezeichnung,
    preis1: numOrNull(body?.preis1),
    preis2: numOrNull(body?.preis2),
    preis3: numOrNull(body?.preis3),
    preis4: numOrNull(body?.preis4),
    preis5: numOrNull(body?.preis5),
    preis6: numOrNull(body?.preis6),
    preis7: numOrNull(body?.preis7),
    preis8: numOrNull(body?.preis8),
    preis9: numOrNull(body?.preis9),
    kachel: toBool(body?.kachel),
    artikelgruppe: body?.artikelgruppe ? String(body.artikelgruppe) : null,
  };
  if (artnr !== null) payload.artnr = artnr;

  const insUrl = `${BASE}/rest/v1/artikel`;
  const r = await fetch(insUrl, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  if (!r.ok) return NextResponse.json({ ok: false, where: "insert", status: r.status, detail: text.slice(0, 400) }, { status: 502 });

  let rows: unknown[] = []; try { rows = JSON.parse(text); } catch {}
  const rec = Array.isArray(rows) ? rows[0] : rows;
  return NextResponse.json({ ok: true, artikel: rec });
}
