"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import type { ActionResult } from "@/lib/action-result";
import { clientIp } from "@/lib/client-ip";
import { sendContactMessageAs } from "@/actions/impl/contact";
import type { ContactInput } from "@/schemas/contact";

/**
 * HERKESE AÇIK action: ziyaretçi oturum açmadan mesaj gönderebilir. Kimlik
 * yerine hız sınırının anahtarı olarak istemci IP'si kullanılır; hangi
 * başlığa güvenildiği {@link clientIp} içinde anlatılır.
 */
export async function sendContactMessage(input: ContactInput): Promise<ActionResult<void>> {
  // Ziyaretçinin dili gövdeden değil istekten okunur (next-intl sunucu API'si).
  const [requestHeaders, requestLocale] = await Promise.all([headers(), getLocale()]);
  return sendContactMessageAs(input, clientIp(requestHeaders), requestLocale);
}
