import { NextResponse, type NextRequest } from "next/server";

import {
  publicUrl,
  sessionAbsoluteMaxAgeSeconds,
  sessionMaxAgeSeconds,
  sessionRefreshAfterSeconds,
  sessionSecret,
} from "@/config";
import {
  decodeSession,
  encodeSession,
  isStale,
  nowSeconds,
  sessionCookieName,
  sessionCookieOptions,
} from "@/crypto/sessionCodec";

/**
 * Sliding session expiry: re-issues a session cookie that is older than the refresh threshold.
 * Touches no database. Authentication itself is checked by every page and action.
 *
 * Only GET requests are refreshed: server actions are POSTs that may set or delete the cookie
 * themselves (sign in, sign out), and the next page load refreshes anyway.
 */
export function proxy(request: NextRequest) {
  if (request.method !== "GET") return NextResponse.next();

  const cookie = request.cookies.get(sessionCookieName)?.value;
  if (!cookie) return NextResponse.next();

  const now = nowSeconds();
  const session = decodeSession(
    cookie,
    sessionSecret,
    now,
    sessionAbsoluteMaxAgeSeconds,
  );
  const response = NextResponse.next();
  if (!session) {
    response.cookies.delete(sessionCookieName);
  } else if (isStale(session, now, sessionRefreshAfterSeconds)) {
    response.cookies.set(
      sessionCookieName,
      encodeSession(session, sessionSecret, now, sessionMaxAgeSeconds),
      sessionCookieOptions(publicUrl, sessionMaxAgeSeconds),
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map)$).*)",
  ],
};
