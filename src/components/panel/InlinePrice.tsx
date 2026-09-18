"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatKurus, parsePriceInput } from "@/lib/money";
import { upsertService } from "@/actions/services";

type Service = { id: string; name: string; durationMinutes: number; priceKurus: number; sortOrder: number };

export function InlinePrice({ service }: { service: Service }) {
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
        aria-label="Fiyatı düzenle"
        className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
        onClick={() => {
          settledRef.current = false;
          setEditing(true);
        }}
      >
        {formatKurus(service.priceKurus)}
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
      toast.error("Geçersiz fiyat");
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
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceLira,
        sortOrder: service.sortOrder,
      });
      if (!r.ok) {
        toast.error(r.error);
        setEditing(false);
        return;
      }
      toast.success("Fiyat güncellendi");
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
