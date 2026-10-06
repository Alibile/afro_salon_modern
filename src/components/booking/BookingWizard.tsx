"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { createAppointment } from "@/actions/appointments";
import { ServiceStep, type ServiceItem } from "./ServiceStep";
import { BarberStep, type BarberItem } from "./BarberStep";
import { SlotStep } from "./SlotStep";
import { StepIndicator } from "./StepIndicator";
import { StepSummary } from "./StepSummary";
import { BookingSummary } from "./BookingSummary";
import { useActionError } from "@/lib/use-action-error";
import { servicesDoneAfterChange, wizardStep } from "@/lib/booking-steps";

type Props = {
  services: ServiceItem[];
  barbers: BarberItem[];
  isLoggedIn: boolean;
  initial: { serviceIds: string[]; barberId: string | null; startsAt: string | null; day: string | null };
};

/**
 * Üç adımlı sihirbaz. Adım `wizardStep` ile türetilir: hizmet adımı
 * tamamlanmamışsa 1, berber yoksa 2, yoksa 3. Hizmet adımı seçimle değil
 * tamamlanmayla kapanır (`servicesDone`): birden çok hizmet varsa ziyaretçi
 * istediği kadarını işaretleyip "Devam" der; tek hizmette ilk dokunuş yeter.
 * Tamamlanan adım tek satıra kapanır ve "Değiştir" ile yeniden açılır;
 * hizmet listesi değişince seçili saat düşer (süre değişir), berber kalır.
 * Özet ve onay düğmesi `BookingSummary` içinde: telefonda alt çubuk, geniş
 * ekranda sağ sütun.
 */
export function BookingWizard({ services, barbers, isLoggedIn, initial }: Props) {
  const t = useTranslations("booking");
  const showError = useActionError();
  const router = useRouter();
  const [serviceIds, setServiceIds] = useState<string[]>(initial.serviceIds.filter((id) => services.some((s) => s.id === id)));
  // Adresten seçimle dönen ziyaretçi (giriş sonrası) hizmet adımını yeniden görmez.
  const [servicesDone, setServicesDone] = useState(initial.serviceIds.length > 0);
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
  const barber = barbers.find((b) => b.id === barberId) ?? null;

  const step = wizardStep({ serviceIds, servicesDone, barberId });

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
    <div className="md:grid md:grid-cols-12 md:gap-10">
      <div className="space-y-6 md:col-span-7">
        <StepIndicator current={step} />

        {step > 1 ? (
          <StepSummary
            step={1}
            title={t("step1")}
            value={selected.map((s) => s.name).join(", ")}
            onChange={() => {
              setServicesDone(false);
              setStartsAt(null);
            }}
          />
        ) : (
          <ServiceStep
            services={services}
            selectedIds={serviceIds}
            onChange={(ids) => {
              setServiceIds(ids);
              setStartsAt(null);
              setServicesDone(servicesDoneAfterChange(services.length, ids));
            }}
            onContinue={() => setServicesDone(true)}
          />
        )}

        {step === 2 && (
          <BarberStep
            barbers={barbers}
            selectedId={barberId}
            onSelect={(id) => {
              setBarberId(id);
              setStartsAt(null);
            }}
          />
        )}
        {step > 2 && barber && (
          <StepSummary
            step={2}
            title={t("step2")}
            value={barber.name}
            onChange={() => {
              setBarberId(null);
              setStartsAt(null);
            }}
          />
        )}

        {step === 3 && barberId && (
          <SlotStep
            barberId={barberId}
            durationMinutes={totalMinutes}
            day={day}
            onSelectDay={(d) => {
              setDay(d);
              setStartsAt(null);
            }}
            selected={startsAt}
            onSelect={setStartsAt}
          />
        )}
      </div>

      {selected.length > 0 && (
        <aside className="md:col-span-5">
          <BookingSummary
            serviceNames={selected.map((s) => s.name)}
            barberName={barber?.name ?? null}
            startsAt={startsAt}
            totalMinutes={totalMinutes}
            totalKurus={totalKurus}
            confirmLabel={pending ? t("saving") : isLoggedIn ? t("confirm") : t("loginAndConfirm")}
            disabled={!startsAt || pending}
            onConfirm={confirm}
          />
        </aside>
      )}
    </div>
  );
}
