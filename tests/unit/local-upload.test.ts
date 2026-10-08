import { describe, it, expect } from "vitest";
import { hasR2, isLocalUploadKey, localUploadKey, parseLocalUploadKey } from "@/lib/local-upload";

/**
 * R2 ayarlı değilken yüklemeler yerel diske (`public/uploads/`) iner. Anahtar
 * biçimi R2'dekiyle aynı klasör adlarını kullanır; `uploads/` öneki yerelde
 * `publicUrl` için işarettir.
 */
describe("local-upload", () => {
  it("hasR2 yalnızca hesap kimliği doluyken doğru", () => {
    expect(hasR2({ R2_ACCOUNT_ID: "" })).toBe(false);
    expect(hasR2({})).toBe(false);
    expect(hasR2({ R2_ACCOUNT_ID: "abc" })).toBe(true);
  });

  it("localUploadKey klasör ve uzantıyı türden üretir", () => {
    const key = localUploadKey("barber", "image/png");
    expect(key).toMatch(/^uploads\/barbers\/[0-9a-f-]{36}\.png$/);
    expect(localUploadKey("gallery", "image/jpeg")).toMatch(/^uploads\/gallery\/.*\.jpg$/);
    expect(localUploadKey("haircut", "image/webp")).toMatch(/^uploads\/haircuts\/.*\.webp$/);
    expect(localUploadKey("site", "image/jpeg")).toMatch(/^uploads\/site\/.*\.jpg$/);
  });

  it("parseLocalUploadKey yalnızca beklenen biçimi kabul eder (yol gezinmesi yok)", () => {
    const ok = parseLocalUploadKey("uploads/barbers/6f1b2c3d-1111-4222-8333-444455556666.jpg");
    expect(ok).toEqual({ folder: "barbers", file: "6f1b2c3d-1111-4222-8333-444455556666.jpg" });
    expect(parseLocalUploadKey("uploads/site/6f1b2c3d-1111-4222-8333-444455556666.webp")).toEqual({ folder: "site", file: "6f1b2c3d-1111-4222-8333-444455556666.webp" });
    for (const bad of ["uploads/../x.jpg", "uploads/barbers/../../etc/passwd", "barbers/a.jpg", "uploads/other/6f1b2c3d-1111-4222-8333-444455556666.jpg", "uploads/barbers/a.jpg", "uploads/barbers/6f1b2c3d-1111-4222-8333-444455556666.exe"]) {
      expect(parseLocalUploadKey(bad), bad).toBeNull();
    }
    expect(isLocalUploadKey("uploads/gallery/x")).toBe(true);
    expect(isLocalUploadKey("gallery/x")).toBe(false);
  });
});
