"use client";
import { useState, useTransition, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatKurus, parsePriceInput } from "@/lib/money";
import { upsertService } from "@/actions/services";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";
import type { I18nText } from "@/lib/i18n-content";

type Service = { id: string; nameI18n: I18nText; durationMinutes: number; priceKurus: number; sortOrder: number };

export function InlinePrice({ service }: { service: Service }) {
  const t = useTranslations("panel.services");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  // Bir düzenleme oturumunda birden fazla kaydetmeyi (Enter->blur ikilemesi
  // veya Esc sonrası artık DOM'dan kalkan input'un blur'u) engeller.
  const settledRef = useRef(false);

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={t("editPrice")}
        className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
        onClick={() => {
          settledRef.current = false;
          setEditing(true);
        }}
      >
        {formatKurus(service.priceKurus, locale)}
      </button>
    );
  }

  const save = (raw: string) => {
    if (settledRef.current) return;
    settledRef.current = true;
    const parsed = parsePriceInput(raw);
    // Boş bırakılan alan "0 ₺" demek değildir; kaydetmeden çık.
    if (parsed.kind === "empty") {
      setEditing(false);
      return;
    }
    if (parsed.kind === "invalid") {
      toast.error(t("invalidPrice"));
      setEditing(false);
      return;
    }
    const priceLira = parsed.lira;
    if (priceLira < 0 || Math.round(priceLira * 100) === service.priceKurus) {
      setEditing(false);
      return;
    }
    start(async () => {
      const r = await upsertService({
        id: service.id,
        name: service.nameI18n,
        durationMinutes: service.durationMinutes,
        priceLira,
        sortOrder: service.sortOrder,
      });
      if (!r.ok) {
        toast.error(showError(r));
        setEditing(false);
        return;
      }
      toast.success(t("priceUpdated"));
      setEditing(false);
      router.refresh();
    });
  };

  const cancel = () => {
    settledRef.current = true;
    setEditing(false);
  };

  return (
    <Input
      type="number"
      step="0.01"
      min={0}
      autoFocus
      disabled={pending}
      defaultValue={service.priceKurus / 100}
      className="h-8 w-28"
      onBlur={(e) => save(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          cancel();
        }
      }}
    />
  );
}
