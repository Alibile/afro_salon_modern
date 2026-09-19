import { z } from "zod";
import type { ErrorKey } from "@/lib/errors";

/**
 * Panelden girilen içerik (hizmet adı, site metinleri, galeri başlığı) tek bir
 * dilde değil, üçünde birden yaşar. Veritabanında `Json` bir sütunda durur ve
 * şekli her zaman budur: Türkçe zorunlu kaynak metin, İngilizce ve Fransızca
 * isteğe bağlı çeviriler.
 *
 * Çeviri girilmemişse alan **boş bırakılmaz, hiç yazılmaz**: `pick` boş dizeyi
 * de yok sayar, böylece panelde EN sekmesi silinince ziyaretçi boş bir başlık
 * değil Türkçesini görür.
 */
export type I18nText = { tr: string; en?: string; fr?: string };

/**
 * Prisma'nın `Json` sütunlardan döndürdüğü serbest değeri (`JsonValue`) bu
 * şekle indirger. Bozuk/eksik bir satır uygulamayı düşürmemeli: tanınmayan her
 * şey boş Türkçe metne düşer.
 */
export function asI18nText(value: unknown): I18nText {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { tr: "" };
  const raw = value as Record<string, unknown>;
  const text: I18nText = { tr: typeof raw.tr === "string" ? raw.tr : "" };
  if (typeof raw.en === "string") text.en = raw.en;
  if (typeof raw.fr === "string") text.fr = raw.fr;
  return text;
}

/**
 * İçerik alanının ziyaretçinin dilindeki karşılığı. Çeviri yoksa ya da boşsa
 * Türkçe kaynak metne düşer — yarım çevrilmiş bir salonda boşluk değil, hiç
 * olmazsa anlaşılır bir metin durur.
 */
export function pick(value: unknown, locale: string | null | undefined): string {
  const text = asI18nText(value);
  const translated = locale === "en" || locale === "fr" ? text[locale] : undefined;
  return translated !== undefined && translated.trim() !== "" ? translated : text.tr;
}

/** İki içerik alanının üç dilde de birebir aynı olması (seed'in "dokunulmamış mı?" sorusu). */
export function sameI18nText(a: unknown, b: unknown): boolean {
  const x = asI18nText(a);
  const y = asI18nText(b);
  return x.tr === y.tr && (x.en ?? "") === (y.en ?? "") && (x.fr ?? "") === (y.fr ?? "");
}

type I18nTextOptions = {
  /** Her dil için en fazla karakter. */
  max: number;
  /** Türkçe alan boş bırakılamaz (hizmet adı gibi kaynak metinlerde). */
  trRequired?: boolean;
  /** Doldurulmuş her dil için en az karakter; boş bırakılan çeviri sınanmaz. */
  min?: number;
  /** Alt sınır ihlalinde dönecek hata anahtarı. */
  minError?: ErrorKey;
  /** Üst sınır ihlalinde dönecek hata anahtarı. */
  maxError?: ErrorKey;
};

/**
 * Üç dilli bir metin alanının Zod şeması. Girdi panelin üç sekmesinden gelir
 * (`{ tr, en, fr }`); çıktı veritabanına yazılacak {@link I18nText}'tir ve boş
 * bırakılan çeviriler düşürülür.
 */
export function i18nText(options: I18nTextOptions) {
  const { max, trRequired = false, min, minError, maxError } = options;
  /** Boş bırakılan çeviri alt sınıra takılmaz; "yazılmamış" ile "çok kısa" ayrı şeyler. */
  const longEnough = (value: string) => value === "" || min === undefined || value.length >= min;

  const tr = trRequired
    ? z.string().trim().min(min ?? 1, minError).max(max, maxError)
    : z.string().trim().max(max, maxError).refine(longEnough, minError);
  const translation = z.string().trim().max(max, maxError).refine(longEnough, minError).optional();

  return z.object({ tr, en: translation, fr: translation }).transform((value): I18nText => {
    const text: I18nText = { tr: value.tr };
    if (value.en) text.en = value.en;
    if (value.fr) text.fr = value.fr;
    return text;
  });
}

/** Panel formlarının `FormData`'sından bir içerik alanını toplar (`ad.tr`, `ad.en`, `ad.fr`). */
export function readI18nField(fd: FormData, name: string): { tr: string; en: string; fr: string } {
  return {
    tr: String(fd.get(`${name}.tr`) ?? ""),
    en: String(fd.get(`${name}.en`) ?? ""),
    fr: String(fd.get(`${name}.fr`) ?? ""),
  };
}
