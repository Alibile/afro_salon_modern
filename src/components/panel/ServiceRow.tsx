"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleService, deleteService } from "@/actions/services";
import { ServiceForm } from "./ServiceForm";
import { InlinePrice } from "./InlinePrice";
import { DeleteButton } from "./DeleteButton";
import type { I18nText } from "@/lib/i18n-content";

/** `name` panel kullanıcısının dilindeki ad; `nameI18n` düzenleme formunun üç sekmesi. */
type S = {
  id: string;
  name: string;
  nameI18n: I18nText;
  durationMinutes: number;
  priceKurus: number;
  sortOrder: number;
  isActive: boolean;
  usageCount: number;
};

export function ServiceRow({ service }: { service: S }) {
  const t = useTranslations("panel");
  // Süre birimi müşteri yüzüyle ortak; ikinci çevirmen yalnızca onun için.
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="rounded-xl border bg-card p-4">
      {editing ? (
        <ServiceForm initial={service} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{service.name} {!service.isActive && <Badge variant="secondary">{t("common.inactive")}</Badge>}</p>
            <p className="text-sm text-muted-foreground">
              {tc("minutesShort", { count: service.durationMinutes })} · <InlinePrice service={service} /> · {t("services.order", { order: service.sortOrder })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{t("common.edit")}</Button>
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => start(async () => { await toggleService(service.id, !service.isActive); router.refresh(); })}>
              {service.isActive ? t("common.deactivate") : t("common.activate")}
            </Button>
            <DeleteButton
              title={t("services.deleteTitle")}
              description={t("services.deleteDescription", { name: service.name })}
              disabled={service.usageCount > 0}
              disabledReason={service.usageCount > 0 ? t("services.deleteBlocked") : undefined}
              onConfirm={() => deleteService(service.id)}
              successMessage={t("services.deleted")}
            />
          </div>
        </div>
      )}
    </li>
  );
}
