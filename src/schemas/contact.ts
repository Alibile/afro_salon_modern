import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter").max(60, "Ad en fazla 60 karakter"),
  phone: z.string().trim().max(20, "Telefon en fazla 20 karakter").default(""),
  message: z.string().trim().min(10, "Mesaj en az 10 karakter").max(1000, "Mesaj en fazla 1000 karakter"),
  /** Formda işaretlenen hizmet adları; e-posta gövdesinde liste olarak yer alır. */
  services: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  /** Bot tuzağı: gerçek kullanıcı bu alanı göremez, doluysa mesaj sessizce yutulur. */
  website: z.string().max(200).default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
