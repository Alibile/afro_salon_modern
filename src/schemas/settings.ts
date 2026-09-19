import { z } from "zod";
import { i18nText } from "@/lib/i18n-content";

/** Instagram: @ ile başlayan veya çıplak kullanıcı adı https://instagram.com/<ad>'a normalize edilir; URL olduğu gibi kalır. */
function normalizeInstagram(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return `https://instagram.com/${handle}`;
}

const trimmedText = () => z.string().transform((v) => v.trim());

/** Adresler doğrudan `href` olarak render edildiğinden yalnızca http(s) kabul edilir. */
const HTTP_PROTOCOL = /^https?$/;

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1, "errors.shopNameRequired").max(60),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  cancellationWindowMinutes: z.coerce.number().int().min(0).max(1440),
  minLeadMinutes: z.coerce.number().int().min(0).max(240),
  slotStepMinutes: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), "errors.invalidSlotStep"),
  notifyBarberOnBooking: z.boolean(),

  email: trimmedText().pipe(z.email("errors.invalidEmail").or(z.literal(""))),
  instagram: trimmedText().transform(normalizeInstagram).pipe(z.url("errors.invalidInstagram").or(z.literal(""))),
  facebook: trimmedText().pipe(z.url({ protocol: HTTP_PROTOCOL, error: "errors.invalidFacebook" }).or(z.literal(""))),
  whatsapp: trimmedText().pipe(
    z
      .string()
      .regex(/^\d{10,15}$/, "errors.invalidWhatsapp")
      .or(z.literal("")),
  ),
  mapsUrl: trimmedText().pipe(z.url({ protocol: HTTP_PROTOCOL, error: "errors.invalidMapsUrl" }).or(z.literal(""))),

  // Site metinleri üç dilde girilir; hiçbiri zorunlu değil (boş bölüm hiç basılmaz).
  aboutTitle: i18nText({ max: 100 }),
  aboutText: i18nText({ max: 500 }),
  whyUs1Title: i18nText({ max: 60 }),
  whyUs1Text: i18nText({ max: 500 }),
  whyUs2Title: i18nText({ max: 60 }),
  whyUs2Text: i18nText({ max: 500 }),
  whyUs3Title: i18nText({ max: 60 }),
  whyUs3Text: i18nText({ max: 500 }),
  satisfactionPercent: z.coerce.number().int().min(0).max(100),
  yearsExperience: z.coerce.number().int().min(0).max(100),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
