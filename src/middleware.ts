import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (token?.isDeleted) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const pathname = req.nextUrl.pathname;
    const role = (token?.role as string) || "member";

    // 1. Only admin can enter /admin route
    if (pathname.startsWith("/admin") && role !== "admin") {
      if (role === "manager") {
        return NextResponse.redirect(new URL("/manager", req.url));
      }
      return NextResponse.redirect(new URL("/member", req.url));
    }

    // 2. Admin and manager can enter /manager route
    if (pathname.startsWith("/manager") && role !== "manager" && role !== "admin") {
      return NextResponse.redirect(new URL("/member", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && !token.isDeleted,
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
    "/bazaar/:path*",
    "/members-list/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
