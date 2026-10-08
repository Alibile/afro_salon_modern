import { randomUUID } from "node:crypto";

/**
 * R2 ayarlı değilken (geliştirme, ilk kurulum) fotoğraflar yerel diske iner:
 * `public/uploads/<klasör>/<uuid>.<uzantı>`. Anahtar R2'dekiyle aynı klasör
 * adlarını kullanır, başına `uploads/` gelir; `publicUrl` bu öneki yerel yol
 * olarak servis eder. Üretimde (Vercel) disk salt okunur olduğu için bu yol
 * yalnızca R2 yokken açılır — `hasR2()` iki tarafta da tek ölçüttür.
 */
export const LOCAL_UPLOAD_PREFIX = "uploads/";

/** Yükleme türü → klasör; `storage.ts` içindeki `UPLOAD_FOLDERS` ile birebir. */
const FOLDERS = { barber: "barbers", haircut: "haircuts", gallery: "gallery" } as const;
export type LocalUploadKind = keyof typeof FOLDERS;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const CONTENT_TYPE_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export function hasR2(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.R2_ACCOUNT_ID?.trim());
}

export function localUploadKey(kind: LocalUploadKind, contentType: string): string {
  return `${LOCAL_UPLOAD_PREFIX}${FOLDERS[kind]}/${randomUUID()}.${EXT[contentType] ?? "jpg"}`;
}

export function isLocalUploadKey(key: string): boolean {
  return key.startsWith(LOCAL_UPLOAD_PREFIX);
}

/**
 * Anahtarı diske yazmadan önce sıkı biçim denetimi: yalnızca bilinen klasör,
 * UUID dosya adı ve üç uzantı. `..` ya da başka bir ayraç geçemez; dosya yolu
 * bu iki parçadan kurulur, anahtardan değil.
 */
export function parseLocalUploadKey(key: string): { folder: string; file: string } | null {
  const m = /^uploads\/(barbers|haircuts|gallery)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp))$/.exec(key);
  return m ? { folder: m[1], file: m[2] } : null;
}
