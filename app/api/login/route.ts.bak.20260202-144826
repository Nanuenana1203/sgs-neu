import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

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

    const name  = String(body?.name ?? "").trim();
    const plain = String(body?.kennwort ?? "").trim();

    if (!name || !plain) {
      return NextResponse.json(
        { ok: false, error: "MISSING_CREDENTIALS" },
        { status: 400 },
      );
    }

    const url =
      `${BASE}/rest/v1/benutzer` +
      `?select=id,name,email,kennwort,istadmin` +
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

    // Neues Cookie (kein Konflikt mehr mit altem)
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, isAdmin: !!user.istadmin } });
    res.cookies.set("sgs_user", JSON.stringify({ id: user.id, name: user.name, isAdmin: !!user.istadmin }), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    res.cookies.set("sgs_session", "", { path: "/", maxAge: 0 }); // altes löschen

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, where: "exception", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
