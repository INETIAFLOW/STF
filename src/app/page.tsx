import { redirect } from "next/navigation";
import { getAppSession, hasSupabaseUser } from "@/lib/auth/session";

/**
 * Entry point.
 * - Signed in → their surface (admin area or employee home).
 * - Signed out → the marketing home, which offers sign-in and a demo.
 * - Signed in to Supabase but with no usable STF account → back to
 *   sign-in, which says so. Sending them to marketing instead was a
 *   silent dead end: the only way on from there is the Sign in link,
 *   which lands here again.
 */
export default async function RootPage() {
  const session = await getAppSession();
  if (session) {
    if (session.permissions.has("admin.access")) redirect("/admin");
    redirect("/home");
  }
  if (await hasSupabaseUser()) redirect("/sign-in?error=no-access");
  redirect("/product");
}
