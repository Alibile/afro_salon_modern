import { z } from "zod";

/** R2 anahtarı yalnızca presign ucunun ürettiği biçimde olabilir: haircuts/<uuid>.<ext> */
export const addHaircutPhotoSchema = z.object({
  customerId: z.string().min(1),
  storageKey: z.string().regex(/^haircuts\/[0-9a-f-]{36}\.(jpg|png|webp)$/, "Geçersiz fotoğraf anahtarı"),
  appointmentId: z.string().min(1).optional(),
  barberId: z.string().min(1).optional(),
});
export type AddHaircutPhotoInput = z.infer<typeof addHaircutPhotoSchema>;
