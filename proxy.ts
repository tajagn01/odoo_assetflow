import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Bypass Server Actions
  if (req.headers.has("next-action")) {
    return NextResponse.next();
  }

  // Read JWT token directly from cookie (avoids NextAuth internal redirects)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // No session → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string | undefined;

  // Admin-only panels
  if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
  }

  // Asset Manager & Admin only
  if (
    path.startsWith("/dashboard/manager") &&
    !["ADMIN", "ASSET_MANAGER"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
  }

  // Audits — Admin & Asset Manager only
  if (
    path.startsWith("/dashboard/audits") &&
    !["ADMIN", "ASSET_MANAGER"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
  }

  // Department Head or higher
  if (
    path.startsWith("/dashboard/department-head") &&
    !["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

