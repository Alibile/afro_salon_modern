import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { listUpcomingTimeOff } from "@/lib/queries/timeoff";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { TimeOffForm } from "@/components/panel/TimeOffForm";
import { TimeOffList } from "@/components/panel/TimeOffList";
import { NewRecordPanel } from "@/components/panel/NewRecordPanel";

export const dynamic = "force-dynamic";

export default async function IzinlerPage() {
  const user = await requireStaff();
  const t = await getTranslations("panel.timeOff");
  const [items, barbers] = await Promise.all([
    listUpcomingTimeOff(user),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  return (
    <NewRecordPanel
      pageTitle={t("title")}
      label={t("newTitle")}
      title={t("newTitle")}
      width="narrow"
      form={<TimeOffForm barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} ownBarberId={user.barberId} />}
    >
      <TimeOffList items={items} />
    </NewRecordPanel>
  );
}
