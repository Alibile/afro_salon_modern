import { describe, it, expect } from "vitest";
import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type Tree = { [key: string]: string | Tree };

/**
 * Anahtar yollarını dosyadaki **sırayla** düzleştirir. Sıra da karşılaştırılır:
 * `Messages` tipi `tr.json`'dan türetildiği için eksik bir anahtar zaten
 * derlemede yakalanır, ama fazladan/kaymış anahtarlar yakalanmaz — üç dosya
 * yan yana okunabilir kalsın diye sıra da bağlanır.
 */
function keyPaths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

const LOCALES: Record<string, Tree> = { en: en as Tree, fr: fr as Tree };

describe("messages/*.json", () => {
  const reference = keyPaths(tr as Tree);

  it("Türkçe dosya boş değil", () => {
    expect(reference.length).toBeGreaterThan(200);
  });

  it("üç dil aynı anahtar ağacını aynı sırayla taşır", () => {
    for (const [locale, tree] of Object.entries(LOCALES)) {
      expect(keyPaths(tree), `messages/${locale}.json`).toEqual(reference);
    }
  });

  it("hiçbir dilde boş değer yok", () => {
    for (const [locale, tree] of Object.entries({ tr: tr as Tree, ...LOCALES })) {
      const empty = keyPaths(tree).filter((path) => {
        const value = path.split(".").reduce<unknown>((node, key) => (node as Tree)[key], tree);
        return typeof value !== "string" || value.trim() === "";
      });
      expect(empty, `messages/${locale}.json`).toEqual([]);
    }
  });

  /**
   * Yer tutucular çeviride kolayca düşer; düşerse kullanıcı sayıyı ya da adı
   * hiç görmez. Türkçedeki her `{ad}` öbür iki dilde de aranır.
   */
  it("yer tutucular her dilde korunur", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
    for (const path of reference) {
      const read = (tree: Tree) => path.split(".").reduce<unknown>((node, key) => (node as Tree)[key], tree) as string;
      const expected = placeholders(read(tr as Tree));
      if (expected.length === 0) continue;
      for (const [locale, tree] of Object.entries(LOCALES)) {
        expect(placeholders(read(tree)), `${locale}: ${path}`).toEqual(expected);
      }
    }
  });
});
