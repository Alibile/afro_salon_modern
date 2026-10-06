import { describe, it, expect } from "vitest";
import { shortName } from "@/components/brand/BrandLogo";

/**
 * Telefon çubuğunda uzun salon adı ilk iki kelimeye iner; iki ya da daha az
 * kelimelik adlar olduğu gibi kalır.
 */
describe("shortName", () => {
  it("üç ve daha çok kelimeyi ilk ikiye indirir", () => {
    expect(shortName("Afro Salon Modern")).toBe("Afro Salon");
    expect(shortName("Afro Salon Modern Kadıköy Şubesi")).toBe("Afro Salon");
  });
  it("kısa adlara dokunmaz, kenar boşluklarını kırpar", () => {
    expect(shortName("  Afro Salon ")).toBe("Afro Salon");
    expect(shortName("Berber")).toBe("Berber");
  });
});
