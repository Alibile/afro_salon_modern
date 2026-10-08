"use client";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { upsertFaqItem, toggleFaqItem, moveFaqItem, deleteFaqItem } from "@/actions/faq";
import { useActionError } from "@/lib/use-action-error";
import { pick, readI18nField, type I18nText } from "@/lib/i18n-content";
import type { ActionResult } from "@/lib/action-result";
import { I18nTextField, I18nTextarea } from "../I18nField";
import { DeleteButton } from "../DeleteButton";

export type FaqRow = { id: string; question: I18nText; answer: I18nText; sortOrder: number; isActive: boolean };

function FaqForm({ initial, nextOrder, onDone }: { initial?: FaqRow; /** Yeni soru listenin sonuna girer. */ nextOrder: number; onDone: () => void }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <form
      className="grid gap-4 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await upsertFaqItem({ id: initial?.id, question: readI18nField(fd, "question"), answer: readI18nField(fd, "answer"), sortOrder: Number(fd.get("sortOrder")) });
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(initial ? t("content.faq.updated") : t("content.faq.added"));
          router.refresh();
          onDone();
        });
      }}
    >
      <div className="sm:col-span-3">
        <I18nTextField name="question" label={t("content.faq.question")} defaultValue={initial?.question} maxLength={160} required />
      </div>
      <Field id={`faq-order-${initial?.id ?? "new"}`} label={t("content.faq.order")}>
        <Input id={`faq-order-${initial?.id ?? "new"}`} name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? nextOrder} />
      </Field>
      <div className="sm:col-span-4">
        <I18nTextarea name="answer" label={t("content.faq.answer")} defaultValue={initial?.answer} maxLength={600} rows={3} required hint={t.raw("content.faq.placeholders")} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-4">
        <Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={pending}>{initial ? t("common.save") : t("common.add")}</Button>
      </div>
    </form>
  );
}

/**
 * SSS listesi: soru (panel dilinde), durum, sıra düğmeleri, düzenle, pasif,
 * sil; üstte "Yeni soru" paneli. Paket yokken fiyat/süre yer tutucusu
 * kullanan soruların yanında uyarı.
 */
export function FaqManager({ items, hasPackage }: { items: FaqRow[]; hasPackage: boolean }) {
  const t = useTranslations("panel");
  const locale = useLocale();
  const showError = useActionError();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (action: () => Promise<ActionResult<unknown>>, success: string) =>
    start(async () => {
      const r = await action();
      if (!r.ok) { toast.error(showError(r)); return; }
      toast.success(success);
      router.refresh();
    });
  const nextOrder = items.length ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 0;
  const usesPackage = (row: FaqRow) => /\{(price|duration)\}/.test(row.answer.tr + (row.answer.en ?? "") + (row.answer.fr ?? ""));

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button size="sm" variant={creating ? "ghost" : "default"} onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
          {creating ? <X aria-hidden /> : <Plus aria-hidden />}
          {creating ? t("common.close") : t("content.faq.new")}
        </Button>
      </div>
      {creating && (
        <div className="rounded-[var(--radius)] border border-border p-4">
          <FaqForm nextOrder={nextOrder} onDone={() => setCreating(false)} />
        </div>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("content.faq.empty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
          {items.map((row, index) => (
            <li key={row.id} className="p-4">
              {editingId === row.id ? (
                <FaqForm initial={row} nextOrder={nextOrder} onDone={() => setEditingId(null)} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {pick(row.question, locale)}
                      {!row.isActive && <Badge variant="outline">{t("common.inactive")}</Badge>}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pick(row.answer, locale)}</p>
                    {!hasPackage && usesPackage(row) && <p className="mt-1 text-sm text-destructive">{t.raw("content.faq.noPackage")}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1 sm:justify-end">
                    <Button size="icon-sm" variant="outline" aria-label={t("content.faq.moveUp")} disabled={pending || index === 0} onClick={() => run(() => moveFaqItem(row.id, "up"), t("content.faq.reordered"))}>
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={t("content.faq.moveDown")} disabled={pending || index === items.length - 1} onClick={() => run(() => moveFaqItem(row.id, "down"), t("content.faq.reordered"))}>
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(row.id)}>{t("common.edit")}</Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => toggleFaqItem(row.id, !row.isActive), t("common.updated"))}>
                      {row.isActive ? t("common.deactivate") : t("common.activate")}
                    </Button>
                    <DeleteButton
                      title={t("content.faq.deleteTitle")}
                      description={t("content.faq.deleteDescription", { question: row.question.tr })}
                      onConfirm={() => deleteFaqItem(row.id)}
                      successMessage={t("content.faq.deleted")}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
