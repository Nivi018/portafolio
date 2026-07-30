import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const APP_ROUTE_RE = /^\/(?:en|es)?\/?app(\/|$)/;

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAppRoute = APP_ROUTE_RE.test(nextUrl.pathname);

  if (isAppRoute && !session?.user) {
    const signInUrl = new URL("/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
