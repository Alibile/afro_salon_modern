import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-helpers";
import { createPresignedUpload, UploadValidationError } from "@/lib/storage";

const bodySchema = z.object({
  kind: z.enum(["barber", "haircut", "gallery"]),
  contentType: z.string(),
  contentLength: z.number().int().positive(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BARBER" && user.role !== "ADMIN")) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  try {
    const r = await createPresignedUpload(parsed.data.kind, parsed.data.contentType, parsed.data.contentLength);
    return NextResponse.json(r);
  } catch (e) {
    // Doğrulama hataları istemciye gösterilir; yapılandırma/altyapı hataları
    // yalnızca sunucuda loglanır.
    if (e instanceof UploadValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[upload:presign]", e);
    return NextResponse.json({ error: "Yükleme şu an kullanılamıyor" }, { status: 500 });
  }
}
