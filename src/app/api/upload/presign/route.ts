import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-helpers";
import { createPresignedUpload } from "@/lib/storage";

const bodySchema = z.object({ kind: z.enum(["barber", "haircut"]), contentType: z.string() });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BARBER" && user.role !== "ADMIN")) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  try {
    const r = await createPresignedUpload(parsed.data.kind, parsed.data.contentType);
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Yükleme hazırlanamadı" }, { status: 400 });
  }
}
