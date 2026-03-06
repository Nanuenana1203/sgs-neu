import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BASE, KEY, headers, toBool } from "../_supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!BASE || !KEY) {
      return NextResponse.json(
        { ok: false, where: "env", error: "CONFIG" },
        { status: 500 },
      );
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }

    const name     = String(body?.name ?? "").trim();
    const plain    = String(body?.kennwort ?? "").trim();
    const deviceId = String(body?.deviceToken ?? "").trim();

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

    const isAdmin = toBool(user?.istadmin);

    // Admin immer erlaubt
    if (!isAdmin) {
      const allowed = String(user?.erlaubter_rechner_hash ?? "").trim();

      if (!allowed) {
        return NextResponse.json({ ok: false, error: "DEVICE_NOT_APPROVED" }, { status: 403 });
      }

      if (!deviceId) {
        return NextResponse.json({ ok: false, error: "NO_DEVICE" }, { status: 403 });
      }

      if (allowed !== deviceId) {
        return NextResponse.json({ ok: false, error: "WRONG_DEVICE" }, { status: 403 });
      }
    }

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, isAdmin } });
    res.cookies.set("sgs_user", JSON.stringify({ id: user.id, name: user.name, isAdmin }), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      // Kein maxAge = Session-Cookie: wird beim Schließen des Browsers automatisch gelöscht
    });
    res.cookies.set("sgs_session", "", { path: "/", maxAge: 0 });

    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, where: "exception", detail: msg }, { status: 500 });
  }
}
