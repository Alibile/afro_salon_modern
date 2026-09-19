import { describe, it, expect } from "vitest";
import { singlePackage } from "@/lib/package";
import { faqValueBag, visibleFaqKeys, FAQ_KEYS, type FaqValues } from "@/components/landing/FaqSection";

const HOURS = { minutes: 120, open: "11:00", close: "22:30" };
const withPackage: FaqValues = { ...HOURS, package: { price: "700,00 ₺", duration: 45 } };
const withoutPackage: FaqValues = { ...HOURS, package: null };

const service = (id: string) => ({ id, durationMinutes: 45, priceKurus: 70000 });

describe("singlePackage", () => {
  it("tam olarak bir aktif hizmet varsa onu döner", () => {
    expect(singlePackage([service("a")])).toEqual(service("a"));
  });

  it("sıfır ya da birden çok hizmette null döner", () => {
    expect(singlePackage([])).toBeNull();
    expect(singlePackage([service("a"), service("b")])).toBeNull();
  });
});

describe("visibleFaqKeys", () => {
  it("tek paket varken altı sorunun hepsi görünür", () => {
    expect(visibleFaqKeys(withPackage).map((i) => i.q)).toEqual(["q1", "q2", "q3", "q4", "q5", "q6"]);
  });

  /**
   * İkinci bir hizmet eklendiğinde "45 dakika sürer, fiyat tek: 700,00 ₺"
   * cevabı yanlış olurdu: yalnızca o soru düşer, kalan beşi yerinde kalır.
   * Aynı liste JSON-LD'yi de beslediği için yapısal veri de onunla birlikte
   * kısalır.
   */
  it("paket yoksa yalnızca fiyat/süre sorusu düşer", () => {
    expect(visibleFaqKeys(withoutPackage).map((i) => i.q)).toEqual(["q1", "q2", "q3", "q5", "q6"]);
    expect(FAQ_KEYS.filter((i) => i.needsPackage).map((i) => i.q)).toEqual(["q4"]);
  });
});

describe("faqValueBag", () => {
  it("paket varken fiyat ve süreyi de taşır", () => {
    expect(faqValueBag(withPackage)).toEqual({ minutes: 120, open: "11:00", close: "22:30", price: "700,00 ₺", duration: 45 });
  });

  it("paket yokken fiyat/süre anahtarlarını hiç göndermez", () => {
    const bag = faqValueBag(withoutPackage);
    expect(bag).toEqual({ minutes: 120, open: "11:00", close: "22:30" });
    expect("price" in bag).toBe(false);
    expect("duration" in bag).toBe(false);
  });
});
