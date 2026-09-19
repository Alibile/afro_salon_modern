import { prisma } from "@/lib/db";
import { computeSlots, type Interval, type WorkingInterval } from "@/lib/availability";
import { addMinutes, parseTime, shopDayOfWeek, shopDayStart } from "@/lib/time";

/** Şema varsayılanları: `Settings` satırı henüz yoksa sayaç yine de çalışır. */
const DEFAULT_SLOT_STEP = 15;
const DEFAULT_MIN_LEAD = 15;

/** Tek berberin bugünü: çalışma aralıkları ve doluluğu (randevu + izin). */
export type BarberDay = { workingIntervals: WorkingInterval[]; busy: Interval[] };

export type SlotCountInput = {
  /** Dükkan saat diliminde günün 00:00'ı (UTC instant). */
  dayStart: Date;
  barbers: BarberDay[];
  durationMinutes: number;
  slotStepMinutes: number;
  minLeadMinutes: number;
  now: Date;
};

/**
 * Bugün için kaç saat boş kaldığı. Randevu sihirbazının berber başına yaptığı
 * hesabın (`computeSlots`) toplamıdır: iki berberin aynı saati boşsa ziyaretçi
 * için iki ayrı seçenektir, bu yüzden tekilleştirilmez.
 *
 * Saf fonksiyon: veritabanına bakmaz, birim testlerle ölçülebilir.
 */
export function countOpenSlots(input: SlotCountInput): number {
  const { dayStart, barbers, durationMinutes, slotStepMinutes, minLeadMinutes, now } = input;
  return barbers.reduce(
    (total, barber) =>
      total +
      computeSlots({
        dayStart,
        workingIntervals: barber.workingIntervals,
        busy: barber.busy,
        durationMinutes,
        slotStepMinutes,
        minLeadMinutes,
        now,
      }).length,
    0,
  );
}

/**
 * Ana sayfanın hero satırındaki "bugün {n} uygun saat" sayısı.
 *
 * Süre en kısa aktif hizmetinkidir: salon tek paketle çalışıyor (45 dk), ama
 * ileride daha kısa bir hizmet eklenirse sayı ona göre yükselmeli — ziyaretçi
 * "bugün hiç yer yok" sanmasın. Hiç aktif hizmet yoksa slot adımı kullanılır.
 *
 * Beş sorgu tek demette (`Promise.all`) gider ve hepsi yalnızca bugünün
 * penceresine bakar; sayfa zaten `force-dynamic` olduğu için bu demet
 * `getLandingData` ile yan yana çalışır. `Settings` burada `upsert` ile değil
 * `findUnique` ile okunur: ayarlar satırını yazmak bu sorgunun işi değil ve
 * eşzamanlı iki `upsert` aynı satırı gereksizce kilitlerdi.
 */
export async function countOpenSlotsToday(now: Date = new Date()): Promise<number> {
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const dayOfWeek = shopDayOfWeek(now);
  const activeBarber = { barber: { isActive: true } };

  const [settings, shortest, hours, appointments, timeOffs] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 }, select: { slotStepMinutes: true, minLeadMinutes: true } }),
    prisma.service.aggregate({ where: { isActive: true }, _min: { durationMinutes: true } }),
    prisma.workingHours.findMany({
      where: { dayOfWeek, isOff: false, ...activeBarber },
      select: { barberId: true, startTime: true, endTime: true },
    }),
    prisma.appointment.findMany({
      where: { status: "SCHEDULED", startsAt: { lt: dayEnd }, endsAt: { gt: dayStart }, ...activeBarber },
      select: { barberId: true, startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart }, ...activeBarber },
      select: { barberId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const slotStepMinutes = settings?.slotStepMinutes ?? DEFAULT_SLOT_STEP;
  const minLeadMinutes = settings?.minLeadMinutes ?? DEFAULT_MIN_LEAD;
  const durationMinutes = shortest._min.durationMinutes ?? slotStepMinutes;

  const byBarber = new Map<string, BarberDay>();
  for (const row of hours) {
    const day = byBarber.get(row.barberId) ?? { workingIntervals: [], busy: [] };
    day.workingIntervals.push({ startMinutes: parseTime(row.startTime), endMinutes: parseTime(row.endTime) });
    byBarber.set(row.barberId, day);
  }
  for (const row of [...appointments, ...timeOffs]) {
    // Bugün çalışmayan berberin doluluğu sayıma hiç girmez.
    const day = byBarber.get(row.barberId);
    if (day) day.busy.push({ start: row.startsAt, end: row.endsAt });
  }

  return countOpenSlots({
    dayStart,
    barbers: [...byBarber.values()],
    durationMinutes,
    slotStepMinutes,
    minLeadMinutes,
    now,
  });
}
