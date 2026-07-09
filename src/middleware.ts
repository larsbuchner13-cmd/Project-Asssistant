import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createMiddleware({ locales, defaultLocale });

const AUTH_PATHS = ["/login", "/register"];

function stripLocale(pathname: string) {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const rest = pathname.slice(`/${locale}`.length);
      return { locale, path: rest === "" ? "/" : rest };
    }
  }
  return { locale: defaultLocale, path: pathname };
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { locale, path } = stripLocale(pathname);

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const isActive = token?.status === "ACTIVE";
  const isAdmin = token?.role === "ADMIN";

  const redirectTo = (target: string) =>
    NextResponse.redirect(new URL(`/${locale}${target === "/" ? "" : target}`, req.url));

  if (AUTH_PATHS.includes(path)) {
    if (isAuthenticated) return redirectTo(isActive ? "/" : "/pending");
  } else if (path === "/pending") {
    if (!isAuthenticated) return redirectTo("/login");
    if (isActive) return redirectTo("/");
  } else {
    if (!isAuthenticated) return redirectTo("/login");
    if (!isActive) return redirectTo("/pending");
    if (path.startsWith("/admin") && !isAdmin) return redirectTo("/");
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
