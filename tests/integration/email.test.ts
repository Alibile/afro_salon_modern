import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * E-postanın dili alıcının kayıtlı tercihinden gelir. Burada Resend istemcisi
 * sahte: gerçekten gönderim yapılmaz, yalnızca `send.ts`'in ürettiği konu ve
 * gövde yakalanır. `RESEND_API_KEY` verilmezse `deliver` hiç çağrılmaz, o
 * yüzden testte tanımlanıyor.
 */
const sent: { to: string; subject: string; html: string }[] = [];
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (payload: { to: string; subject: string; html: string }) => {
        sent.push(payload);
      },
    };
  },
}));

import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { sendAppointmentConfirmed, sendAppointmentCancelled, sendNewAppointmentToBarber, sendContactMessage } from "@/lib/email/send";

async function appointment(customerId: string, barberId: string) {
  const a = await prisma.appointment.create({
    data: {
      customerId,
      barberId,
      startsAt: new Date("2026-09-17T11:30:00Z"),
      endsAt: new Date("2026-09-17T12:00:00Z"),
    },
  });
  const service = await createService();
  await prisma.appointmentService.create({
    data: { appointmentId: a.id, serviceId: service.id, nameSnapshot: "Saç Kesimi", durationSnapshot: 30, priceSnapshot: 30000 },
  });
  return a;
}

beforeEach(() => {
  sent.length = 0;
  vi.stubEnv("RESEND_API_KEY", "test-key");
});

describe("sendAppointmentConfirmed", () => {
  it("müşterinin kayıtlı diline göre yazar", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer({ locale: "en" });
    await sendAppointmentConfirmed((await appointment(c.id, barber.id)).id);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(c.email);
    expect(sent[0].subject).toContain("Your appointment is confirmed");
    expect(sent[0].html).toContain("Your appointment is confirmed");
  });

  it("Fransızca tercihte Fransızca gider", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer({ locale: "fr" });
    await sendAppointmentConfirmed((await appointment(c.id, barber.id)).id);
    expect(sent[0].subject).toContain("Votre rendez-vous est confirmé");
  });

  /**
   * Çevrilmiş bir gövdenin içindeki bağlantı çevrilmemiş bir adrese çıkarsa
   * ziyaretçi Fransızca e-postadan Türkçe sayfaya düşer. Bağlantı alıcının
   * diline önekli gider; Türkçe öneksiz kalır.
   */
  it("bağlantı alıcının diline önekli gider", async () => {
    const { barber } = await createBarber();
    const fr = await createCustomer({ locale: "fr" });
    await sendAppointmentConfirmed((await appointment(fr.id, barber.id)).id);
    expect(sent[0].html).toContain("http://localhost:3100/fr/randevularim");

    sent.length = 0;
    // İkinci randevu başka bir berbere: aynı berberde aynı saat çakışma kuralına takılır.
    const other = await createBarber();
    const tr = await createCustomer();
    await sendAppointmentConfirmed((await appointment(tr.id, other.barber.id)).id);
    expect(sent[0].html).toContain("http://localhost:3100/randevularim");
    expect(sent[0].html).not.toContain("/tr/randevularim");
  });

  it("tercih verilmemişse Türkçe kalır", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    await sendAppointmentConfirmed((await appointment(c.id, barber.id)).id);
    expect(sent[0].subject).toContain("Randevun onaylandı");
    // Konudaki saat dükkanın saat diliminde: 11:30Z = 14:30 İstanbul.
    expect(sent[0].subject).toContain("14:30");
  });

  it("tanınmayan bir dil kodu varsayılana düşer", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer({ locale: "de" });
    await sendAppointmentConfirmed((await appointment(c.id, barber.id)).id);
    expect(sent[0].subject).toContain("Randevun onaylandı");
  });
});

describe("sendAppointmentCancelled", () => {
  it("müşterinin diliyle ve iptali kimin yaptığıyla gider", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer({ locale: "en" });
    await sendAppointmentCancelled((await appointment(c.id, barber.id)).id, "STAFF");
    expect(sent[0].subject).toBe("Your appointment was cancelled");
    expect(sent[0].html).toContain("The salon cancelled your appointment");
    // "Yeni randevu al" düğmesi İngilizce ana sayfaya çıkar.
    expect(sent[0].html).toContain("http://localhost:3100/en");
  });
});

describe("sendNewAppointmentToBarber", () => {
  it("berberin dilini kullanır, müşterininkini değil", async () => {
    const { user, barber } = await createBarber({ locale: "fr" });
    const c = await createCustomer({ locale: "en" });
    await sendNewAppointmentToBarber((await appointment(c.id, barber.id)).id);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(user.email);
    expect(sent[0].subject).toContain("Nouveau rendez-vous");
    // Panel bağlantısı da berberin dilinde.
    expect(sent[0].html).toContain("http://localhost:3100/fr/panel");
  });
});

describe("sendContactMessage", () => {
  it("salona her zaman Türkçe gider", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { email: "salon@test.local" } });
    await sendContactMessage({ name: "Ayşe Yılmaz", phone: "+90 555", message: "Merhaba", services: ["Fade"], visitorLocale: "tr" });
    expect(sent[0].to).toBe("salon@test.local");
    expect(sent[0].subject).toBe("Siteden yeni mesaj · Ayşe Yılmaz");
    expect(sent[0].html).toContain("İlgilendiği hizmetler:");
  });

  it("ziyaretçinin dilini tek satırda salonun dilinde yazar", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { email: "salon@test.local" } });
    await sendContactMessage({ name: "Amélie", phone: "", message: "Bonjour", services: [], visitorLocale: "fr" });
    expect(sent[0].subject).toBe("Siteden yeni mesaj · Amélie");
    expect(sent[0].html).toContain("Ziyaretçinin dili: Fransızca");
  });
});
