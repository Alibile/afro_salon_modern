import type { ErrorKey, ErrorParams } from "./errors";

/**
 * Başarısız sonuç metin değil anahtar taşır (`errors.slotTaken`): action
 * sunucuda çalışır ve kullanıcının dilini bilmek zorunda değildir, metin
 * istemcide `formatActionError` ile üretilir. `params` yalnızca ICU yer
 * tutucusu olan anahtarlarda dolar (ör. `errors.cancelWindow` → `{minutes}`).
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; params?: ErrorParams };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: ErrorKey, params?: ErrorParams): ActionResult<T> {
  return params ? { ok: false, error, params } : { ok: false, error };
}
