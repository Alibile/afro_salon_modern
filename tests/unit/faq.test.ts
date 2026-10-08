import { describe, it, expect } from "vitest";
import { faqPlaceholderValues, renderFaq } from "@/lib/faq";

/**
 * SSS cevapları panelden gelir ve düz yer tutucular taşıyabilir: `{minutes}`,
 * `{open}`, `{close}`, `{price}`, `{duration}`. Paket yoksa fiyat ve süre
 * boş dizeyle doldurulur (soru pasife alınana kadar boşluk görünür).
 */
describe("faqPlaceholderValues", () => {
  it("paket varken fiyat ve süreyi taşır", () => {
    expect(faqPlaceholderValues({ minutes: 120, open: "11:00", close: "22:30", package: { price: "700,00 ₺", duration: 45 } })).toEqual({
      minutes: 120, open: "11:00", close: "22:30", price: "700,00 ₺", duration: 45,
    });
  });
  it("paket yoksa fiyat ve süre boş dize", () => {
    expect(faqPlaceholderValues({ minutes: 120, open: "11:00", close: "22:30", package: null })).toMatchObject({ price: "", duration: "" });
  });
  it("çalışma saati yoksa açılış ve kapanış boş dize", () => {
    expect(faqPlaceholderValues({ minutes: 60, open: null, close: null, package: null })).toMatchObject({ open: "", close: "" });
  });
});

describe("renderFaq", () => {
  it("her cevaptaki yer tutucuları doldurur, soruya dokunmaz", () => {
    const items = [{ id: "1", question: "Ne kadar {price}?", answer: "{duration} dakika, {price}." }];
    expect(renderFaq(items, { minutes: 120, open: "11:00", close: "22:30", price: "700 ₺", duration: 45 })).toEqual([
      { id: "1", question: "Ne kadar {price}?", answer: "45 dakika, 700 ₺." },
    ]);
  });
});
