import { ok, fail, type ActionResult } from "@/lib/action-result";
import { allow } from "@/lib/rate-limit";
import { sendContactMessage } from "@/lib/email/send";
import { contactSchema, type ContactInput } from "@/schemas/contact";

const LIMIT = 3;
const WINDOW_MS = 60_000;

/**
 * İletişim formu: oturum gerektirmez. Kötüye kullanıma karşı IP başına dakikada
 * {@link LIMIT} mesaj sınırı ve gizli bir bot tuzağı (`website`) vardır.
 * E-posta gönderimi başarısız olsa da kullanıcıya hata gösterilmez; mesajın
 * kaybolduğu loglara yazılır.
 */
export async function sendContactMessageAs(input: ContactInput, ip: string): Promise<ActionResult<void>> {
  if (!allow(`contact:${ip}`, LIMIT, WINDOW_MS)) return fail("Çok fazla deneme, lütfen biraz sonra tekrar deneyin");
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  // Bot tuzağı doluysa gönderen için her şey normal görünür, mesaj iletilmez.
  if (parsed.data.website !== "") return ok(undefined);
  try {
    await sendContactMessage({
      name: parsed.data.name,
      phone: parsed.data.phone,
      message: parsed.data.message,
      services: parsed.data.services,
    });
  } catch (e) {
    console.error("[contact:error]", e);
  }
  return ok(undefined);
}
