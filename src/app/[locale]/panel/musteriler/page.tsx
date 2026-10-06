import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth-helpers";
import { searchCustomers } from "@/lib/queries/customers";
import { Input } from "@/components/ui/input";
import { PanelPage } from "@/components/panel/PanelPage";
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
    <PanelPage title={t("title")}>
      <form className="relative max-w-md">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" type="search" defaultValue={q} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="pl-9" />
      </form>
      <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
        {customers.length === 0 && <li className="p-4 text-sm text-muted-foreground">{t("empty")}</li>}
        {customers.map((c) => (
          <li key={c.id}>
            <Link href={`/panel/musteriler/${c.id}`} className="grid gap-1 p-4 transition-colors hover:bg-muted sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block truncate text-sm text-muted-foreground">{c.phone ?? c.email}</span>
              </span>
              <span className="text-xs text-muted-foreground">{c.lastVisit ? t("lastVisit", { date: formatShopDate(c.lastVisit, locale) }) : t("firstVisitPending")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PanelPage>
  );
}
