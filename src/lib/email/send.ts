import { Resend } from "resend";
import { render } from "@react-email/components";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { AppointmentConfirmed } from "./templates/AppointmentConfirmed";
import { AppointmentCancelled } from "./templates/AppointmentCancelled";
import { NewAppointmentForBarber } from "./templates/NewAppointmentForBarber";
import { ContactMessage } from "./templates/ContactMessage";

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
    const html = await render(
      AppointmentConfirmed({
        shopName: settings.shopName,
        customerName: a.customer.name,
        barberName: a.barber.user.name,
        dateText: formatShopDate(a.startsAt),
        timeText: formatShopTime(a.startsAt),
        services: a.services.map((s) => s.nameSnapshot),
        totalText: formatKurus(a.services.reduce((t, s) => t + s.priceSnapshot, 0)),
        manageUrl: `${baseUrl()}/randevularim`,
      }),
    );
    await deliver(a.customer.email, `Randevun onaylandı · ${formatShopTime(a.startsAt)}`, html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}

export async function sendAppointmentCancelled(appointmentId: string, by: "CUSTOMER" | "STAFF") {
  try {
    const a = await loadAppointment(appointmentId);
    if (!a) return;
    const settings = await getSettings();
    const html = await render(
      AppointmentCancelled({
        shopName: settings.shopName,
        customerName: a.customer.name,
        dateText: formatShopDate(a.startsAt),
        timeText: formatShopTime(a.startsAt),
        byText: by === "CUSTOMER" ? "Randevunu sen iptal ettin." : "Randevun salon tarafından iptal edildi, yeni randevu için tekrar deneyebilirsin.",
        bookUrl: baseUrl(),
      }),
    );
    await deliver(a.customer.email, "Randevun iptal edildi", html);
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
    const html = await render(
      NewAppointmentForBarber({
        barberName: a.barber.user.name,
        customerName: a.customer.name,
        customerPhone: a.customer.phone ?? "-",
        timeText: `${formatShopTime(a.startsAt)} – ${formatShopTime(a.endsAt)}`,
        services: a.services.map((s) => s.nameSnapshot),
        panelUrl: `${baseUrl()}/panel`,
      }),
    );
    await deliver(a.barber.user.email, `Yeni randevu · ${formatShopTime(a.startsAt)}`, html);
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
        shopName: settings.shopName,
        name: input.name,
        phone: input.phone,
        message: input.message,
        services: input.services,
      }),
    );
    // Ad alanındaki satır sonu/çoklu boşluk konu satırını bozabildiğinden tek boşluğa indirilir.
    const subjectName = input.name.replace(/\s+/g, " ").trim();
    await deliver(to, `Siteden yeni mesaj · ${subjectName}`, html);
  } catch (e) {
    console.error("[email:error]", e);
  }
}
