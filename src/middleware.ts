import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token?.role as string) || "member";

    if (token?.isDeleted || role === "pending" || role === "suspended") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const pathname = req.nextUrl.pathname;

    // 1. Only admin can enter /admin route
    if (pathname.startsWith("/admin") && role !== "admin") {
      if (role === "manager") {
        return NextResponse.redirect(new URL("/manager", req.url));
      }
      return NextResponse.redirect(new URL("/member", req.url));
    }

    // 2. If admin visits /manager, redirect to /admin (Admin Dashboard)
    if (pathname === "/manager" && role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // 3. Admin and manager can enter /manager and operational management queues
    const managerOnlyRoutes = [
      "/manager",
      "/bazaar-requests",
      "/payments",
      "/expenses",
      "/guest-meals",
    ];
    if (
      managerOnlyRoutes.some((route) => pathname.startsWith(route)) &&
      role !== "manager" &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/member", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) =>
        !!token &&
        !token.isDeleted &&
        token.role !== "pending" &&
        token.role !== "suspended",
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/manager/:path*",
    "/member/:path*",
    "/meals/:path*",
    "/my-meals/:path*",
    "/bazaar/:path*",
    "/bazaar-requests/:path*",
    "/expenses/:path*",
    "/payments/:path*",
    "/guest-meals/:path*",
    "/members-list/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
