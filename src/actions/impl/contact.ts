import { hasLocale } from "next-intl";
import { prisma } from "@/lib/db";
import { routing, type AppLocale } from "@/i18n/routing";
import { pick } from "@/lib/i18n-content";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import { allow } from "@/lib/rate-limit";
import { sendContactMessage } from "@/lib/email/send";
import { contactSchema, type ContactInput } from "@/schemas/contact";

const LIMIT = 3;
const WINDOW_MS = 60_000;
/** IP başına sınır aşılmasa da tüm form için saatlik bir tavan vardır. */
const GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;

/**
 * İletişim formu: oturum gerektirmez. Kötüye kullanıma karşı IP başına dakikada
 * {@link LIMIT} mesaj sınırı, IP değiştirerek dağıtılan sel saldırılarına karşı
 * saatte {@link GLOBAL_LIMIT} mesajlık genel tavan ve gizli bir bot tuzağı
 * (`website`) vardır.
 * E-posta gönderimi başarısız olsa da kullanıcıya hata gösterilmez; mesajın
 * kaybolduğu loglara yazılır.
 */
/**
 * Formda işaretlenen hizmet adları ziyaretçinin dilinde gelir ("Coupe de
 * cheveux"), oysa e-posta salona ve salonun dilinde gider. Adlar burada Türkçe
 * kaynak metne geri çevrilir ki salonun listesiyle aynı sözcükler görünsün.
 * Eşleşmeyen bir ad (arada silinmiş hizmet, elle gönderilmiş değer) olduğu
 * gibi bırakılır: bilgi kaybetmektense çevrilmemiş göstermek yeğdir.
 */
async function serviceNamesInShopLanguage(names: string[], visitorLocale: AppLocale): Promise<string[]> {
  if (names.length === 0 || visitorLocale === routing.defaultLocale) return names;
  const services = await prisma.service.findMany({ select: { nameI18n: true } });
  const byVisitorName = new Map(services.map((s) => [pick(s.nameI18n, visitorLocale), pick(s.nameI18n, routing.defaultLocale)]));
  return names.map((name) => byVisitorName.get(name) ?? name);
}

export async function sendContactMessageAs(input: ContactInput, ip: string, requestLocale?: string): Promise<ActionResult<void>> {
  if (!allow(`contact:${ip}`, LIMIT, WINDOW_MS)) return fail("errors.tooManyRequests");
  if (!allow("contact:global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS)) return fail("errors.tooManyRequests");
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  // Bot tuzağı doluysa gönderen için her şey normal görünür, mesaj iletilmez.
  if (parsed.data.website !== "") return ok(undefined);
  // Serbest bir dize doğrudan kullanılmaz; tanınmayan değer salonun diline düşer.
  const visitorLocale = hasLocale(routing.locales, requestLocale) ? requestLocale : routing.defaultLocale;
  try {
    await sendContactMessage({
      name: parsed.data.name,
      phone: parsed.data.phone,
      message: parsed.data.message,
      services: await serviceNamesInShopLanguage(parsed.data.services, visitorLocale),
      visitorLocale,
    });
  } catch (e) {
    console.error("[contact:error]", e);
  }
  return ok(undefined);
}
