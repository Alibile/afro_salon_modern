import { NextResponse } from "next/server";
import { getAvailability, getDaySummaries } from "@/lib/queries/booking";
import { bookableDays, parseBookableDate } from "@/lib/booking-window";

/**
 * Hata gövdesi metin değil **anahtar** taşır (`{ error: "errors.invalidRequest" }`).
 * Uç nokta `[locale]` ağacının dışında durur, yani isteğin dilini bilmez;
 * anahtarı metne çeviren yer server action'larda olduğu gibi istemcidir
 * (`formatActionError`). Gövdeye Türkçe bir cümle yazmak İngilizce ve Fransızca
 * sihirbazda çevrilmemiş metin gösterirdi.
 *
 * İki soru tek uçtan cevaplanır: `?summary=1` pencereye giren günlerin özetini
 * (çipler için) döner, `?date=YYYY-MM-DD` tek günün saatlerini. Tarih
 * verilmezse pencerenin ilk günü alınır (Pazar günü açılan sayfada bu
 * yarındır); pencere dışı ya da Pazar bir tarih
 * `errors.dateOutOfRange` ile 400 döner — istemciyi doğrulamanın tek sahibi
 * yapmamak için kural burada da uygulanır.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberId = url.searchParams.get("barberId") ?? "";
  const duration = Number(url.searchParams.get("duration") ?? 0);
  if (!barberId || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "errors.invalidRequest" }, { status: 400 });
  }

  const now = new Date();
  const noStore = { headers: { "Cache-Control": "no-store" } };

  if (url.searchParams.get("summary") === "1") {
    const days = await getDaySummaries(barberId, duration, now);
    return NextResponse.json({ days }, noStore);
  }

  const date = url.searchParams.get("date");
  const dayStart = date ? parseBookableDate(date, now) : (bookableDays(now)[0]?.dayStart ?? null);
  if (!dayStart) return NextResponse.json({ error: "errors.dateOutOfRange" }, { status: 400 });

  const r = await getAvailability(barberId, duration, dayStart, now);
  return NextResponse.json(
    { slots: r.slots.map((d) => d.toISOString()), isOpen: r.isOpen, opensAt: r.opensAt },
    noStore,
  );
}
