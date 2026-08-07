import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";

/** Entry: route the signed-in user to their surface. */
export default async function RootPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");
  if (session.permissions.has("admin.access")) redirect("/admin");
  redirect("/home");
}
