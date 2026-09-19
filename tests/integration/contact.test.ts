import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/email/send", () => ({ sendContactMessage: vi.fn(async () => {}) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "tr") }));

import { sendContactMessage as deliverContactMessage } from "@/lib/email/send";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { createService } from "./helpers";
import { sendContactMessageAs } from "@/actions/impl/contact";
import { sendContactMessage } from "@/actions/contact";
import { resetRateLimit } from "@/lib/rate-limit";

const mailer = vi.mocked(deliverContactMessage);
const mockedHeaders = vi.mocked(headers);
const mockedLocale = vi.mocked(getLocale);

const input = {
  name: "Ayşe Yılmaz",
  phone: "+90 555 000 00 00",
  message: "Cumartesi günü örgü için yer var mı acaba?",
  services: ["Örgü / Twist"],
  website: "",
};

beforeEach(() => {
  resetRateLimit();
  mailer.mockClear();
  mockedHeaders.mockReset();
  mockedHeaders.mockResolvedValue(new Headers());
  mockedLocale.mockReset();
  mockedLocale.mockResolvedValue("tr");
});

describe("sendContactMessageAs", () => {
  it("geçerli mesajı kabul eder ve e-posta gönderir", async () => {
    const r = await sendContactMessageAs(input, "1.2.3.4");
    expect(r).toEqual({ ok: true, data: undefined });
    expect(mailer).toHaveBeenCalledTimes(1);
    expect(mailer).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ayşe Yılmaz", phone: "+90 555 000 00 00", message: input.message, services: ["Örgü / Twist"], visitorLocale: "tr" }),
    );
  });

  /**
   * E-posta salona gider ve Türkçedir; ziyaretçi hizmeti kendi dilinde
   * seçmiş olsa da salon kendi listesindeki adı okumalı. Ziyaretçinin dili
   * ayrı bir alan olarak taşınır.
   */
  it("hizmet adlarını salonun diline çevirir ve ziyaretçinin dilini taşır", async () => {
    await createService({ name: { tr: "Saç Kesimi", en: "Haircut", fr: "Coupe de cheveux" } });
    const r = await sendContactMessageAs({ ...input, services: ["Coupe de cheveux"] }, "4.4.4.4", "fr");
    expect(r.ok).toBe(true);
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ services: ["Saç Kesimi"], visitorLocale: "fr" }));
  });

  it("listede olmayan hizmet adını olduğu gibi bırakır", async () => {
    await sendContactMessageAs({ ...input, services: ["Service inconnu"] }, "4.4.4.5", "fr");
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ services: ["Service inconnu"] }));
  });

  it("tanınmayan dil kodu salonun diline düşer", async () => {
    await sendContactMessageAs(input, "4.4.4.6", "de");
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ visitorLocale: "tr" }));
  });

  it("geçersiz girdide şema mesajını döner ve e-posta göndermez", async () => {
    const r = await sendContactMessageAs({ ...input, message: "kısa" }, "1.2.3.4");
    expect(r).toEqual({ ok: false, error: "errors.messageMin10" });
    expect(mailer).not.toHaveBeenCalled();
  });

  it("honeypot doluysa sessizce başarı döner, e-posta göndermez", async () => {
    const r = await sendContactMessageAs({ ...input, website: "http://spam.example" }, "1.2.3.4");
    expect(r).toEqual({ ok: true, data: undefined });
    expect(mailer).not.toHaveBeenCalled();
  });

  it("aynı IP'den dakikada 3 mesaja izin verir, 4.'yü reddeder", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await sendContactMessageAs(input, "9.9.9.9")).ok).toBe(true);
    }
    const r = await sendContactMessageAs(input, "9.9.9.9");
    expect(r).toEqual({ ok: false, error: "errors.tooManyRequests" });
    expect(mailer).toHaveBeenCalledTimes(3);
  });

  it("limit IP başınadır", async () => {
    for (let i = 0; i < 3; i++) await sendContactMessageAs(input, "9.9.9.9");
    expect((await sendContactMessageAs(input, "8.8.8.8")).ok).toBe(true);
  });

  it("e-posta gönderimi hata verse bile kullanıcıya başarı döner", async () => {
    mailer.mockRejectedValueOnce(new Error("resend down"));
    const r = await sendContactMessageAs(input, "7.7.7.7");
    expect(r).toEqual({ ok: true, data: undefined });
  });

  it("farklı IP'lerden gelse bile saatte 60 mesajdan sonrasını reddeder", async () => {
    for (let i = 0; i < 60; i++) {
      expect((await sendContactMessageAs(input, `10.0.0.${i}`)).ok).toBe(true);
    }
    const r = await sendContactMessageAs(input, "10.0.1.1");
    expect(r).toEqual({ ok: false, error: "errors.tooManyRequests" });
    expect(mailer).toHaveBeenCalledTimes(60);
  });

  it("genel tavan reddedilen istekleri saymaz", async () => {
    // Aynı IP'den 4 deneme: 3'ü geçer, 4.'sü IP sınırına takılır ve genel
    // sayaca yazılmaz; ardından 57 ayrı IP daha kabul edilir (toplam 60).
    for (let i = 0; i < 4; i++) await sendContactMessageAs(input, "9.9.9.9");
    for (let i = 0; i < 57; i++) {
      expect((await sendContactMessageAs(input, `10.1.0.${i}`)).ok).toBe(true);
    }
    expect(await sendContactMessageAs(input, "10.1.1.1")).toEqual({ ok: false, error: "errors.tooManyRequests" });
  });
});

describe("sendContactMessage wrapper", () => {
  it("oturum gerektirmez; anonim çağrı kabul edilir", async () => {
    const r = await sendContactMessage(input);
    expect(r).toEqual({ ok: true, data: undefined });
  });

  // Dil gövdeden değil istekten okunur: wrapper `getLocale()` çağırır.
  it("ziyaretçinin dilini istekten alır", async () => {
    mockedLocale.mockResolvedValue("fr");
    await sendContactMessage(input);
    expect(mailer).toHaveBeenCalledWith(expect.objectContaining({ visitorLocale: "fr" }));
    expect(mockedLocale).toHaveBeenCalled();
  });

  it("IP'yi x-forwarded-for zincirinin SON hop'undan alır", async () => {
    mockedHeaders.mockResolvedValue(new Headers({ "x-forwarded-for": "5.5.5.5, 10.0.0.1" }));
    for (let i = 0; i < 3; i++) expect((await sendContactMessage(input)).ok).toBe(true);
    expect(await sendContactMessage(input)).toEqual({ ok: false, error: "errors.tooManyRequests" });
    // Dolan anahtar istemcinin yazabildiği ilk hop değil, son hop'tur.
    expect(await sendContactMessageAs(input, "10.0.0.1")).toEqual({ ok: false, error: "errors.tooManyRequests" });
    expect((await sendContactMessageAs(input, "5.5.5.5")).ok).toBe(true);
    // Başka bir IP aynı limite takılmaz.
    mockedHeaders.mockResolvedValue(new Headers({ "x-forwarded-for": "6.6.6.6" }));
    expect((await sendContactMessage(input)).ok).toBe(true);
  });

  it("x-vercel-forwarded-for diğer başlıklara göre önceliklidir", async () => {
    mockedHeaders.mockResolvedValue(
      new Headers({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }),
    );
    for (let i = 0; i < 3; i++) expect((await sendContactMessage(input)).ok).toBe(true);
    expect(await sendContactMessageAs(input, "1.1.1.1")).toEqual({ ok: false, error: "errors.tooManyRequests" });
    expect((await sendContactMessageAs(input, "2.2.2.2")).ok).toBe(true);
  });

  it("vercel başlığı yoksa x-real-ip kullanılır", async () => {
    mockedHeaders.mockResolvedValue(new Headers({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }));
    for (let i = 0; i < 3; i++) expect((await sendContactMessage(input)).ok).toBe(true);
    expect(await sendContactMessageAs(input, "2.2.2.2")).toEqual({ ok: false, error: "errors.tooManyRequests" });
  });

  it("başlık yoksa 'local' anahtarına düşer", async () => {
    mockedHeaders.mockResolvedValue(new Headers());
    for (let i = 0; i < 3; i++) expect((await sendContactMessage(input)).ok).toBe(true);
    expect(await sendContactMessage(input)).toEqual({ ok: false, error: "errors.tooManyRequests" });
    // Aynı anahtar impl üzerinden de doludur.
    expect(await sendContactMessageAs(input, "local")).toEqual({ ok: false, error: "errors.tooManyRequests" });
  });
});
