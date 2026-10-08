import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth-helpers";
import { CONTENT_TYPE_BY_EXT, hasR2, parseLocalUploadKey } from "@/lib/local-upload";
import { localUploadPath } from "@/lib/storage";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

/**
 * R2 yokken `createPresignedUpload`ın verdiği yerel yükleme ucu. Yalnızca
 * personel, yalnızca R2 ayarlı değilken (aksi hâlde 404: üretimde bu yol hiç
 * yoktur). Anahtar `parseLocalUploadKey` ile sıkı biçimde doğrulanır; dosya
 * `public/uploads/<klasör>/<uuid>.<uzantı>` olarak yazılır ve Next'in `public`
 * sunumuyla `/uploads/...` adresinden servis edilir.
 */
export async function PUT(req: Request) {
  if (hasR2()) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  const user = await getSessionUser();
  if (!user || (user.role !== "BARBER" && user.role !== "ADMIN")) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  const parsed = parseLocalUploadKey(key);
  const target = localUploadPath(key);
  if (!parsed || !target) return NextResponse.json({ error: "Geçersiz anahtar" }, { status: 400 });

  const ext = parsed.file.split(".").pop() ?? "";
  const contentType = req.headers.get("content-type") ?? "";
  if (CONTENT_TYPE_BY_EXT[ext] !== contentType) return NextResponse.json({ error: "Dosya türü anahtarla uyuşmuyor" }, { status: 400 });

  const body = Buffer.from(await req.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Dosya boş ya da 8 MB'den büyük" }, { status: 400 });

  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    // `wx`: aynı anahtara ikinci yazım reddedilir; anahtar UUID olduğu için
    // çakışma ancak kötü niyetli bir tekrar olabilir.
    await fs.writeFile(target, body, { flag: "wx" });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") return NextResponse.json({ error: "Bu anahtar zaten kullanılmış" }, { status: 409 });
    console.error("[upload:local]", e);
    return NextResponse.json({ error: "Dosya yazılamadı" }, { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
