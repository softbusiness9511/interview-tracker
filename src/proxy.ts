import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isValidSessionToken(token);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!authed && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (authed && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Static assets must be exempt or the gate 307s them to /login and they never
  // load — the logos and generated favicons are decorative, not private. Pages
  // and server actions still go through the gate.
  matcher: [
    "/((?!_next/|favicon\\.ico$|.*\\.(?:png|gif|jpg|jpeg|svg|webp|avif|ico|webmanifest|woff2?|ttf|otf|eot)$).*)",
  ],
};
