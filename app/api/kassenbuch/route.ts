import { NextResponse } from "next/server";
import { BASE, KEY, headers, requireAuth } from "../_supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!BASE || !KEY) return NextResponse.json({ ok: false, where: "env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const from        = (searchParams.get("from")         || "").trim();
  const to          = (searchParams.get("to")           || "").trim();
  const mid         = (searchParams.get("mitglied_id")  || "").trim();
  const gruppe      = (searchParams.get("artikelgruppe") || "").trim();
  const artnrVon    = (searchParams.get("artnr_von")    || "").trim();
  const artnrBis    = (searchParams.get("artnr_bis")    || "").trim();

  // Resolve artikelgruppe → artikel_ids
  let artikelIds: number[] | null = null;
  if (gruppe) {
    const artUrl = `${BASE}/rest/v1/artikel?select=id&artikelgruppe=eq.${encodeURIComponent(gruppe)}`;
    const artRes = await fetch(artUrl, { headers, cache: "no-store" });
    if (artRes.ok) {
      const artRows: { id: number }[] = await artRes.json().catch(() => []);
      artikelIds = artRows.map(r => r.id);
    }
  }

  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "datum.asc");
  if (from) params.set("datum", `gte.${encodeURIComponent(from)}T00:00:00.000Z`);
  if (to)   params.append("datum", `lte.${encodeURIComponent(to)}T23:59:59.999Z`);
  if (mid)  params.set("mitglied_id", `eq.${encodeURIComponent(mid)}`);
  if (artikelIds !== null) {
    if (artikelIds.length === 0) {
      return NextResponse.json({ ok: true, rows: [] });
    }
    params.set("artikel_id", `in.(${artikelIds.join(",")})`);
  }
  if (artnrVon) params.set("artikel_nummer", `gte.${encodeURIComponent(artnrVon)}`);
  if (artnrBis) params.append("artikel_nummer", `lte.${encodeURIComponent(artnrBis)}`);

  const url = `${BASE}/rest/v1/kasse?${params.toString()}`;

  const r = await fetch(url, { headers, cache: "no-store" });
  const text = await r.text();
  if (!r.ok) {
    return NextResponse.json({ ok: false, where: "select", status: r.status, detail: text.slice(0, 400) }, { status: 502 });
  }

  let rows: unknown[] = [];
  try { rows = JSON.parse(text); } catch {}

  return NextResponse.json({ ok: true, rows });
}
