import { describe, it, expect } from "vitest";
import { contactSchema } from "@/schemas/contact";

const valid = {
  name: "Ayşe Yılmaz",
  phone: "+90 555 000 00 00",
  message: "Cumartesi günü örgü için yer var mı acaba?",
  services: ["Örgü / Twist"],
  website: "",
};

describe("contactSchema", () => {
  it("geçerli girdiyi kabul eder ve boşlukları kırpar", () => {
    const r = contactSchema.safeParse({ ...valid, name: "  Ayşe Yılmaz  " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Ayşe Yılmaz");
      expect(r.data.services).toEqual(["Örgü / Twist"]);
    }
  });

  it("telefon opsiyoneldir", () => {
    const r = contactSchema.safeParse({ name: valid.name, message: valid.message, services: valid.services });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("");
    expect(contactSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });

  it("hizmet listesi opsiyoneldir ve varsayılanı boş dizidir", () => {
    const r = contactSchema.safeParse({ name: valid.name, message: valid.message });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.services).toEqual([]);
  });

  it("kısa ad reddedilir", () => {
    const r = contactSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.nameMin2");
  });

  it("uzun ad reddedilir", () => {
    const r = contactSchema.safeParse({ ...valid, name: "a".repeat(61) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.nameMax60");
  });

  it("uzun telefon reddedilir", () => {
    const r = contactSchema.safeParse({ ...valid, phone: "0".repeat(21) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.phoneMax20");
  });

  it("kısa mesaj reddedilir", () => {
    const r = contactSchema.safeParse({ ...valid, message: "Merhaba" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.messageMin10");
  });

  it("uzun mesaj reddedilir", () => {
    const r = contactSchema.safeParse({ ...valid, message: "a".repeat(1001) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.messageMax1000");
  });

  it("1000 karakterlik mesaj sınırda kabul edilir", () => {
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(1000) }).success).toBe(true);
  });

  it("honeypot alanı şemada vardır ve doluyken de geçerlidir (sessizce yutulur)", () => {
    const r = contactSchema.safeParse({ ...valid, website: "http://spam.example" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.website).toBe("http://spam.example");
  });
});
