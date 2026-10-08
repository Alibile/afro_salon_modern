import { z } from "zod";
import { i18nText, type I18nText } from "@/lib/i18n-content";
import { CONTENT_KEYS, isContentKey, type ContentKey } from "@/lib/content-keys";
import type { ErrorKey } from "@/lib/errors";

/**
 * Panelden gelen içerik blokları: `{ anahtar: { tr, en, fr } }`. Her anahtar
 * `CONTENT_KEYS` listesinden olmalı ve kendi üst sınırına uymalı. Üç dili de
 * boş olan değer "sil" demektir; action o satırı kaldırır.
 */
export type ContentBlocksInput = Record<string, { tr: string; en?: string; fr?: string }>;
export type ParsedContentBlocks = Partial<Record<ContentKey, I18nText>>;

export function parseContentBlocks(input: unknown): { ok: true; data: ParsedContentBlocks } | { ok: false; error: ErrorKey } {
  const record = z.record(z.string(), z.unknown()).safeParse(input);
  if (!record.success) return { ok: false, error: "errors.invalidInput" };
  const data: ParsedContentBlocks = {};
  for (const [key, value] of Object.entries(record.data)) {
    if (!isContentKey(key)) return { ok: false, error: "errors.invalidInput" };
    const parsed = i18nText({ max: CONTENT_KEYS[key].max, maxError: "errors.invalidInput" }).safeParse(value);
    if (!parsed.success) return { ok: false, error: "errors.invalidInput" };
    data[key] = parsed.data;
  }
  return { ok: true, data };
}
