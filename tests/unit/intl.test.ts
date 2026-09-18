import { describe, it, expect } from "vitest";
import { intlLocale, weekdayName } from "@/lib/intl";

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
