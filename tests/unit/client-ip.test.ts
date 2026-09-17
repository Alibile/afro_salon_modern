import { describe, it, expect } from "vitest";
import { clientIp } from "@/lib/client-ip";

describe("clientIp", () => {
  it("önce x-vercel-forwarded-for başlığına bakar", () => {
    const h = new Headers({
      "x-vercel-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
      "x-forwarded-for": "3.3.3.3",
    });
    expect(clientIp(h)).toBe("1.1.1.1");
  });

  it("vercel başlığı yoksa x-real-ip'e düşer", () => {
    const h = new Headers({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3, 4.4.4.4" });
    expect(clientIp(h)).toBe("2.2.2.2");
  });

  it("yalnızca x-forwarded-for varsa SON hop'u alır", () => {
    const h = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1, 10.0.0.2" });
    expect(clientIp(h)).toBe("10.0.0.2");
  });

  it("tek değerli x-forwarded-for aynen alınır", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "5.5.5.5" }))).toBe("5.5.5.5");
  });

  it("istemcinin uydurduğu ilk hop anahtar olmaz", () => {
    const spoofed = new Headers({ "x-forwarded-for": "sahte-ip, 10.0.0.1" });
    expect(clientIp(spoofed)).toBe("10.0.0.1");
  });

  it("boş ve boşluklu değerler atlanır", () => {
    expect(clientIp(new Headers({ "x-vercel-forwarded-for": "   ", "x-real-ip": "  2.2.2.2  " }))).toBe("2.2.2.2");
    expect(clientIp(new Headers({ "x-forwarded-for": "3.3.3.3, ,  " }))).toBe("3.3.3.3");
  });

  it("hiçbir başlık yoksa 'local' döner", () => {
    expect(clientIp(new Headers())).toBe("local");
    expect(clientIp(new Headers({ "x-forwarded-for": "" }))).toBe("local");
  });
});
