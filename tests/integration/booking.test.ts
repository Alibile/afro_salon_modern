import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import { asActor, createBarber, createCustomer, createService } from "./helpers";
import { getActiveServices, getAvailability, getDaySummaries } from "@/lib/queries/booking";
import * as bookingQueries from "@/lib/queries/booking";
import { createAppointmentFor } from "@/actions/impl/appointments";
import { shopDayStart } from "@/lib/time";
import { parseBookableDate } from "@/lib/booking-window";

// Perşembe 2026-09-17 10:00 Istanbul = 07:00Z
const NOW = new Date("2026-09-17T07:00:00Z");
const SUNDAY_NOW = new Date("2026-09-20T07:00:00Z");
/** Yarın (Cuma 18 Eylül) 09:00 İstanbul. */
const TOMORROW_0900 = "2026-09-18T06:00:00.000Z";

const today = (now: Date = NOW) => shopDayStart(now);
const day = (dateKey: string) => parseBookableDate(dateKey, NOW)!;

describe("getAvailability", () => {
  it("lists slots after now+lead within working hours", async () => {
    const { barber } = await createBarber();
    const r = await getAvailability(barber.id, 30, today(), NOW);
    expect(r.isOpen).toBe(true);
    // 10:00 + 15dk lead = 10:15 → ilk slot 10:15 (15dk adım)
    expect(r.slots[0].toISOString()).toBe("2026-09-17T07:15:00.000Z");
    // son slot 18:30 (19:00 kapanış, 30dk hizmet)
    expect(r.slots.at(-1)!.toISOString()).toBe("2026-09-17T15:30:00.000Z");
  });

  it("is closed on Sunday", async () => {
    const { barber } = await createBarber();
    const r = await getAvailability(barber.id, 30, today(SUNDAY_NOW), SUNDAY_NOW);
    expect(r.isOpen).toBe(false);
    expect(r.slots).toEqual([]);
    expect(r.opensAt).toBe("09:00"); // yarın (Pazartesi) açılış
  });

  it("excludes existing appointments and time off", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") },
    });
    await prisma.timeOff.create({
      data: { barberId: barber.id, startsAt: new Date("2026-09-17T09:00:00Z"), endsAt: new Date("2026-09-17T10:00:00Z") },
    });
    const r = await getAvailability(barber.id, 30, today(), NOW);
    const iso = r.slots.map((d: Date) => d.toISOString());
    expect(iso).not.toContain("2026-09-17T08:00:00.000Z");
    expect(iso).not.toContain("2026-09-17T07:45:00.000Z"); // 07:45-08:15 çakışır
    expect(iso).not.toContain("2026-09-17T09:30:00.000Z");
    expect(iso).toContain("2026-09-17T08:30:00.000Z");
    expect(iso).toContain("2026-09-17T10:00:00.000Z");
  });

  /**
   * "En erken randevu" payı (`minLeadMinutes`) ancak bugün için anlamlı: yarının
   * açılış saatini bugünden almanın önünde bir engel yok. İleri günlerde
   * çalışma aralığı baştan sona açıktır.
   */
  it("ileri günlerde lead filtresi uygulanmaz", async () => {
    const { barber } = await createBarber();
    const r = await getAvailability(barber.id, 30, day("2026-09-18"), NOW);
    expect(r.isOpen).toBe(true);
    expect(r.slots[0].toISOString()).toBe(TOMORROW_0900); // 09:00, açılışın ta kendisi
    expect(r.slots.at(-1)!.toISOString()).toBe("2026-09-18T15:30:00.000Z");
  });

  it("ileri günün randevusu o günün ızgarasından düşer", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date(TOMORROW_0900), endsAt: new Date("2026-09-18T06:30:00.000Z") },
    });
    const iso = (await getAvailability(barber.id, 30, day("2026-09-18"), NOW)).slots.map((d: Date) => d.toISOString());
    expect(iso).not.toContain(TOMORROW_0900);
    expect(iso).toContain("2026-09-18T06:30:00.000Z");
    // Bugünün ızgarası ileri günün doluluğundan etkilenmez.
    expect((await getAvailability(barber.id, 30, today(), NOW)).slots.length).toBeGreaterThan(0);
  });
});

describe("getDaySummaries", () => {
  it("pencerenin altı gününü verir, Pazar hiç geçmez", async () => {
    const { barber } = await createBarber();
    const summaries = await getDaySummaries(barber.id, 30, NOW);
    expect(summaries.map((s) => s.dateKey)).toEqual([
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
    ]);
    expect(summaries.every((s) => s.open)).toBe(true);
    // Bugün lead yüzünden birkaç saat eksik; ileri günler tam ızgara.
    expect(summaries[0].slotCount).toBeLessThan(summaries[1].slotCount);
  });

  it("tam gün izinli günü kapalı, dolan günü açık ama sıfır sayar", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.timeOff.create({
      data: { barberId: barber.id, startsAt: new Date("2026-09-17T21:00:00Z"), endsAt: new Date("2026-09-18T21:00:00Z") },
    });
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-18T21:00:00Z"), endsAt: new Date("2026-09-19T21:00:00Z") },
    });
    const byKey = Object.fromEntries((await getDaySummaries(barber.id, 30, NOW)).map((s) => [s.dateKey, s]));
    expect(byKey["2026-09-18"]).toEqual({ dateKey: "2026-09-18", open: false, slotCount: 0 });
    expect(byKey["2026-09-19"]).toEqual({ dateKey: "2026-09-19", open: true, slotCount: 0 });
    expect(byKey["2026-09-21"].slotCount).toBeGreaterThan(0);
  });
});

describe("getActiveServices", () => {
  it("hizmet adını ziyaretçinin dilinde verir, çeviri yoksa Türkçesini", async () => {
    await createService({ name: { tr: "Saç Kesimi", en: "Haircut", fr: "Coupe de cheveux" }, sortOrder: 1 });
    await createService({ name: { tr: "Örgü / Twist" }, sortOrder: 2 });

    expect((await getActiveServices("tr")).map((s) => s.name)).toEqual(["Saç Kesimi", "Örgü / Twist"]);
    // İkinci hizmetin İngilizcesi girilmemiş: Türkçesi görünür.
    expect((await getActiveServices("en")).map((s) => s.name)).toEqual(["Haircut", "Örgü / Twist"]);
    expect((await getActiveServices("fr")).map((s) => s.name)).toEqual(["Coupe de cheveux", "Örgü / Twist"]);
  });

  it("aynı sıradaki hizmetleri o dilin alfabetik sırasına göre ayırır", async () => {
    await createService({ name: { tr: "Sakal", en: "Beard trim" }, sortOrder: 0 });
    await createService({ name: { tr: "Saç", en: "Haircut" }, sortOrder: 0 });

    // Sıralama dilin kendi alfabesiyle: Türkçede "ç" < "k", İngilizcede B < H.
    expect((await getActiveServices("tr")).map((s) => s.name)).toEqual(["Saç", "Sakal"]);
    expect((await getActiveServices("en")).map((s) => s.name)).toEqual(["Beard trim", "Haircut"]);
  });

  it("pasif hizmeti hiç döndürmez", async () => {
    await createService({ name: "Saç Kesimi" });
    await prisma.service.create({ data: { nameI18n: { tr: "Eski" }, durationMinutes: 30, priceKurus: 100, isActive: false } });
    expect((await getActiveServices("tr")).map((s) => s.name)).toEqual(["Saç Kesimi"]);
  });
});

describe("createAppointment", () => {
  it("creates appointment with service snapshots", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService({ name: "Saç", durationMinutes: 30, priceKurus: 40000 });
    const s2 = await createService({ name: "Sakal", durationMinutes: 15, priceKurus: 20000 });

    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id, s2.id], startsAt: "2026-09-17T08:00:00.000Z" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUnique({ where: { id: r.data.id }, include: { services: true } });
    expect(appt?.endsAt.toISOString()).toBe("2026-09-17T08:45:00.000Z");
    expect(appt?.services.map((s) => s.priceSnapshot).sort()).toEqual([20000, 40000]);
    expect(appt?.services.find((s) => s.serviceId === s1.id)?.nameSnapshot).toBe("Saç");
  });

  it("hizmet adı anlık görüntüsünü müşterinin dilinde yazar", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer({ locale: "en" });
    const s1 = await createService({ name: { tr: "Saç Kesimi", en: "Haircut" }, durationMinutes: 30 });
    // Fransızcası girilmemiş hizmet: Fransızca müşteri de Türkçesini görür.
    const s2 = await createService({ name: { tr: "Sakal" }, durationMinutes: 15 });

    const r = await createAppointmentFor(asActor(customer), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id, s2.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id }, include: { services: true } });
    expect(appt.services.find((s) => s.serviceId === s1.id)?.nameSnapshot).toBe("Haircut");
    expect(appt.services.find((s) => s.serviceId === s2.id)?.nameSnapshot).toBe("Sakal");
  });

  it("Türkçe müşteride anlık görüntü Türkçe kalır", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService({ name: { tr: "Saç Kesimi", en: "Haircut" }, durationMinutes: 30 });

    const r = await createAppointmentFor(asActor(customer), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id }, include: { services: true } });
    expect(appt.services[0].nameSnapshot).toBe("Saç Kesimi");
  });

  /**
   * Müşteri yüzünde dili **istek** belirler: müşterinin panel gibi bir dil
   * ayarı yoktur, tek sinyali randevuyu hangi dildeki sayfadan aldığıdır.
   */
  it("anlık görüntüyü isteğin diliyle yazar, aktörün kayıtlı diliyle değil", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer({ locale: "tr" });
    const s1 = await createService({ name: { tr: "Saç Kesimi", en: "Haircut", fr: "Coupe de cheveux" }, durationMinutes: 30 });

    const r = await createAppointmentFor(asActor(customer), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    }, "fr");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id }, include: { services: true } });
    expect(appt.services[0].nameSnapshot).toBe("Coupe de cheveux");
  });

  it("müşterinin User.locale'ini isteğin diline günceller", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer({ locale: "tr" });
    const s1 = await createService();

    const r = await createAppointmentFor(asActor(customer), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    }, "fr");
    expect(r.ok).toBe(true);
    // Onay e-postası alıcının kayıtlı tercihiyle gider; tercih güncellenmezse
    // Fransızca sayfadan alınan randevu Türkçe e-posta üretirdi.
    expect((await prisma.user.findUniqueOrThrow({ where: { id: customer.id } })).locale).toBe("fr");
  });

  // Personelin dili panelden yaptığı açık tercihtir: randevu sayfasının dili
  // onu değiştirmez.
  it("personelin kayıtlı dilini değiştirmez", async () => {
    const { barber } = await createBarber();
    const staff = await createBarber({ locale: "tr" });
    const s1 = await createService({ name: { tr: "Saç Kesimi", en: "Haircut" }, durationMinutes: 30 });

    const r = await createAppointmentFor(asActor(staff.user, { barberId: staff.barber.id }), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    }, "en");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Anlık görüntü yine isteğin dilinde: bu satır randevunun kendisine aittir.
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id }, include: { services: true } });
    expect(appt.services[0].nameSnapshot).toBe("Haircut");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: staff.user.id } })).locale).toBe("tr");
  });

  it("tanınmayan dil kodu aktörün kayıtlı diline düşer", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer({ locale: "en" });
    const s1 = await createService({ name: { tr: "Saç Kesimi", en: "Haircut" }, durationMinutes: 30 });

    const r = await createAppointmentFor(asActor(customer), NOW, {
      barberId: barber.id,
      serviceIds: [s1.id],
      startsAt: "2026-09-17T08:00:00.000Z",
    }, "de");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id }, include: { services: true } });
    expect(appt.services[0].nameSnapshot).toBe("Haircut");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: customer.id } })).locale).toBe("en");
  });

  it("rejects slot in the past / before lead time", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T07:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "errors.slotUnavailable" });
  });

  it("rejects conflicting slot (second booking of same time)", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const input = { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" };
    const first = await createAppointmentFor(asActor(c1), NOW, input);
    expect(first.ok).toBe(true);
    const second = await createAppointmentFor(asActor(c2), NOW, input);
    expect(second.ok).toBe(false);
  });

  it("rejects when slot not aligned to step", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:07:00.000Z" });
    expect(r.ok).toBe(false);
  });

  it("under a real race only one of two concurrent bookings wins", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const input = { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" };
    const [a, b] = await Promise.all([
      createAppointmentFor(asActor(c1), NOW, input),
      createAppointmentFor(asActor(c2), NOW, input),
    ]);
    const results = [a, b];
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const loser = results.find((r) => !r.ok);
    expect(loser && !loser.ok && loser.error).toMatch(/^errors\.(slotTaken|slotUnavailable)$/);
    const scheduled = await prisma.appointment.count({ where: { barberId: barber.id, status: "SCHEDULED" } });
    expect(scheduled).toBe(1);
  });

  it("rejects with SLOT_TAKEN when the constraint fires after the pre-check passes", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const startsAt = new Date("2026-09-17T08:00:00.000Z");

    const spy = vi.spyOn(bookingQueries, "getAvailability").mockResolvedValueOnce({
      slots: [startsAt],
      isOpen: true,
      opensAt: "09:00",
    });

    // Occupy the slot directly, bypassing the pre-check, to force the DB
    // exclusion constraint to reject the second createAppointment call.
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: c1.id, startsAt, endsAt: new Date("2026-09-17T08:30:00.000Z") },
    });

    const r = await createAppointmentFor(asActor(c2), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: startsAt.toISOString() });

    spy.mockRestore();
    expect(r).toEqual({ ok: false, error: "errors.slotTaken" });
  });

  /**
   * Pencere sunucuda yeniden kurulur: sihirbaz Pazarı ve sekizinci günü hiç
   * göstermez, ama gövdeye elle yazılan bir tarih de buradan geçmek zorunda.
   */
  it("yarın için randevu alınabilir", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: TOMORROW_0900 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: r.data.id } });
    expect(appt.startsAt.toISOString()).toBe(TOMORROW_0900);
  });

  it("pencerenin sekizinci gününü reddeder", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    // 24 Eylül Perşembe: bugünden (17 Eylül) tam sekiz gün sonrası.
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-24T06:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "errors.dateOutOfRange" });
  });

  it("Pazar gününü reddeder", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-20T06:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "errors.dateOutOfRange" });
  });

  it("geçmiş günü reddeder", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-16T06:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "errors.dateOutOfRange" });
  });

  it("ileri gündeki çakışmayı da yakalar", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const input = { barberId: barber.id, serviceIds: [s1.id], startsAt: TOMORROW_0900 };
    expect((await createAppointmentFor(asActor(c1), NOW, input)).ok).toBe(true);
    const second = await createAppointmentFor(asActor(c2), NOW, input);
    expect(second.ok).toBe(false);
    expect(!second.ok && second.error).toMatch(/^errors\.(slotTaken|slotUnavailable)$/);
  });

  it("rejects inactive service", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await prisma.service.create({ data: { nameI18n: { tr: "Eski" }, durationMinutes: 30, priceKurus: 100, isActive: false } });
    const r = await createAppointmentFor(asActor(customer), NOW, { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "errors.selectedServiceNotFound" });
  });
});
