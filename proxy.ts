import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const dashboardPrefixes = [
  "/dashboard",
  "/clients",
  "/calendar",
  "/appointments",
  "/records",
  "/settings",
];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const isAuthPage =
    pathname === "/login" || pathname === "/register";
  const isDashboard = dashboardPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isDashboard && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/calendar/:path*",
    "/appointments/:path*",
    "/records/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
