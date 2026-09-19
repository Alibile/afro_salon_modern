"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { createAppointment } from "@/actions/appointments";
import { ServiceStep, type ServiceItem } from "./ServiceStep";
import { BarberStep, type BarberItem } from "./BarberStep";
import { SlotStep } from "./SlotStep";
import { Button } from "@/components/ui/button";
import { formatKurus } from "@/lib/money";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  services: ServiceItem[];
  barbers: BarberItem[];
  isLoggedIn: boolean;
  initial: { serviceIds: string[]; barberId: string | null; startsAt: string | null; day: string | null };
};

export function BookingWizard({ services, barbers, isLoggedIn, initial }: Props) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const router = useRouter();
  const [serviceIds, setServiceIds] = useState<string[]>(initial.serviceIds.filter((id) => services.some((s) => s.id === id)));
  const [barberId, setBarberId] = useState<string | null>(initial.barberId);
  const [startsAt, setStartsAt] = useState<string | null>(initial.startsAt);
  /**
   * Seçili gün adresten gelebilir (`?gun=2026-09-21`); gelmezse `SlotStep`
   * pencerenin ilk uygun gününü seçer ve buraya bildirir. Saat seçimi güne
   * bağlı olduğu için gün değişince saat düşer.
   */
  const [day, setDay] = useState<string | null>(initial.day);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => services.filter((s) => serviceIds.includes(s.id)), [services, serviceIds]);
  const totalMinutes = selected.reduce((a, s) => a + s.durationMinutes, 0);
  const totalKurus = selected.reduce((a, s) => a + s.priceKurus, 0);

  const step = serviceIds.length === 0 ? 1 : !barberId ? 2 : 3;

  const stateQuery = () => {
    const q = new URLSearchParams();
    if (serviceIds.length) q.set("s", serviceIds.join(","));
    if (barberId) q.set("b", barberId);
    if (day) q.set("gun", day);
    if (startsAt) q.set("t", startsAt);
    return q.toString();
  };

  const confirm = () => {
    if (!barberId || !startsAt) return;
    if (!isLoggedIn) {
      router.push(`/giris?next=${encodeURIComponent(`/randevu?${stateQuery()}`)}`);
      return;
    }
    startTransition(async () => {
      const r = await createAppointment({ barberId, serviceIds, startsAt });
      if (!r.ok) {
        toast.error(showError(r));
        setStartsAt(null);
        return;
      }
      toast.success(t("created"));
      router.push("/randevularim");
    });
  };

  return (
    <div className="space-y-8">
      <ServiceStep services={services} selectedIds={serviceIds} onChange={(ids) => { setServiceIds(ids); setStartsAt(null); }} />
      {step >= 2 && (
        <BarberStep barbers={barbers} selectedId={barberId} onSelect={(id) => { setBarberId(id); setStartsAt(null); }} />
      )}
      {step >= 3 && barberId && (
        <SlotStep
          barberId={barberId}
          durationMinutes={totalMinutes}
          day={day}
          onSelectDay={(d) => { setDay(d); setStartsAt(null); }}
          selected={startsAt}
          onSelect={setStartsAt}
        />
      )}
      {selected.length > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{selected.map((s) => s.name).join(", ")}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {tCommon("minutesShort", { count: totalMinutes })} · {formatKurus(totalKurus, locale)}
            </span>
          </div>
          <Button className="h-12 w-full rounded-none text-base" size="lg" disabled={!startsAt || pending} onClick={confirm}>
            {pending ? t("saving") : isLoggedIn ? t("confirm") : t("loginAndConfirm")}
          </Button>
        </div>
      )}
    </div>
  );
}
