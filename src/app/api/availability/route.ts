import { NextResponse } from "next/server";
import { getTodayAvailability } from "@/lib/queries/booking";

/**
 * Hata gövdesi metin değil **anahtar** taşır (`{ error: "errors.invalidRequest" }`).
 * Uç nokta `[locale]` ağacının dışında durur, yani isteğin dilini bilmez;
 * anahtarı metne çeviren yer server action'larda olduğu gibi istemcidir
 * (`formatActionError`). Gövdeye Türkçe bir cümle yazmak İngilizce ve Fransızca
 * sihirbazda çevrilmemiş metin gösterirdi.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberId = url.searchParams.get("barberId") ?? "";
  const duration = Number(url.searchParams.get("duration") ?? 0);
  if (!barberId || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "errors.invalidRequest" }, { status: 400 });
  }
  const r = await getTodayAvailability(barberId, duration);
  return NextResponse.json({ slots: r.slots.map((d) => d.toISOString()), isOpenToday: r.isOpenToday, opensAt: r.opensAt }, { headers: { "Cache-Control": "no-store" } });
}
