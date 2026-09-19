import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import { AppointmentConfirmed } from "@/lib/email/templates/AppointmentConfirmed";
import { AppointmentCancelled } from "@/lib/email/templates/AppointmentCancelled";
import { NewAppointmentForBarber } from "@/lib/email/templates/NewAppointmentForBarber";
import { ContactMessage } from "@/lib/email/templates/ContactMessage";
import { emailTranslator } from "@/lib/email/i18n";
import type { AppLocale } from "@/i18n/routing";

const LOCALES: AppLocale[] = ["tr", "en", "fr"];

const HEADINGS = {
  confirmed: { tr: "Randevun onaylandı", en: "Your appointment is confirmed", fr: "Votre rendez-vous est confirmé" },
  cancelled: { tr: "Randevun iptal edildi", en: "Your appointment was cancelled", fr: "Votre rendez-vous a été annulé" },
  barberNotice: { tr: "Yeni randevu", en: "New appointment", fr: "Nouveau rendez-vous" },
  contact: { tr: "Siteden yeni mesaj", en: "New message from the site", fr: "Nouveau message depuis le site" },
} as const;

function confirmed(locale: AppLocale) {
  return render(
    <AppointmentConfirmed
      locale={locale}
      shopName="Afro Salon"
      customerName="Ali"
      barberName="Kwame"
      dateText="17 Eylül 2026 Perşembe"
      timeText="14:30"
      services={["Saç", "Sakal"]}
      totalText="600,00 ₺"
      manageUrl="http://localhost:3000/randevularim"
    />,
  );
}

describe("AppointmentConfirmed", () => {
  // Türkçe gövde Tur 4'ten beri aynı; çeviri katmanı eklenirken bozulmamalı.
  it("Türkçe özeti aynen basar", async () => {
    const html = await confirmed("tr");
    expect(html).toContain("Randevun onaylandı");
    expect(html).toContain("Kwame");
    expect(html).toContain("14:30");
    expect(html).toContain("Saç, Sakal");
    expect(html).toContain("Toplam: 600,00 ₺");
  });

  it.each(LOCALES)("%s başlığını ve dil etiketini taşır", async (locale) => {
    const html = await confirmed(locale);
    expect(html).toContain(HEADINGS.confirmed[locale]);
    expect(html).toContain(`lang="${locale}"`);
    // Tarih/saat vurgusu `t.rich` üzerinden geliyor; etiket kaybolursa
    // kullanıcı düz bir cümle görür.
    expect(html).toContain("<strong>14:30</strong>");
  });
});

describe("AppointmentCancelled", () => {
  it.each(LOCALES)("%s başlığını taşır ve iptali kimin yaptığını yazar", async (locale) => {
    const html = await render(
      <AppointmentCancelled locale={locale} shopName="Afro Salon" customerName="Ali" dateText="17 Eylül 2026" timeText="14:30" by="CUSTOMER" bookUrl="http://localhost:3000" />,
    );
    const t = emailTranslator(locale, "cancelled");
    expect(html).toContain(HEADINGS.cancelled[locale]);
    expect(html).toContain(t("byCustomer"));
    expect(html).not.toContain(t("byStaff"));
  });

  it("salon iptal ettiğinde öbür cümleyi yazar", async () => {
    const html = await render(
      <AppointmentCancelled locale="en" shopName="Afro Salon" customerName="Ali" dateText="17 September 2026" timeText="14:30" by="STAFF" bookUrl="http://localhost:3000" />,
    );
    expect(html).toContain("The salon cancelled your appointment");
  });
});

describe("NewAppointmentForBarber", () => {
  it.each(LOCALES)("%s başlığını taşır", async (locale) => {
    const html = await render(
      <NewAppointmentForBarber locale={locale} barberName="Kwame" customerName="Ali" customerPhone="+90 555" timeText="14:30 – 15:00" services={["Saç"]} panelUrl="http://localhost:3000/panel" />,
    );
    expect(html).toContain(HEADINGS.barberNotice[locale]);
    expect(html).toContain("Kwame");
  });
});

describe("ContactMessage", () => {
  it.each(LOCALES)("%s başlığını taşır", async (locale) => {
    const html = await render(
      <ContactMessage locale={locale} visitorLocale="tr" shopName="Afro Salon" name="Ayşe" phone="+90 555" message="Merhaba" services={["Fade"]} />,
    );
    expect(html).toContain(HEADINGS.contact[locale]);
    expect(html).toContain("Afro Salon");
  });

  // E-posta salona gider: ziyaretçinin dili salonun dilinde yazılır
  // ("Français" değil "Fransızca"), salon mesaja o dilde dönebilsin diye.
  it("ziyaretçinin dilini salonun dilinde yazar", async () => {
    const html = await render(
      <ContactMessage locale="tr" visitorLocale="fr" shopName="Afro Salon" name="Ayşe" phone="+90 555" message="Bonjour" services={["Fade"]} />,
    );
    expect(html).toContain("Ziyaretçinin dili: Fransızca");
  });
});

describe("e-posta konuları", () => {
  it.each(LOCALES)("%s konusu saati taşır", (locale) => {
    expect(emailTranslator(locale, "confirmed")("subject", { time: "14:30" })).toContain("14:30");
  });
});
