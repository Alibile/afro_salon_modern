"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatShopDayShort, formatShopTime, shopDateTime, shopDayDelta } from "@/lib/time";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";

type DaySummary = { dateKey: string; open: boolean; slotCount: number };
type Availability = { slots: string[]; isOpen: boolean; opensAt: string | null };

/** Bir gün anahtarının ("2026-09-19") dükkan saat dilimindeki 00:00'ı. */
function dayInstant(dateKey: string): Date {
  return shopDateTime(dateKey, "00:00");
}

/**
 * Pencerenin ilk **seçilebilir** günü: bugünün yeri varsa bugün, yoksa yer olan
 * ilk gün. Hiçbir günde yer kalmamışsa hiç olmazsa **açık** bir güne düşülür
 * ("dolu" der, "kapalıyız" demez); o da yoksa ilk gün seçilir ki ziyaretçi boş
 * bir ızgara yerine bir cümle görsün.
 */
function defaultDay(days: DaySummary[]): string | null {
  const open = days.filter((d) => d.open);
  return (open.find((d) => d.slotCount > 0) ?? open[0] ?? days[0])?.dateKey ?? null;
}

/**
 * Gün çipleri: randevu penceresinin (bugün + 6 gün, Pazar hariç) günleri. Görsel
 * dil galeri süzgeçleriyle aynı — köşesiz kutu, ince çizgi, seçili olan dolu
 * terracotta; dar ekranda şerit yatay kayar. İlk iki gün adıyla değil
 * yakınlığıyla anılır ("Bugün", "Yarın"), gerisi kısa gün + tarih.
 */
function DayChips({
  days,
  selected,
  onSelect,
}: {
  days: DaySummary[];
  selected: string | null;
  onSelect: (dateKey: string) => void;
}) {
  const t = useTranslations("booking");
  const locale = useLocale() as AppLocale;
  // Her render'da yeniden okunur: sihirbaz açıkken gece yarısı geçerse
  // "Bugün" çipi donup yanlış günü etiketlemesin.
  const now = new Date();

  return (
    <div
      role="group"
      aria-label={t("dayLabel")}
      className={cn(
        "mb-4 flex gap-2 overflow-x-auto scroll-smooth pb-1 scrollbar-none",
        "snap-x snap-mandatory",
        "[mask-image:linear-gradient(to_right,transparent,black_14px,black_calc(100%-14px),transparent)]",
        "md:flex-wrap md:overflow-x-visible md:[mask-image:none]",
      )}
    >
      {days.map((day) => {
        const instant = dayInstant(day.dateKey);
        const delta = shopDayDelta(instant, now);
        const label = delta === 0 ? t("today") : delta === 1 ? t("tomorrow") : formatShopDayShort(instant, locale);
        const full = day.open && day.slotCount === 0;
        const disabled = !day.open || full;
        const isSelected = day.dateKey === selected;
        return (
          <button
            key={day.dateKey}
            type="button"
            data-date={day.dateKey}
            disabled={disabled}
            // Seçilemeyen bir çipin "basılı" duyurulması çelişkili olurdu:
            // devre dışıyken durum bildirilmez.
            aria-pressed={disabled ? undefined : isSelected}
            onClick={() => onSelect(day.dateKey)}
            className={cn(
              "flex h-9 shrink-0 snap-start items-center whitespace-nowrap border px-3.5 text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground enabled:hover:border-foreground enabled:hover:text-foreground",
            )}
          >
            {label}
            <span className="ml-2 text-xs tabular-nums opacity-70">
              {!day.open ? t("dayClosed") : full ? t("dayFull") : day.slotCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Gün ve saat tek adımda: üstte gün çipleri, altında o günün saat ızgarası.
 * İkisini ayrı adımlara bölmek ziyaretçiye fazladan bir dokunuş yükler — çipler
 * zaten hangi günün dolu olduğunu söylüyor.
 */
export function SlotStep({
  barberId,
  durationMinutes,
  day,
  onSelectDay,
  selected,
  onSelect,
}: {
  barberId: string;
  durationMinutes: number;
  /** Seçili gün anahtarı; `null` ise özetler gelince ilk uygun gün seçilir. */
  day: string | null;
  onSelectDay: (dateKey: string) => void;
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const showError = useActionError();
  const [days, setDays] = useState<DaySummary[] | null>(null);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}&summary=1`, { cache: "no-store" })
      .then(async (r) => ((await r.json()) as { days?: DaySummary[] }).days ?? [])
      .then((list) => {
        if (!alive) return;
        setDays(list);
        // Adresten gelen ya da önceden seçilmiş gün pencereden düştüyse
        // (gece yarısı geçtiyse, berber değiştiyse) seçim ilk uygun güne döner.
        if (!day || !list.some((d) => d.dateKey === day)) {
          const fallback = defaultDay(list);
          if (fallback) onSelectDay(fallback);
        }
      })
      .catch(() => alive && setDays([]));
    return () => {
      alive = false;
    };
    // `day`/`onSelectDay` kasten bağımlılık değil: özet yalnızca berber ya da
    // süre değişince yeniden çekilir, gün seçimi onu tetiklemez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId, durationMinutes]);

  useEffect(() => {
    if (!day) return;
    let alive = true;
    // Berber/süre/gün değişince önceki saatleri temizleyip yeniden yükleniyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    // Önceki isteğin hatası yeni istekte ekranda kalmasın.
    setErrorKey(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}&date=${day}`, { cache: "no-store" })
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
    return () => {
      alive = false;
    };
  }, [barberId, durationMinutes, day]);

  const isToday = day !== null && shopDayDelta(dayInstant(day), new Date()) === 0;
  /** "Yarın 11:00'de açılıyoruz" yalnızca bugüne bakarken bir şey söyler. */
  const tomorrowHint = isToday && data?.opensAt ? t("tryTomorrow", { time: data.opensAt }) : t("pickAnotherDay");

  return (
    <section>
      <h2 className="display-md mb-4">{t("step3")}</h2>
      {days && days.length > 0 && <DayChips days={days} selected={day} onSelect={onSelectDay} />}
      {errorKey !== null && (
        <p className="text-destructive">{errorKey ? showError({ error: errorKey }) : t("slotsError")}</p>
      )}
      {!data && errorKey === null && <p className="text-muted-foreground">{tCommon("loading")}</p>}
      {data && !data.isOpen && (
        <p className="border border-border bg-muted p-4">
          {t("closedDay")} {tomorrowHint}
        </p>
      )}
      {data && data.isOpen && data.slots.length === 0 && (
        <p className="border border-border bg-muted p-4">
          {t("noSlotsDay")} {tomorrowHint}
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
