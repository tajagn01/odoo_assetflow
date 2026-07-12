import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Bypass custom redirection for Server Actions (handled at action level)
    if (req.headers.has("next-action")) {
      return NextResponse.next();
    }

    // Standard session check
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Admin-only panels (e.g., Organization configurations)
    if (path.startsWith("/dashboard/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
    }

    // Asset Manager & Admin actions (e.g., Asset registration, returns)
    if (
      path.startsWith("/dashboard/manager") &&
      !["ADMIN", "ASSET_MANAGER"].includes(token.role)
    ) {
      return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
    }

    // Audits and Reports panels - restricted to Admin and Asset Manager
    if (
      (path.startsWith("/dashboard/audits") || path.startsWith("/dashboard/reports")) &&
      !["ADMIN", "ASSET_MANAGER"].includes(token.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
    }

    // Department Head or higher access
    if (
      path.startsWith("/dashboard/department-head") &&
      !["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(token.role)
    ) {
      return NextResponse.redirect(new URL("/dashboard/forbidden", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
