import { requireStaff } from "@/lib/auth-helpers";
import { getTodayBoard } from "@/lib/queries/panel";
import { TodayBoard } from "@/components/panel/TodayBoard";
import { formatShopDate } from "@/lib/time";
import { AutoRefresh } from "@/components/panel/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const user = await requireStaff();
  const board = await getTodayBoard(user);
  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 className="mb-4 text-3xl">Bugün · {formatShopDate(board.dayStart)}</h1>
      <TodayBoard columns={board.columns} />
    </div>
  );
}
