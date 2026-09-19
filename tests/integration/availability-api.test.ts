import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/availability/route";
import { bookableDays } from "@/lib/booking-window";
import { createBarber } from "./helpers";

/**
 * Uç nokta gerçek "şimdi" ile çalışır (istemci saatine güvenmez), bu yüzden
 * beklenen günler de aynı kaynaktan — `bookableDays` — türetilir. Sabit bir
 * tarih yazmak testi koşulduğu güne bağımlı kılardı.
 */
const call = (query: string) => GET(new Request(`http://localhost/api/availability?${query}`));

describe("GET /api/availability", () => {
  it("eksik ya da bozuk parametrede 400 ve anahtar döner", async () => {
    const res = await call("duration=45");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "errors.invalidRequest" });
    expect((await call("barberId=x&duration=0")).status).toBe(400);
  });

  it("pencere dışı tarihi 400 + errors.dateOutOfRange ile reddeder", async () => {
    const { barber } = await createBarber();
    const res = await call(`barberId=${barber.id}&duration=45&date=2030-01-01`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "errors.dateOutOfRange" });
  });

  it("bozuk tarih biçimini de reddeder", async () => {
    const { barber } = await createBarber();
    expect((await call(`barberId=${barber.id}&duration=45&date=yarin`)).status).toBe(400);
  });

  it("pencere içindeki gün için saatleri döner", async () => {
    const { barber } = await createBarber();
    const day = bookableDays(new Date())[0];
    const res = await call(`barberId=${barber.id}&duration=45&date=${day.dateKey}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slots: string[]; isOpen: boolean; opensAt: string | null };
    expect(body.isOpen).toBe(true);
    expect(Array.isArray(body.slots)).toBe(true);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("summary=1 pencerenin günlerini özetler", async () => {
    const { barber } = await createBarber();
    const res = await call(`barberId=${barber.id}&duration=45&summary=1`);
    const body = (await res.json()) as { days: { dateKey: string; open: boolean; slotCount: number }[] };
    expect(body.days.map((d) => d.dateKey)).toEqual(bookableDays(new Date()).map((d) => d.dateKey));
    // Pazar hiç geçmez: pencere onu zaten atlar.
    expect(body.days).toHaveLength(6);
  });
});
