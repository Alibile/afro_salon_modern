"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable, RBody, RCell, RHead, RHeadCell, RHeader, RRow } from "./ResponsiveTable";
import { toggleService, deleteService } from "@/actions/services";
import { ServiceForm } from "./ServiceForm";
import { InlinePrice } from "./InlinePrice";
import { DeleteButton } from "./DeleteButton";
import type { I18nText } from "@/lib/i18n-content";

/** `name` panel kullanıcısının dilindeki ad; `nameI18n` düzenleme formunun üç sekmesi. */
export type ServiceRowData = {
  id: string;
  name: string;
  nameI18n: I18nText;
  durationMinutes: number;
  priceKurus: number;
  sortOrder: number;
  isActive: boolean;
  usageCount: number;
};

/**
 * Hizmetler tablosu: ad, süre, fiyat (satır içi düzenlenir), sıra, durum ve
 * eylemler. "Düzenle" satırın altında tam genişlik bir form satırı açar.
 * Telefonda satırlar etiketli kartlara düşer.
 */
export function ServiceTable({ services }: { services: ServiceRowData[] }) {
  const t = useTranslations("panel");
  const tc = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const H = { name: t("services.name"), duration: t("services.duration"), price: t("services.price"), order: t("services.sortOrder"), status: t("appointments.status"), actions: t("common.actions") };
  return (
    <ResponsiveTable>
      <RHeader>
        <RHead>
          <RHeadCell>{H.name}</RHeadCell>
          <RHeadCell>{H.duration}</RHeadCell>
          <RHeadCell>{H.price}</RHeadCell>
          <RHeadCell>{H.order}</RHeadCell>
          <RHeadCell>{H.status}</RHeadCell>
          <RHeadCell className="text-right">{H.actions}</RHeadCell>
        </RHead>
      </RHeader>
      <RBody>
        {services.map((s) => (
          <ServiceRows key={s.id} service={s} H={H} editing={editingId === s.id} onEdit={() => setEditingId(s.id)} onDone={() => setEditingId(null)} pending={pending}
            onToggle={() => start(async () => { await toggleService(s.id, !s.isActive); router.refresh(); })} tc={tc} t={t} />
        ))}
      </RBody>
    </ResponsiveTable>
  );
}

function ServiceRows({ service: s, H, editing, onEdit, onDone, pending, onToggle, tc, t }: {
  service: ServiceRowData; H: Record<string, string>; editing: boolean; onEdit: () => void; onDone: () => void; pending: boolean; onToggle: () => void;
  tc: ReturnType<typeof useTranslations<"common">>; t: ReturnType<typeof useTranslations<"panel">>;
}) {
  return (
    <>
      <RRow>
        <RCell label={H.name} className="font-medium whitespace-normal">{s.name}</RCell>
        <RCell label={H.duration} className="tabular-nums">{tc("minutesShort", { count: s.durationMinutes })}</RCell>
        <RCell label={H.price} className="tabular-nums"><InlinePrice service={s} /></RCell>
        <RCell label={H.order} className="tabular-nums">{s.sortOrder}</RCell>
        <RCell label={H.status}>
          {s.isActive ? <span className="text-sm text-muted-foreground">{t("common.active")}</span> : <Badge variant="outline">{t("common.inactive")}</Badge>}
        </RCell>
        <RCell className="md:text-right">
          <div className="flex flex-wrap gap-1 md:justify-end">
            <Button size="sm" variant="outline" onClick={onEdit}>{t("common.edit")}</Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={onToggle}>{s.isActive ? t("common.deactivate") : t("common.activate")}</Button>
            <DeleteButton
              title={t("services.deleteTitle")}
              description={t("services.deleteDescription", { name: s.name })}
              disabled={s.usageCount > 0}
              disabledReason={s.usageCount > 0 ? t("services.deleteBlocked") : undefined}
              onConfirm={() => deleteService(s.id)}
              successMessage={t("services.deleted")}
            />
          </div>
        </RCell>
      </RRow>
      {editing && (
        <RRow>
          <RCell colSpan={6} className="bg-muted/40 whitespace-normal md:px-4 md:py-4">
            <ServiceForm initial={s} onDone={onDone} />
          </RCell>
        </RRow>
      )}
    </>
  );
}
