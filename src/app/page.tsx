import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz/guard";

/** Entry: route the signed-in user to their surface. */
export default async function RootPage() {
  const session = await requireSession();
  if (session.permissions.has("admin.access")) redirect("/admin");
  redirect("/home");
}
