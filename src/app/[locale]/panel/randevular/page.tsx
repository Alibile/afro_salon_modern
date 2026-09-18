import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { listAppointments } from "@/lib/queries/panel";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { AppointmentsTable } from "@/components/panel/AppointmentsTable";
import { shopDateTime, addMinutes } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RandevularPage(props: { searchParams: Promise<{ from?: string; to?: string; barberId?: string; status?: string }> }) {
  const user = await requireStaff();
  const sp = await props.searchParams;
  const now = new Date();
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const defaultFrom = new Date(now.getTime() - 30 * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const from = sp.from && DATE_RE.test(sp.from) ? sp.from : defaultFrom;
  const to = sp.to && DATE_RE.test(sp.to) ? sp.to : todayStr;
  const status = STATUSES.find((s) => s === sp.status);
  const t = await getTranslations("panel");
  const [rows, barbers] = await Promise.all([
    listAppointments(user, { from: shopDateTime(from, "00:00"), to: addMinutes(shopDateTime(to, "00:00"), 24 * 60), barberId: sp.barberId || undefined, status }),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">{t("appointments.title")}</h1>
      <form className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-5">
        <Input type="date" name="from" defaultValue={from} />
        <Input type="date" name="to" defaultValue={to} />
        {user.role === "ADMIN" && (
          <select name="barberId" defaultValue={sp.barberId ?? ""} className="rounded-md border bg-background px-3 py-2">
            <option value="">{t("appointments.allBarbers")}</option>
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-md border bg-background px-3 py-2">
          <option value="">{t("appointments.allStatuses")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`common.status.${s}`)}</option>)}
        </select>
        <Button type="submit">{t("appointments.filter")}</Button>
      </form>
      <AppointmentsTable rows={rows} />
    </div>
  );
}
