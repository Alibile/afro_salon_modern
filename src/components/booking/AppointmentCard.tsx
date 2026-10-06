import { useLocale, useTranslations } from "next-intl";
import { StatusDot } from "@/components/ui/status-dot";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopDayParts, formatShopTime, shopDayDelta } from "@/lib/time";
import type { AppLocale } from "@/i18n/routing";
import type { AppointmentView } from "@/lib/queries/customer";
import { CancelButton } from "./CancelButton";

/**
 * Randevu kartı iki biçimde: en yakın randevu büyük kartta (terracotta sol
 * çizgi, saat büyük), gerisi liste satırında (solda tarih bloğu: gün adı ve
 * gün numarası; sağda saat, berber, hizmet, tutar, durum). İlk iki gün adıyla
 * değil yakınlığıyla anılır ("Bugün", "Yarın"); fark dükkanın takviminde
 * ölçülür. Meta bilgiler orta noktayla değil ayrı satır ve sütunlarla ayrılır.
 */
export function AppointmentCard({ a, shopPhone, big = false }: { a: AppointmentView; shopPhone: string; big?: boolean }) {
  const t = useTranslations("booking");
  const locale = useLocale() as AppLocale;
  const delta = shopDayDelta(a.startsAt, new Date());
  const dayPrefix = delta === 0 ? t("today") : delta === 1 ? t("tomorrow") : null;
  const services = a.services.map((s) => s.name).join(", ");
  const status = <StatusDot status={a.status} label={t(`status.${a.status}`)} />;
  const footer = a.status === "SCHEDULED" && (
    <div className="mt-3">
      {a.canCancel ? <CancelButton id={a.id} /> : <p className="text-sm text-muted-foreground">{t("cancelByPhone", { phone: shopPhone })}</p>}
    </div>
  );

  if (big) {
    return (
      <div className="rounded-[var(--radius)] border-l-4 border-primary bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="display-md tabular-nums">
            {formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}
          </p>
          {status}
        </div>
        <p className="mt-2 text-muted-foreground">
          {dayPrefix ? `${dayPrefix}, ` : ""}
          {formatShopDate(a.startsAt, locale)}
        </p>
        <p className="text-muted-foreground">{a.barberName}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 text-sm">
          <span>{services}</span>
          <span className="tabular-nums">{formatKurus(a.totalKurus, locale)}</span>
        </p>
        {footer}
      </div>
    );
  }

  const parts = formatShopDayParts(a.startsAt, locale);
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="text-center">
        <span className="block text-xs text-muted-foreground">{parts.weekday}</span>
        <span className="display-sm block tabular-nums">{parts.day}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium tabular-nums">
            {dayPrefix && <span className="mr-2 text-primary">{dayPrefix},</span>}
            {formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}
          </p>
          {status}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{formatShopDate(a.startsAt, locale)}</p>
        <p className="text-sm text-muted-foreground">{a.barberName}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
          <span>{services}</span>
          <span className="tabular-nums">{formatKurus(a.totalKurus, locale)}</span>
        </p>
        {footer}
      </div>
    </div>
  );
}
