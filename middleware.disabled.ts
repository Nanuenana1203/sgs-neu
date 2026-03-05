import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths = [
    "/bahnen",
    "/zeitslots",
  ];

  if (!protectedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAdmin = req.cookies.get("isAdmin")?.value === "true";

  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("forbidden", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/bahnen/:path*", "/zeitslots/:path*"],
};
