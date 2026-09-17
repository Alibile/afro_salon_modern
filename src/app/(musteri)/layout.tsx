import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSessionUser } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";

export default async function MusteriLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);
  return (
    <>
      <SiteHeader user={user} shopName={settings.shopName} />
      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">{children}</main>
    </>
  );
}
