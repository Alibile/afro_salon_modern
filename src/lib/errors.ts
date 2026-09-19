/**
 * Server action ve şema hataları artık metin değil **anahtar** taşır.
 *
 * Bir action üç dilin hangisinde çağrıldığını bilmek zorunda kalmasın diye
 * `fail("errors.slotTaken")` yazılır; metne çevirme işi, kullanıcının diliyle
 * render edilen istemci bileşeninde (`formatActionError`) yapılır. Zod şema
 * mesajları da aynı anahtarları yazar: `issues[0].message` doğrudan bir
 * `ErrorKey`'dir, {@link firstIssueKey} onu doğrular.
 *
 * Liste burada elle durur (mesaj dosyasından türetilmez): tek bir `as const`
 * dizi hem derleme zamanı birliğini (`fail` yanlış anahtar kabul etmez) hem de
 * çalışma zamanı kümesini verir. `tests/unit/error-keys.test.ts` bu listenin
 * `messages/{tr,en,fr}.json` ile birebir örtüştüğünü ve kodda geçen her
 * `errors.*` dizgesinin listede olduğunu doğrular.
 */
export const ERROR_CODES = [
  // Yetki ve oturum
  "notAllowed",
  "loginRequired",
  "loginRequiredToBook",
  "invalidCredentials",
  "emailTaken",
  "userNotFound",
  "wrongPassword",
  // Genel
  "invalidInput",
  "tooManyRequests",
  "invalidLocale",
  "invalidRequest",
  // Randevu
  "barberNotFound",
  "selectedServiceNotFound",
  "slotUnavailable",
  "slotTaken",
  "dateOutOfRange",
  "appointmentNotFound",
  "appointmentNotScheduled",
  "appointmentStatusChanged",
  "cancelWindow",
  // Hizmetler
  "serviceNotFound",
  "serviceInUse",
  "serviceHasRelations",
  // Berberler
  "cannotDeleteOwnAccount",
  "barberHasHistory",
  "userHasHistory",
  "barberHasRelations",
  // Fotoğraf ve galeri
  "photoNotFound",
  "photoMissing",
  "barberNotSelected",
  "customerNotFound",
  "invalidPhotoKey",
  "invalidPhotoSize",
  "invalidAspectRatio",
  "selectPhoto",
  "tooManyPhotos",
  "invalidDirection",
  "captionTooLong",
  "tagRequired",
  "invalidTags",
  // İzinler
  "timeOffNotFound",
  "invalidDate",
  "invalidTimeRange",
  "invalidTime",
  "endBeforeStart",
  // Yorumlar
  "testimonialNotFound",
  "testimonialTooShort",
  "ratingRange",
  // Form alanları
  "nameMin2",
  "nameMax60",
  "fullNameMin2",
  "fullNameMin3",
  "enterValidEmail",
  "invalidEmail",
  "passwordMin8",
  "passwordRequired",
  "currentPasswordRequired",
  "photoRequired",
  "phoneMax20",
  "messageMin10",
  "messageMax1000",
  "selectService",
  "invalidDateTime",
  "serviceNameMin2",
  "durationStep5",
  "priceNegative",
  // Ayarlar
  "shopNameRequired",
  "invalidSlotStep",
  "invalidInstagram",
  "invalidFacebook",
  "invalidWhatsapp",
  "invalidMapsUrl",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
/** `ActionResult.error` ve Zod mesajlarında taşınan tam anahtar. */
export type ErrorKey = `errors.${ErrorCode}`;
/** ICU yer tutucuları (şimdilik yalnızca `cancelWindow` için `{minutes}`). */
export type ErrorParams = Record<string, string | number>;

const KEYS: ReadonlySet<string> = new Set(ERROR_CODES.map((code) => `errors.${code}`));

export function isErrorKey(value: unknown): value is ErrorKey {
  return typeof value === "string" && KEYS.has(value);
}

/**
 * Zod'un ilk hatasını anahtara indirger. Şemalarda mesaj olarak anahtar yazılı
 * olduğu için bu çoğu zaman aynen geçer; mesajı verilmemiş bir kural (ör. bir
 * `.max(80)`) Zod'un kendi İngilizce metnini üretir, o da tek bir genel
 * anahtara düşer — kullanıcı hiçbir durumda çevrilmemiş metin görmez.
 */
export function firstIssueKey(error: { issues: readonly { message: string }[] }): ErrorKey {
  const message = error.issues[0]?.message;
  return isErrorKey(message) ? message : "errors.invalidInput";
}

/** `errors` ad alanına bağlı bir çevirmenin bu modülün ihtiyaç duyduğu kadarı. */
export type ErrorTranslator = {
  (code: string, values?: ErrorParams): string;
  has(code: string): boolean;
};

/**
 * Hata anahtarını kullanıcının dilinde metne çevirir. Tanımadığı bir değer
 * gelirse (eski bir sürümden kalan metin, ileride eklenip çevrilmemiş bir
 * anahtar) ham değeri döndürür: kullanıcı boş bir uyarı yerine hiç olmazsa
 * bir şey görür.
 */
export function formatActionError(
  t: ErrorTranslator,
  result: { error: string; params?: ErrorParams },
): string {
  const code = result.error.startsWith("errors.") ? result.error.slice("errors.".length) : result.error;
  return t.has(code) ? t(code, result.params) : result.error;
}
