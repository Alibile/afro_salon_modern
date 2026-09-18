import { Resend } from "resend";
import { render } from "@react-email/components";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { routing, toAppLocale, type AppLocale } from "@/i18n/routing";
import { emailTranslator } from "./i18n";
import { AppointmentConfirmed } from "./templates/AppointmentConfirmed";
import { AppointmentCancelled } from "./templates/AppointmentCancelled";
import { NewAppointmentForBarber } from "./templates/NewAppointmentForBarber";
import { ContactMessage } from "./templates/ContactMessage";

/**
 * E-postanın dili adresten gelemez: gövde bir sayfa isteğinin içinde değil,
 * bir randevu kaydının ardından üretilir. Alıcının kayıtlı tercihi
 * (`User.locale`) tek doğru kaynak; müşteri e-postaları müşterinin, berber
 * bildirimi berberin diliyle gider. İletişim formu e-postası ise ziyaretçiye
 * değil salona gider, o yüzden salonun dilinde (`tr`) kalır.
 */
const SHOP_LOCALE: AppLocale = routing.defaultLocale;

function baseUrl() {
  return process.env.AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

async function deliver(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:skipped] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const resend = new Resend(key);
    await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Afro Salon <onboarding@resend.dev>", to, subject, html });
  } catch (e) {
    console.error("[email:error]", e);
  }
}

async function loadAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { customer: true, barber: { include: { user: true } }, services: true },
  });
}

export async function sendAppointmentConfirmed(appointmentId: string) {
  try {
    const a = await loadAppointment(appointmentId);
    if (!a) return;
    const settings = await getSettings();
    const locale = toAppLocale(a.customer.locale);
    const timeText = formatShopTime(a.startsAt);
    const html = await render(
      AppointmentConfirmed({
        locale,
        shopName: settings.shopName,
        customerName: a.customer.name,
        barberName: a.barber.user.name,
        dateText: formatShopDate(a.startsAt, locale),
        timeText,
        services: a.services.map((s) => s.nameSnapshot),
        totalText: formatKurus(a.services.reduce((t, s) => t + s.priceSnapshot, 0), locale),
        manageUrl: `${baseUrl()}/randevularim`,
      }),
    );
    await deliver(a.customer.email, emailTranslator(locale, "confirmed")("subject", { time: timeText }), html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}

export async function sendAppointmentCancelled(appointmentId: string, by: "CUSTOMER" | "STAFF") {
  try {
    const a = await loadAppointment(appointmentId);
    if (!a) return;
    const settings = await getSettings();
    const locale = toAppLocale(a.customer.locale);
    const html = await render(
      AppointmentCancelled({
        locale,
        shopName: settings.shopName,
        customerName: a.customer.name,
        dateText: formatShopDate(a.startsAt, locale),
        timeText: formatShopTime(a.startsAt),
        by,
        bookUrl: baseUrl(),
      }),
    );
    await deliver(a.customer.email, emailTranslator(locale, "cancelled")("subject"), html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}

export async function sendNewAppointmentToBarber(appointmentId: string) {
  try {
    const settings = await getSettings();
    if (!settings.notifyBarberOnBooking) return;
    const a = await loadAppointment(appointmentId);
    if (!a) return;
    const locale = toAppLocale(a.barber.user.locale);
    const startText = formatShopTime(a.startsAt);
    const html = await render(
      NewAppointmentForBarber({
        locale,
        barberName: a.barber.user.name,
        customerName: a.customer.name,
        customerPhone: a.customer.phone ?? "-",
        timeText: `${startText} – ${formatShopTime(a.endsAt)}`,
        services: a.services.map((s) => s.nameSnapshot),
        panelUrl: `${baseUrl()}/panel`,
      }),
    );
    await deliver(a.barber.user.email, emailTranslator(locale, "barberNotice")("subject", { time: startText }), html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}

/**
 * İletişim formundan gelen mesajı salona iletir. Alıcı `settings.email`,
 * boşsa `EMAIL_FROM` adresidir; ikisi de yoksa mesaj yalnızca loglanır.
 */
export async function sendContactMessage(input: { name: string; phone: string; message: string; services: string[] }) {
  try {
    const settings = await getSettings();
    const to = settings.email.trim() || process.env.EMAIL_FROM?.trim();
    if (!to) {
      console.info(`[email:skipped] iletişim mesajı için alıcı adresi tanımlı değil (from=${input.name})`);
      return;
    }
    const html = await render(
      ContactMessage({
        locale: SHOP_LOCALE,
        shopName: settings.shopName,
        name: input.name,
        phone: input.phone,
        message: input.message,
        services: input.services,
      }),
    );
    // Ad alanındaki satır sonu/çoklu boşluk konu satırını bozabildiğinden tek boşluğa indirilir.
    const subjectName = input.name.replace(/\s+/g, " ").trim();
    await deliver(to, emailTranslator(SHOP_LOCALE, "contact")("subject", { name: subjectName }), html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}
