import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `src/app/icon.svg` tarayıcıya doğrudan servis edilir; XML kuralına aykırı
 * tek bir karakter (yorum içinde `--`) favicon'un hiç çizilmemesine yol açar.
 * Bu test o hatayı bir daha yaşamamak için var.
 */
describe("icon.svg", () => {
  const svg = readFileSync("src/app/icon.svg", "utf8");

  it("yorumlarda çift tire barındırmaz", () => {
    const comments = svg.match(/<!--[\s\S]*?-->/g) ?? [];
    for (const c of comments) {
      expect(c.slice(4, -3)).not.toMatch(/--/);
    }
  });

  it("işaretin yaylarını ve merkez noktasını içerir", () => {
    expect(svg).toMatch(/<svg[^>]+viewBox="0 0 64 64"/);
    expect((svg.match(/<path /g) ?? []).length).toBe(4);
    expect(svg).toMatch(/<circle[^>]+r="2\.75"/);
  });
});
