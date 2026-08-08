import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";

/**
 * Entry point.
 * - Signed in → their surface (admin area or employee home).
 * - Signed out → the marketing home, which offers sign-in and a demo.
 */
export default async function RootPage() {
  const session = await getAppSession();
  if (!session) redirect("/product");
  if (session.permissions.has("admin.access")) redirect("/admin");
  redirect("/home");
}
