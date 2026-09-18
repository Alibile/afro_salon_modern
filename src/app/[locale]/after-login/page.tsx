import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth-helpers";

export default async function AfterLogin() {
  const [user, locale] = await Promise.all([getSessionUser(), getLocale()]);
  if (!user) redirect({ href: "/giris", locale });
  redirect({ href: user.role === "CUSTOMER" ? "/" : "/panel", locale });
}
