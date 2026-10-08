import { fillPlaceholders } from "@/lib/content";
import type { FaqView } from "@/lib/queries/content";

/**
 * SSS cevaplarının taşıyabileceği yer tutucuların değerleri. Paket yoksa
 * fiyat ve süre boş dize: cevap "… {price}" yerine "… " basar; yönetici o
 * soruyu panelde uyarıyla görür ve pasife alır. Çalışma saati hiç
 * girilmemişse açılış/kapanış da boş.
 */
export type FaqContext = {
  minutes: number;
  open: string | null;
  close: string | null;
  package: { price: string; duration: number } | null;
};

export function faqPlaceholderValues(ctx: FaqContext): Record<string, string | number> {
  return {
    minutes: ctx.minutes,
    open: ctx.open ?? "",
    close: ctx.close ?? "",
    price: ctx.package?.price ?? "",
    duration: ctx.package?.duration ?? "",
  };
}

/** Cevaplardaki yer tutucuları doldurur; sorulara dokunmaz. */
export function renderFaq(items: FaqView[], values: Record<string, string | number>): FaqView[] {
  return items.map((item) => ({ ...item, answer: fillPlaceholders(item.answer, values) }));
}
