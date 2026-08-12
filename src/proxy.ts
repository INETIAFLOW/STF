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
  // Invitation links are opened by people who have no account yet; the
  // token in the path is the credential, checked server-side.
  "/invite",
  "/auth",
  "/product",
  "/modules",
  "/pricing",
  "/demo",
];

/**
 * Pages with no notion of a viewer. These skip the auth check entirely, so
 * the public site stays up even when Supabase does not.
 */
const MARKETING_PATHS = ["/product", "/modules", "/pricing", "/demo"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** How long to wait for the auth server before giving up on this request. */
const AUTH_TIMEOUT_MS = 3000;

const TIMED_OUT = Symbol("auth-timeout");

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), ms);
      }),
    ]);
  } catch {
    // A rejected auth call is the same situation as a slow one: we do not
    // know who this is, so let the page's own guard decide.
    return TIMED_OUT;
  } finally {
    if (timer) clearTimeout(timer);
  }
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

  // Marketing pages belong to nobody, so they must not wait on an identity
  // provider to be served. Skipping the call here also means a Supabase
  // outage cannot take the public site down with it.
  if (MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
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

  // `getUser()` is a network call to Supabase, and it has no timeout of its
  // own. Without this bound, one slow or unreachable auth server hangs
  // EVERY request — including a host's health check, which then restarts
  // the app, which changes nothing, forever. Learned the hard way.
  //
  // On timeout we fail OPEN rather than closed. That is safe here and only
  // here: this layer answers "is anyone signed in?" as an optimisation, and
  // every page and server action re-checks with requireSession() against
  // the database (src/lib/authz/guard.ts). Failing closed would sign
  // everyone out during a blip; failing open lets the real guard decide.
  const user = await withTimeout(
    supabase.auth.getUser().then((result) => result.data.user),
    AUTH_TIMEOUT_MS,
  );
  if (user === TIMED_OUT) return response;

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
    // Everything except Next internals, static files, and the install
    // assets.
    //
    // The manifest and app icons must be excluded, not merely public: a
    // browser fetches them WITHOUT credentials, so this layer would see no
    // signed-in user and redirect them to /sign-in. The browser would then
    // read sign-in HTML as the manifest and quietly refuse to install,
    // giving no error anywhere.
    "/((?!_next/static|_next/image|favicon.ico|brand/|manifest.webmanifest|icons/|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
