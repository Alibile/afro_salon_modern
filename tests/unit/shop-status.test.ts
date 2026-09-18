import { describe, it, expect } from "vitest";
import { getShopStatus, shopStatusText } from "@/lib/shop-status";
import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

// 2026-09-17 Perşembe. 07:00Z = 10:00 İstanbul
const rows = [
  { dayOfWeek: 4, isOff: false, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 4, isOff: false, startTime: "10:00", endTime: "20:00" }, // ikinci berber
  { dayOfWeek: 0, isOff: true, startTime: "09:00", endTime: "19:00" },
];

/** Mesaj dosyasını yerinde okuyan küçük bir çevirmen: ICU yerine düz değişim yeter. */
function translator(messages: typeof tr) {
  return (key: "open" | "closedToday" | "closedNow", values?: Record<string, string>) =>
    Object.entries(values ?? {}).reduce((text, [k, v]) => text.replace(`{${k}}`, v), messages.common.status[key]);
}

describe("getShopStatus", () => {
  it("open today: earliest open, latest close", () => {
    const s = getShopStatus(rows, new Date("2026-09-17T07:00:00Z"));
    expect(s).toEqual({ isOpenToday: true, opensAt: "09:00", closesAt: "20:00", state: "open" });
  });
  it("closed day (Sunday)", () => {
    const s = getShopStatus(rows, new Date("2026-09-20T07:00:00Z"));
    expect(s.isOpenToday).toBe(false);
    expect(s.state).toBe("closedToday");
  });
  it("after closing time", () => {
    const s = getShopStatus(rows, new Date("2026-09-17T17:30:00Z")); // 20:30 İstanbul
    expect(s.state).toBe("closedNow");
  });
  it("no rows → closed", () => {
    expect(getShopStatus([], new Date("2026-09-17T07:00:00Z")).state).toBe("closedToday");
  });
});

describe("shopStatusText", () => {
  const open = getShopStatus(rows, new Date("2026-09-17T07:00:00Z"));
  const closed = getShopStatus(rows, new Date("2026-09-20T07:00:00Z"));
  const closedNow = getShopStatus(rows, new Date("2026-09-17T17:30:00Z"));

  it("Türkçe metin Tur 4'teki cümlenin aynısı kalır", () => {
    expect(shopStatusText(translator(tr), open)).toBe("Bugün açık · 09:00–20:00");
    expect(shopStatusText(translator(tr), closed)).toBe("Bugün kapalıyız");
    expect(shopStatusText(translator(tr), closedNow)).toBe("Bugün kapandık");
  });

  it("İngilizce ve Fransızca aynı veriyi kendi cümlesiyle yazar", () => {
    expect(shopStatusText(translator(en), open)).toBe("Open today · 09:00–20:00");
    expect(shopStatusText(translator(en), closed)).toBe("Closed today");
    expect(shopStatusText(translator(fr), open)).toBe("Ouvert aujourd'hui · 09:00–20:00");
    expect(shopStatusText(translator(fr), closedNow)).toBe("Fermé pour la journée");
  });
});
