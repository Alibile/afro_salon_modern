import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { listAppointments } from "@/lib/queries/panel";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-window";
import { AppointmentsTable } from "@/components/panel/AppointmentsTable";
import { shopDateTime, addMinutes, addDays, shopDateKey } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RandevularPage(props: { searchParams: Promise<{ from?: string; to?: string; barberId?: string; status?: string }> }) {
  const user = await requireStaff();
  const sp = await props.searchParams;
  const now = new Date();
  const defaultFrom = shopDateKey(addDays(now, -30));
  // Müşteri artık bir hafta öncesinden randevu alabiliyor: varsayılan aralık
  // bugünde bitseydi personel yarının randevusunu ancak tarihi elle yazarak
  // görürdü. Üst sınır randevu penceresinin sonuna kadar açık.
  const defaultTo = shopDateKey(addDays(now, BOOKING_HORIZON_DAYS - 1));
  const from = sp.from && DATE_RE.test(sp.from) ? sp.from : defaultFrom;
  const to = sp.to && DATE_RE.test(sp.to) ? sp.to : defaultTo;
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
