import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SessionUser } from "@/lib/auth-helpers";

// Wrapper'lar kimliği yalnızca oturumdan almalı: burada oturum sahte,
// çağrılara hiçbir aktör/zaman parametresi geçilmiyor.
vi.mock("@/lib/auth-helpers", () => ({ getSessionUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/storage", () => ({ deleteObject: vi.fn(async () => {}), createPresignedUpload: vi.fn() }));
vi.mock("@/lib/email/send", () => ({
  sendAppointmentConfirmed: vi.fn(async () => {}),
  sendAppointmentCancelled: vi.fn(async () => {}),
  sendNewAppointmentToBarber: vi.fn(async () => {}),
  sendContactMessage: vi.fn(async () => {}),
}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { getSessionUser } from "@/lib/auth-helpers";
import { createAppointment, cancelAppointmentByCustomer } from "@/actions/appointments";
import { createBarber, updateBarber, saveWorkingHours, resetBarberPassword, deleteBarber } from "@/actions/barbers";
import { upsertService, toggleService, deleteService } from "@/actions/services";
import { updateSettings } from "@/actions/settings";
import { upsertTestimonial, toggleTestimonial, deleteTestimonial } from "@/actions/testimonials";
import { addGalleryPhotos, updateGalleryPhoto, moveGalleryPhoto, deleteGalleryPhoto } from "@/actions/gallery";
import { setAppointmentStatus } from "@/actions/staff-appointments";
import { createTimeOff, deleteTimeOff } from "@/actions/timeoff";
import { addHaircutPhoto, deleteHaircutPhoto } from "@/actions/photos";
import { updateOwnProfile, changeOwnPassword } from "@/actions/profile";
import { sendContactMessage } from "@/actions/contact";
import { resetRateLimit } from "@/lib/rate-limit";

const mockedSession = vi.mocked(getSessionUser);

const customer: SessionUser = { id: "c1", name: "Müşteri", email: "c@t", role: "CUSTOMER", barberId: null, locale: "tr" };

function setSession(user: SessionUser | null) {
  mockedSession.mockResolvedValue(user);
}

const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0, startTime: "09:00", endTime: "19:00" }));
const settingsInput = {
  shopName: "Afro Salon",
  address: "",
  phone: "",
  cancellationWindowMinutes: 120,
  minLeadMinutes: 15,
  slotStepMinutes: 15,
  notifyBarberOnBooking: true,
  email: "",
  instagram: "",
  facebook: "",
  whatsapp: "",
  mapsUrl: "",
  aboutTitle: "Benzersiz bir deneyim",
  aboutText: "",
  whyUs1Title: "",
  whyUs1Text: "",
  whyUs2Title: "",
  whyUs2Text: "",
  whyUs3Title: "",
  whyUs3Text: "",
  satisfactionPercent: 99,
  yearsExperience: 10,
};
const photoKey = "haircuts/00000000-0000-4000-8000-000000000001.jpg";
const galleryKey = "gallery/00000000-0000-4000-8000-000000000002.jpg";

/** Personel (BARBER/ADMIN) gerektiren her wrapper; hiçbiri aktör parametresi almaz. */
const staffWrappers: [string, () => Promise<{ ok: boolean; error?: string }>][] = [
  ["createBarber", () => createBarber({ name: "Yeni Berber", email: "yeni@t.co", password: "Sifre123!", photoKey: "barbers/x.jpg", bio: "" })],
  ["updateBarber", () => updateBarber("b1", { name: "Yeni Berber", bio: "", photoKey: "barbers/x.jpg", isActive: true })],
  ["saveWorkingHours", () => saveWorkingHours("b1", { days })],
  ["resetBarberPassword", () => resetBarberPassword("b1", "Sifre123!")],
  ["deleteBarber", () => deleteBarber("b1")],
  ["upsertService", () => upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 })],
  ["toggleService", () => toggleService("s1", false)],
  ["deleteService", () => deleteService("s1")],
  ["updateSettings", () => updateSettings(settingsInput)],
  ["upsertTestimonial", () => upsertTestimonial({ name: "Emre K.", text: "Harika bir deneyimdi, kesinlikle tavsiye ederim.", rating: 5, sortOrder: 1 })],
  ["toggleTestimonial", () => toggleTestimonial("t1", false)],
  ["deleteTestimonial", () => deleteTestimonial("t1")],
  ["addGalleryPhotos", () => addGalleryPhotos([{ storageKey: galleryKey, width: 1200, height: 1600 }])],
  ["updateGalleryPhoto", () => updateGalleryPhoto("g1", { caption: "Fade", tags: "Fade" })],
  ["moveGalleryPhoto", () => moveGalleryPhoto("g1", "up")],
  ["deleteGalleryPhoto", () => deleteGalleryPhoto("g1")],
  ["setAppointmentStatus", () => setAppointmentStatus("a1", "COMPLETED")],
  ["createTimeOff", () => createTimeOff({ barberId: "b1", date: "2026-09-17", allDay: true })],
  ["deleteTimeOff", () => deleteTimeOff("t1")],
  ["addHaircutPhoto", () => addHaircutPhoto({ customerId: "c1", storageKey: photoKey, barberId: "b1" })],
  ["deleteHaircutPhoto", () => deleteHaircutPhoto("p1")],
  ["updateOwnProfile", () => updateOwnProfile({ name: "Yeni İsim", phone: "" })],
  ["changeOwnPassword", () => changeOwnPassword({ currentPassword: "eski", newPassword: "YeniSifre123" })],
];

/** Müşteri oturumu gerektiren wrapper'lar. */
const customerWrappers: [string, string, () => Promise<{ ok: boolean; error?: string }>][] = [
  [
    "createAppointment",
    "Randevu almak için giriş yapmalısınız",
    () => createAppointment({ barberId: "b1", serviceIds: ["s1"], startsAt: "2026-09-17T08:00:00.000Z" }),
  ],
  ["cancelAppointmentByCustomer", "Giriş yapmalısınız", () => cancelAppointmentByCustomer("a1")],
];

/**
 * HERKESE AÇIK wrapper'lar: oturum beklemezler, anonim çağrıda yetki hatası
 * DÖNMEMELİDİRLER. Yeni bir public wrapper eklenirse buraya yazılır.
 */
const publicWrappers: [string, () => Promise<{ ok: boolean; error?: string }>][] = [
  [
    "sendContactMessage",
    () =>
      sendContactMessage({
        name: "Ayşe Yılmaz",
        phone: "+90 555 000 00 00",
        message: "Cumartesi günü örgü için yer var mı acaba?",
        services: ["Örgü / Twist"],
        website: "",
      }),
  ],
];

beforeEach(() => {
  mockedSession.mockReset();
  resetRateLimit();
});

describe("server action wrappers — oturumsuz çağrı", () => {
  it.each(staffWrappers)("%s oturumsuz reddedilir", async (_name, call) => {
    setSession(null);
    expect(await call()).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it.each(customerWrappers)("%s oturumsuz reddedilir", async (_name, error, call) => {
    setSession(null);
    expect(await call()).toEqual({ ok: false, error });
  });
});

describe("server action wrappers — CUSTOMER oturumu", () => {
  it.each(staffWrappers)("%s müşteri oturumuyla reddedilir", async (_name, call) => {
    setSession(customer);
    expect(await call()).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it.each(customerWrappers)("%s müşteri oturumunda yetki hatası vermez", async (_name, _error, call) => {
    setSession(customer);
    const r = await call();
    // Müşteri bu action'ları çağırabilir; hata artık yetki değil veri hatasıdır.
    expect(r.ok).toBe(false);
    expect(r.error).not.toBe("Yetkiniz yok");
    expect(r.error).not.toBe("Giriş yapmalısınız");
    expect(r.error).not.toBe("Randevu almak için giriş yapmalısınız");
  });

  it("createAppointment müşterinin kendi oturumunu kullanır, gövdeden kimlik almaz", async () => {
    setSession(customer);
    const r = await createAppointment({ barberId: "yok", serviceIds: ["s1"], startsAt: "2026-09-17T08:00:00.000Z" });
    expect(r).toEqual({ ok: false, error: "Berber bulunamadı" });
    expect(mockedSession).toHaveBeenCalled();
  });

  it("cancelAppointmentByCustomer başkasının randevusuna erişemez", async () => {
    setSession(customer);
    expect(await cancelAppointmentByCustomer("a1")).toEqual({ ok: false, error: "Randevu bulunamadı" });
  });
});

describe("server action wrappers — herkese açık (public)", () => {
  it.each(publicWrappers)("%s oturumsuz çağrıda yetki hatası vermez", async (_name, call) => {
    setSession(null);
    const r = await call();
    expect(r.error).not.toBe("Yetkiniz yok");
    expect(r.error).not.toBe("Giriş yapmalısınız");
    expect(r).toEqual({ ok: true, data: undefined });
  });

  it.each(publicWrappers)("%s oturum bilgisini hiç sormaz", async (_name, call) => {
    setSession(null);
    await call();
    expect(mockedSession).not.toHaveBeenCalled();
  });
});
