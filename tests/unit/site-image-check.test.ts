import { describe, it, expect } from "vitest";
import { checkSiteImageSize } from "@/schemas/site-image";

/** İstemci yüklemeden önce, sunucu kaydetmeden önce aynı kuralı uygular. */
describe("checkSiteImageSize", () => {
  it("hero: en az 1600 px ve 3:2'ye yakın oran", () => {
    expect(checkSiteImageSize("hero", 2400, 1600)).toBeNull();
    expect(checkSiteImageSize("hero", 800, 533)).toBe("errors.imageTooSmall");
    expect(checkSiteImageSize("hero", 2000, 2000)).toBe("errors.invalidAspectRatio");
  });
  it("telefon hero 4:5, hakkımızda serbest oran", () => {
    expect(checkSiteImageSize("heroMobile", 1200, 1500)).toBeNull();
    expect(checkSiteImageSize("heroMobile", 2400, 1600)).toBe("errors.invalidAspectRatio");
    expect(checkSiteImageSize("about", 1000, 1000)).toBeNull();
    expect(checkSiteImageSize("about", 1, 1)).toBe("errors.imageTooSmall");
  });
});
