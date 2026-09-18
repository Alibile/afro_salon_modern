import { describe, it, expect } from "vitest";
import { formatPercent, intlLocale, percentAffix, weekdayName } from "@/lib/intl";

describe("intlLocale", () => {
  it("uygulama dilini biçimlendirme etiketine çevirir", () => {
    expect(intlLocale("tr")).toBe("tr-TR");
    expect(intlLocale("fr")).toBe("fr-FR");
  });

  // İngilizce `en-GB`: tarih sırası üç dilde de gün–ay–yıl kalsın diye.
  it("İngilizce için Britanya etiketini kullanır", () => {
    expect(intlLocale("en")).toBe("en-GB");
  });

  it("tanımadığı değeri varsayılana düşürür", () => {
    expect(intlLocale("de")).toBe("tr-TR");
    expect(intlLocale(undefined)).toBe("tr-TR");
  });
});

describe("weekdayName", () => {
  it("gün numarasını dilin kendi yazımına çevirir", () => {
    expect(weekdayName(1, "tr")).toBe("Pazartesi");
    expect(weekdayName(1, "en")).toBe("Monday");
    expect(weekdayName(0, "tr")).toBe("Pazar");
    expect(weekdayName(6, "en")).toBe("Saturday");
  });

  // Fransızca gün adları küçük harfle başlar; liste başlığı olarak büyütülür.
  it("Fransızca gün adının ilk harfini büyütür", () => {
    expect(weekdayName(1, "fr")).toBe("Lundi");
    expect(weekdayName(0, "fr")).toBe("Dimanche");
  });
});

describe("percentAffix / formatPercent", () => {
  // Türkçe işareti sayıdan önce yazar, İngilizce bitişik sonra, Fransızca
  // araya dar bölünmez boşluk (U+202F) koyar.
  it("yüzde işaretini dilin kuralına göre yerleştirir", () => {
    expect(formatPercent(95, "tr")).toBe("%95");
    expect(formatPercent(95, "en")).toBe("95%");
    expect(formatPercent(95, "fr")).toBe("95\u202F%");
  });

  it("Fransızcada dar bölünmez boşluk kullanır, düz boşluk değil", () => {
    expect(formatPercent(95, "fr")).not.toBe("95 %");
    expect(percentAffix("fr").suffix.charCodeAt(0)).toBe(0x202f);
  });

  // `CountUp` ara değerleri de basar; sayaç tam sayı gösterir.
  it("ara değerleri tam sayıya yuvarlar", () => {
    expect(formatPercent(94.6, "tr")).toBe("%95");
    expect(formatPercent(0, "en")).toBe("0%");
  });
});
