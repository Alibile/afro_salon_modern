import { describe, it, expect } from "vitest";
import { formatKurus, parsePriceInput } from "@/lib/money";

describe("formatKurus", () => {
  it("formats with Turkish separators", () => {
    expect(formatKurus(40000)).toBe("400,00 ₺");
    expect(formatKurus(125050)).toBe("1.250,50 ₺");
    expect(formatKurus(0)).toBe("0,00 ₺");
  });

  it("dil verildiğinde o dilin yazımını kullanır", () => {
    expect(formatKurus(40000, "tr")).toBe("400,00 ₺");
    expect(formatKurus(40000, "en")).toBe("₺400.00");
    expect(formatKurus(40000, "fr")).toBe("400,00 ₺");
  });

  // Binlik ayracı üç dilde üç ayrı işaret: nokta, virgül ve dar boşluk.
  it("binlik ayracı dile göre değişir", () => {
    expect(formatKurus(125050, "en")).toBe("₺1,250.50");
    expect(formatKurus(125050, "fr")).toMatch(/^1\s?250,50 ₺$/u);
  });
});

describe("parsePriceInput", () => {
  it("boş alanı fiyat saymaz", () => {
    expect(parsePriceInput("")).toEqual({ kind: "empty" });
    expect(parsePriceInput("   ")).toEqual({ kind: "empty" });
  });

  it("sayıya çevrilemeyen değeri geçersiz sayar", () => {
    expect(parsePriceInput("abc")).toEqual({ kind: "invalid" });
    expect(parsePriceInput("12,50")).toEqual({ kind: "invalid" });
    expect(parsePriceInput("Infinity")).toEqual({ kind: "invalid" });
  });

  it("geçerli sayıyı lira olarak döner", () => {
    expect(parsePriceInput("350")).toEqual({ kind: "value", lira: 350 });
    expect(parsePriceInput(" 12.5 ")).toEqual({ kind: "value", lira: 12.5 });
    expect(parsePriceInput("0")).toEqual({ kind: "value", lira: 0 });
  });
});
