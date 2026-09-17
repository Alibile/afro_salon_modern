import { z } from "zod";

/** Instagram: @ ile başlayan veya çıplak kullanıcı adı https://instagram.com/<ad>'a normalize edilir; URL olduğu gibi kalır. */
function normalizeInstagram(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return `https://instagram.com/${handle}`;
}

const trimmedText = () => z.string().transform((v) => v.trim());

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1, "Dükkan adı gerekli").max(60),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  cancellationWindowMinutes: z.coerce.number().int().min(0).max(1440),
  minLeadMinutes: z.coerce.number().int().min(0).max(240),
  slotStepMinutes: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), "Slot adımı 5, 10, 15, 20, 30 veya 60 olmalı"),
  notifyBarberOnBooking: z.boolean(),

  email: trimmedText().pipe(z.email("Geçersiz e-posta").or(z.literal(""))),
  instagram: trimmedText().transform(normalizeInstagram).pipe(z.url("Geçersiz Instagram adresi").or(z.literal(""))),
  facebook: trimmedText().pipe(z.url("Geçersiz Facebook adresi").or(z.literal(""))),
  whatsapp: trimmedText().pipe(
    z
      .string()
      .regex(/^\d{10,15}$/, "WhatsApp numarası ülke koduyla, sadece rakam olmalı (örn. 905551112233)")
      .or(z.literal("")),
  ),
  mapsUrl: trimmedText().pipe(z.url("Geçersiz harita adresi").or(z.literal(""))),

  aboutTitle: z.string().trim().max(100),
  aboutText: z.string().trim().max(500),
  whyUs1Title: z.string().trim().max(60),
  whyUs1Text: z.string().trim().max(500),
  whyUs2Title: z.string().trim().max(60),
  whyUs2Text: z.string().trim().max(500),
  whyUs3Title: z.string().trim().max(60),
  whyUs3Text: z.string().trim().max(500),
  satisfactionPercent: z.coerce.number().int().min(0).max(100),
  yearsExperience: z.coerce.number().int().min(0).max(100),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
