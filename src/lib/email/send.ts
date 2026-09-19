import { Resend } from "resend";
import { render } from "@react-email/components";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { routing, toAppLocale, type AppLocale } from "@/i18n/routing";
import { withLocale } from "@/lib/locale-path";
import { siteUrl } from "@/lib/site-url";
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

/**
 * E-postadaki bağlantıların mutlak kökü. Auth.js zaten `AUTH_URL` istiyor, o
 * varsa ilk sıradadır; yoksa sitenin kök adresi için tek kaynak
 * {@link siteUrl}'dir (`NEXT_PUBLIC_SITE_URL`, `sitemap.xml` ve `canonical`
 * de oradan beslenir). Buraya ikinci bir yedek adres yazmak üçüncü bir gerçek
 * üretirdi.
 */
function baseUrl() {
  const configured = process.env.AUTH_URL?.trim().replace(/\/+$/, "");
  return configured ? configured : siteUrl();
}

/**
 * E-posta gövdesindeki her bağlantı alıcının diline önekli gider: Fransızca
 * bir onay e-postası `/fr/randevularim`e çıkar, ziyaretçiyi Türkçe sayfaya
 * düşürmez. Türkçe öneksiz olduğu için (`localePrefix: "as-needed"`) TR
 * adresleri değişmez.
 */
function localeUrl(locale: AppLocale, path: string) {
  return `${baseUrl()}${withLocale(locale, path)}`;
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
        manageUrl: localeUrl(locale, "/randevularim"),
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
        bookUrl: localeUrl(locale, "/"),
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
        panelUrl: localeUrl(locale, "/panel"),
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
 *
 * Gövde salonun dilindedir (`tr`) — hizmet adları da Türkçe gelir (bkz.
 * `actions/impl/contact.ts`). `visitorLocale` yalnızca "ziyaretçi hangi dilde
 * yazdı" satırı için taşınır; salon mesaja o dilde dönebilsin diye.
 */
export async function sendContactMessage(input: { name: string; phone: string; message: string; services: string[]; visitorLocale: AppLocale }) {
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
        visitorLocale: input.visitorLocale,
      }),
    );
    // Ad alanındaki satır sonu/çoklu boşluk konu satırını bozabildiğinden tek boşluğa indirilir.
    const subjectName = input.name.replace(/\s+/g, " ").trim();
    await deliver(to, emailTranslator(SHOP_LOCALE, "contact")("subject", { name: subjectName }), html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}
