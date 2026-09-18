"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatShopTime } from "@/lib/time";

type Availability = { slots: string[]; isOpenToday: boolean; opensAt: string | null };

export function SlotStep({ barberId, durationMinutes, selected, onSelect }: { barberId: string; durationMinutes: number; selected: string | null; onSelect: (iso: string) => void }) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<Availability | null>(null);
  // Hata durumu bayraktır, metin değil: metin her render'da o anki dilde üretilir.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // Barber/süre değişince önceki saatleri temizleyip yeniden yükleniyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("availability request failed");
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [barberId, durationMinutes]);

  return (
    <section>
      <h2 className="display-md mb-4">{t("step3")}</h2>
      {failed && <p className="text-destructive">{t("slotsError")}</p>}
      {!data && !failed && <p className="text-muted-foreground">{tCommon("loading")}</p>}
      {data && !data.isOpenToday && (
        <p className="border border-border bg-muted p-4">
          {t("closedToday")} {data.opensAt ? t("tryTomorrow", { time: data.opensAt }) : ""}
        </p>
      )}
      {data && data.isOpenToday && data.slots.length === 0 && (
        <p className="border border-border bg-muted p-4">
          {t("noSlots")} {data.opensAt ? t("tryTomorrow", { time: data.opensAt }) : ""}
        </p>
      )}
      {data && data.slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {data.slots.map((iso) => (
            <button key={iso} type="button" onClick={() => onSelect(iso)} aria-pressed={selected === iso}
              className={cn("border border-border bg-card py-2.5 text-sm font-medium tabular-nums transition-colors", selected === iso ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40")}>
              {formatShopTime(new Date(iso))}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
