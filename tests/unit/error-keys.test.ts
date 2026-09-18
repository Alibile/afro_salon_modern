import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ERROR_CODES, firstIssueKey, formatActionError, isErrorKey, type ErrorTranslator } from "@/lib/errors";
import { MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH } from "@/lib/gallery-utils";
import { MAX_GALLERY_BATCH } from "@/schemas/gallery";
import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const LOCALES = { tr, en, fr };
const SRC = path.join(process.cwd(), "src");

/** `src/` altındaki her `.ts`/`.tsx` dosyası; üretilmiş Prisma istemcisi hariç. */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Kodda geçen `"errors.*"` dizeleri. Anahtarlar `fail()` çağrılarında ve Zod
 * mesajlarında düz dize olarak yazılı olduğu için kaynağı taramak, "anahtar var
 * ama çevirisi yok" durumunu yakalamanın en doğrudan yolu.
 */
function usedKeys(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/"(errors\.[A-Za-z0-9_]+)"/g)) {
      const key = match[1];
      found.set(key, [...(found.get(key) ?? []), path.relative(process.cwd(), file)]);
    }
  }
  return found;
}

describe("hata anahtarları", () => {
  it("üç mesaj dosyası da tam olarak aynı anahtarları taşır", () => {
    const expected = [...ERROR_CODES].sort();
    for (const [locale, messages] of Object.entries(LOCALES)) {
      expect(Object.keys(messages.errors).sort(), `messages/${locale}.json`).toEqual(expected);
    }
  });

  it("hiçbir dilde boş çeviri yok", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      for (const [key, value] of Object.entries(messages.errors)) {
        expect(value.trim(), `${locale}: ${key}`).not.toBe("");
      }
    }
  });

  // `{minutes}` yer tutucusu üç dilde de durmalı: biri düşerse kullanıcı
  // "kaç dakika" bilgisini kaybeder ve `params` sessizce boşa gider.
  it("yer tutucular her dilde korunur", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      expect(messages.errors.cancelWindow, locale).toContain("{minutes}");
    }
  });

  /**
   * İki mesaj sınır sayılarını metnin içinde taşıyor (ICU parametresi yok:
   * sayılar derleme zamanı sabiti, çalışma zamanı verisi değil). Sabit
   * değişirse çeviriler sessizce eskimesin diye bağ burada kuruluyor.
   */
  it("sınır sayıları şemadaki sabitlerle aynı", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      expect(messages.errors.tooManyPhotos, locale).toContain(String(MAX_GALLERY_BATCH));
      expect(messages.errors.invalidTags, locale).toContain(String(MAX_TAGS));
      expect(messages.errors.invalidTags, locale).toContain(String(TAG_MIN_LENGTH));
      expect(messages.errors.invalidTags, locale).toContain(String(TAG_MAX_LENGTH));
    }
  });

  it("kaynakta geçen her anahtarın çevirisi var", () => {
    const unknown = [...usedKeys()].filter(([key]) => !isErrorKey(key));
    expect(unknown.map(([key, files]) => `${key} (${files.join(", ")})`)).toEqual([]);
  });

  it("listedeki her anahtar gerçekten kullanılıyor", () => {
    const used = new Set(usedKeys().keys());
    // `invalidInput` yalnızca `firstIssueKey` içinde yedek olarak geçer.
    const unused = ERROR_CODES.filter((code) => !used.has(`errors.${code}`));
    expect(unused).toEqual([]);
  });
});

describe("firstIssueKey", () => {
  it("şemanın yazdığı anahtarı olduğu gibi geçirir", () => {
    expect(firstIssueKey({ issues: [{ message: "errors.messageMin10" }] })).toBe("errors.messageMin10");
  });

  it("Zod'un kendi İngilizce metnini genel anahtara indirir", () => {
    expect(firstIssueKey({ issues: [{ message: "Too big: expected string to have <=80 characters" }] })).toBe("errors.invalidInput");
    expect(firstIssueKey({ issues: [] })).toBe("errors.invalidInput");
  });
});

describe("formatActionError", () => {
  const t: ErrorTranslator = Object.assign(
    (code: string, values?: Record<string, string | number>) =>
      Object.entries(values ?? {}).reduce(
        (text, [k, v]) => text.replace(`{${k}}`, String(v)),
        (tr.errors as Record<string, string>)[code],
      ),
    { has: (code: string) => code in tr.errors },
  );

  it("anahtarı diline çevirir", () => {
    expect(formatActionError(t, { error: "errors.slotTaken" })).toBe("Bu saat az önce doldu, lütfen başka bir saat seçin");
  });

  it("yer tutucuyu doldurur", () => {
    expect(formatActionError(t, { error: "errors.cancelWindow", params: { minutes: 120 } })).toContain("120 dakikadan");
  });

  // Panel (Task 3) henüz çevrilmedi; tanınmayan bir değer boş uyarıya değil,
  // ham metne düşmeli.
  it("tanımadığı değeri olduğu gibi döner", () => {
    expect(formatActionError(t, { error: "Beklenmeyen bir şey" })).toBe("Beklenmeyen bir şey");
    expect(formatActionError(t, { error: "errors.yokBoyleBirSey" })).toBe("errors.yokBoyleBirSey");
  });
});
