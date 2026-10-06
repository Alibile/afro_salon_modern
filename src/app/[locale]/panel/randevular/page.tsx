import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { listAppointments } from "@/lib/queries/panel";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-window";
import { AppointmentsTable } from "@/components/panel/AppointmentsTable";
import { PanelPage } from "@/components/panel/PanelPage";
import { shopDateTime, addMinutes, addDays, shopDateKey } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";

export const dynamic = "force-dynamic";

const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RandevularPage(props: { searchParams: Promise<{ from?: string; to?: string; barberId?: string; status?: string }> }) {
  const user = await requireStaff();
  const sp = await props.searchParams;
  const now = new Date();
  const defaultFrom = shopDateKey(addDays(now, -30));
  // Müşteri bir hafta öncesinden randevu alabiliyor: varsayılan aralık bugünde
  // bitseydi personel yarının randevusunu ancak tarihi elle yazarak görürdü.
  const defaultTo = shopDateKey(addDays(now, BOOKING_HORIZON_DAYS - 1));
  const from = sp.from && DATE_RE.test(sp.from) ? sp.from : defaultFrom;
  const to = sp.to && DATE_RE.test(sp.to) ? sp.to : defaultTo;
  const status = STATUSES.find((s) => s === sp.status);
  const t = await getTranslations("panel");
  const [rows, barbers] = await Promise.all([
    listAppointments(user, { from: shopDateTime(from, "00:00"), to: addMinutes(shopDateTime(to, "00:00"), 24 * 60), barberId: sp.barberId || undefined, status }),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  const isAdmin = user.role === "ADMIN";
  return (
    <PanelPage title={t("appointments.title")}>
      {/* Etiketli araç çubuğu: telefonda iki sütun, geniş ekranda tek satır. */}
      <form className="grid gap-4 rounded-[var(--radius)] border border-border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <Field id="from" label={t("appointments.from")}>
          <Input id="from" type="date" name="from" defaultValue={from} />
        </Field>
        <Field id="to" label={t("appointments.to")}>
          <Input id="to" type="date" name="to" defaultValue={to} />
        </Field>
        {isAdmin ? (
          <Field id="barberId" label={t("appointments.barber")}>
            <Select id="barberId" name="barberId" defaultValue={sp.barberId ?? ""}>
              <option value="">{t("appointments.allBarbers")}</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="hidden lg:block" />
        )}
        <Field id="status" label={t("appointments.status")}>
          <Select id="status" name="status" defaultValue={sp.status ?? ""}>
            <option value="">{t("appointments.allStatuses")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`common.status.${s}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline" className="sm:col-span-2 lg:col-span-1">
          {t("appointments.filter")}
        </Button>
      </form>
      <AppointmentsTable rows={rows} />
    </PanelPage>
  );
}
