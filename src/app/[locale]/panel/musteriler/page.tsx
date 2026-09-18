import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth-helpers";
import { searchCustomers } from "@/lib/queries/customers";
import { Input } from "@/components/ui/input";
import { formatShopDate } from "@/lib/time";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function MusterilerPage(props: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireStaff();
  const { q = "" } = await props.searchParams;
  const customers = await searchCustomers(user, q);
  const t = await getTranslations("panel.customers");
  const locale = (await getLocale()) as AppLocale;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">{t("title")}</h1>
      <form><Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} /></form>
      <ul className="divide-y rounded-xl border bg-card">
        {customers.length === 0 && <li className="p-4 text-sm text-muted-foreground">{t("empty")}</li>}
        {customers.map((c) => (
          <li key={c.id}>
            <Link href={`/panel/musteriler/${c.id}`} className="flex items-center justify-between p-3 hover:bg-muted">
              <span><span className="block font-medium">{c.name}</span><span className="text-sm text-muted-foreground">{c.phone ?? c.email}</span></span>
              <span className="text-xs text-muted-foreground">{c.lastVisit ? t("lastVisit", { date: formatShopDate(c.lastVisit, locale) }) : t("firstVisitPending")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
