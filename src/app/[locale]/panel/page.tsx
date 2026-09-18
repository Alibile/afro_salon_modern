import { getLocale, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { getTodayBoard } from "@/lib/queries/panel";
import { TodayBoard } from "@/components/panel/TodayBoard";
import { formatShopDate } from "@/lib/time";
import { AutoRefresh } from "@/components/panel/AutoRefresh";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const user = await requireStaff();
  const board = await getTodayBoard(user);
  const t = await getTranslations("panel.today");
  const locale = (await getLocale()) as AppLocale;
  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 className="mb-4 text-3xl">{t("heading", { date: formatShopDate(board.dayStart, locale) })}</h1>
      <TodayBoard columns={board.columns} />
    </div>
  );
}
