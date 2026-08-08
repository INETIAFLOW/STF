import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route protection + Supabase session refresh (Next.js proxy).
 *
 * This layer only answers "is anyone signed in?". Tenant, role, permission,
 * module and feature checks are server-side in layouts, pages and actions
 * (src/lib/authz) — never here, and never only in the UI.
 */

/** Public routes: sign-in, the auth callbacks, and marketing pages. */
const PUBLIC_PATHS = [
  "/sign-in",
  "/forgot-password",
  "/reset",
  "/auth",
  "/product",
  "/modules",
  "/pricing",
  "/demo",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function devFixtureActive(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    Boolean(process.env.STF_DEV_FAKE_SESSION?.trim())
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev preview session renders the shell without Supabase (dev only).
  if (devFixtureActive()) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Without Supabase configured, only public routes are reachable.
  if (!url || !key) {
    if (isPublic(pathname)) return NextResponse.next();
    const marketing = request.nextUrl.clone();
    marketing.pathname = "/product";
    return NextResponse.redirect(marketing);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The root path routes signed-out visitors to marketing, not sign-in.
  if (!user && !isPublic(pathname) && pathname !== "/") {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  if (user && pathname === "/sign-in") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
