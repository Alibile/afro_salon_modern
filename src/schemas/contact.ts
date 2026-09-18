import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "errors.nameMin2").max(60, "errors.nameMax60"),
  phone: z.string().trim().max(20, "errors.phoneMax20").default(""),
  message: z.string().trim().min(10, "errors.messageMin10").max(1000, "errors.messageMax1000"),
  /** Formda işaretlenen hizmet adları; e-posta gövdesinde liste olarak yer alır. */
  services: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  /** Bot tuzağı: gerçek kullanıcı bu alanı göremez, doluysa mesaj sessizce yutulur. */
  website: z.string().max(200).default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
