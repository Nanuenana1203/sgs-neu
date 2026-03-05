import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const benutzerId = Number(body?.benutzerId);
    const deviceToken = String(body?.deviceToken ?? "").trim();

    if (!benutzerId || !Number.isFinite(benutzerId)) {
      return NextResponse.json({ ok: false, error: "BAD_BENUTZER_ID" }, { status: 400 });
    }
    if (!deviceToken) {
      return NextResponse.json({ ok: false, error: "NO_DEVICE_TOKEN" }, { status: 400 });
    }

    const BASE = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!BASE || !KEY) {
      return NextResponse.json({ ok: false, error: "MISSING_SUPABASE_ENV" }, { status: 500 });
    }

    const r = await fetch(`${BASE}/rest/v1/benutzer?id=eq.${benutzerId}`, {
      method: "PATCH",
      headers: {
        apikey: KEY,
        authorization: `Bearer ${KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ erlaubter_rechner_hash: deviceToken }),
      cache: "no-store",
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: "DB_ERROR", detail: t }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
