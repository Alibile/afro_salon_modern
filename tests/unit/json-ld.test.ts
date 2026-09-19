import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("metnin içindeki </script> etiketi kapatamaz", () => {
    const out = serializeJsonLd({ text: "Ödeme salonda </script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("</");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    // Kaçırılmış hâl geri açıldığında veri birebir aynı.
    expect(JSON.parse(out)).toEqual({ text: "Ödeme salonda </script><img src=x onerror=alert(1)>" });
  });

  it("& ve satır ayıracı karakterlerini de kaçırır", () => {
    const out = serializeJsonLd({ a: "Yıkama & Kesim", b: "bir\u2028iki\u2029üç" });
    expect(out).not.toContain("&");
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(JSON.parse(out)).toEqual({ a: "Yıkama & Kesim", b: "bir\u2028iki\u2029üç" });
  });

  it("sıradan veriyi olduğu gibi bırakır", () => {
    expect(serializeJsonLd({ "@type": "FAQPage", n: 6 })).toBe('{"@type":"FAQPage","n":6}');
  });
});
