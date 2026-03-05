import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  "";

const headers: Record<string, string> = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

export async function POST(req: Request) {
  try {
    if (!BASE || !KEY) {
      return NextResponse.json(
        { ok: false, where: "env", error: "CONFIG", hasBASE: !!BASE, hasKEY: !!KEY },
        { status: 500 },
      );
    }

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const name = String(body?.name ?? "").trim();
    const plain = String(body?.kennwort ?? "").trim();
    const deviceId = String(body?.deviceToken ?? "").trim(); // deviceId (UUID), kein Hash!

    if (!name || !plain) {
      return NextResponse.json({ ok: false, error: "MISSING_CREDENTIALS" }, { status: 400 });
    }

    const url =
      `${BASE}/rest/v1/benutzer` +
      `?select=id,name,email,kennwort,istadmin,erlaubter_rechner_hash` +
      `&name=eq.${encodeURIComponent(name)}` +
      `&limit=1`;

    const supaRes = await fetch(url, { headers, cache: "no-store" });
    const rows = await supaRes.json();
    const user = Array.isArray(rows) ? rows[0] : null;

    if (!user?.kennwort) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const ok = await bcrypt.compare(plain, String(user.kennwort));
    if (!ok) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const isAdmin =
      user?.istadmin === true ||
      user?.istadmin === 1 ||
      user?.istadmin === "1" ||
      String(user?.istadmin ?? "").toLowerCase() === "true" ||
      String(user?.istadmin ?? "").toLowerCase() === "t";

    // Admin immer erlaubt
    if (!isAdmin) {
      const allowed = String(user?.erlaubter_rechner_hash ?? "").trim();

      // Freigabe zwingend
      if (!allowed) {
        return NextResponse.json({ ok: false, error: "DEVICE_NOT_APPROVED" }, { status: 403 });
      }

      // deviceId muss vorhanden sein
      if (!deviceId) {
        return NextResponse.json({ ok: false, error: "NO_DEVICE" }, { status: 403 });
      }

      // 1:1 Vergleich (kein Hash)
      if (allowed !== deviceId) {
        return NextResponse.json({ ok: false, error: "WRONG_DEVICE" }, { status: 403 });
      }
    }

    // Cookie für UI / Guards (wie im Backup)
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, isAdmin } });
    res.cookies.set("sgs_user", JSON.stringify({ id: user.id, name: user.name, isAdmin }), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    res.cookies.set("sgs_session", "", { path: "/", maxAge: 0 });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, where: "exception", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
