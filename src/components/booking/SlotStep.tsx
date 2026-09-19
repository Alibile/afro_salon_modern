"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatShopTime } from "@/lib/time";
import { useActionError } from "@/lib/use-action-error";

type Availability = { slots: string[]; isOpenToday: boolean; opensAt: string | null };

export function SlotStep({ barberId, durationMinutes, selected, onSelect }: { barberId: string; durationMinutes: number; selected: string | null; onSelect: (iso: string) => void }) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const showError = useActionError();
  const [data, setData] = useState<Availability | null>(null);
  /**
   * Hatada saklanan şey metin değil **anahtar**: metin her render'da o anki
   * dilde üretilir. Uç nokta bir anahtar döndürdüyse (`errors.invalidRequest`)
   * o çevrilir; ağ hatası gibi anahtarsız durumlarda boş dize kalır ve genel
   * `slotsError` metni görünür.
   */
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Barber/süre değişince önceki saatleri temizleyip yeniden yükleniyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    // Önceki berberin hatası yeni istekte ekranda kalmasın.
    setErrorKey(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body: unknown = await r.json().catch(() => null);
          const key = (body as { error?: unknown } | null)?.error;
          throw new Error(typeof key === "string" ? key : "");
        }
        return (await r.json()) as Availability;
      })
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setErrorKey(e.message));
    return () => { alive = false; };
  }, [barberId, durationMinutes]);

  return (
    <section>
      <h2 className="display-md mb-4">{t("step3")}</h2>
      {errorKey !== null && (
        <p className="text-destructive">{errorKey ? showError({ error: errorKey }) : t("slotsError")}</p>
      )}
      {!data && errorKey === null && <p className="text-muted-foreground">{tCommon("loading")}</p>}
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
