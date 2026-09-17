"use server";

import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { sendContactMessageAs } from "@/actions/impl/contact";
import type { ContactInput } from "@/schemas/contact";

/**
 * HERKESE AÇIK action: ziyaretçi oturum açmadan mesaj gönderebilir. Kimlik
 * yerine hız sınırının anahtarı olarak istemci IP'si kullanılır.
 */
export async function sendContactMessage(input: ContactInput): Promise<ActionResult<void>> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return sendContactMessageAs(input, ip);
}
