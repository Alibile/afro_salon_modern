import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";

export default async function AfterLogin() {
  const user = await getSessionUser();
  if (!user) redirect("/giris");
  redirect(user.role === "CUSTOMER" ? "/" : "/panel");
}
