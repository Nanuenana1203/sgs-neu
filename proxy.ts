import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Öffentlich zugängliche Pfade (kein Login nötig)
const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/bahnbuchung-public",
  "/dienstbuchung-public",
  "/api/login",
  "/api/logout",
  "/api/session",
  "/api/available-days",
  "/api/slots",
  "/api/buchungen",
  "/api/dienste-public",
  "/api/dienst-buchen-public",
  "/api/dienst-storno-public",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statische Dateien und Next.js-interne Pfade immer durchlassen
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Öffentliche Pfade durchlassen
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return NextResponse.next();

  // Alle anderen Pfade: Session prüfen
  const hasSession = req.cookies.has("sgs_user");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
