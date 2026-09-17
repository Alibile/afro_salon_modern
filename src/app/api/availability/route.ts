import { NextResponse } from "next/server";
import { getTodayAvailability } from "@/lib/queries/booking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberId = url.searchParams.get("barberId") ?? "";
  const duration = Number(url.searchParams.get("duration") ?? 0);
  if (!barberId || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const r = await getTodayAvailability(barberId, duration);
  return NextResponse.json({ slots: r.slots.map((d) => d.toISOString()), isOpenToday: r.isOpenToday, opensAt: r.opensAt }, { headers: { "Cache-Control": "no-store" } });
}
