import { redirect } from "next/navigation";
import { getAppSession, hasSupabaseUser } from "@/lib/auth/session";
import ProductPage from "./product/page";

/**
 * The landing page, served AT the root.
 *
 * It used to live only at /product, and "/" bounced everyone there. A
 * redirect on the front door costs a round trip, shows the wrong URL in
 * the address bar, and means the address people actually type is never the
 * one they end up on — which then gets shared, bookmarked and printed as
 * /product instead of the domain.
 *
 * Signed-in people are still routed to their own surface, because the root
 * is also where they arrive from a bookmark; that check just happens here
 * now rather than in a separate page whose only job was to redirect.
 */
export default async function LandingPage() {
  const session = await getAppSession();
  if (session) {
    if (session.permissions.has("admin.access")) redirect("/admin");
    redirect("/home");
  }
  // Authenticated with Supabase but no usable STF account — sign-in says
  // why, rather than dropping them on marketing with no explanation.
  if (await hasSupabaseUser()) redirect("/sign-in?error=no-access");

  return <ProductPage />;
}
