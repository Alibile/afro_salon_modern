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
  minLeadMinutes: number;
  now: Date;
};

/**
 * Çalışma aralıklarından doluluğu düşer; geriye o berberin gerçekten boş
 * pencereleri kalır. Randevu sihirbazı buna ihtiyaç duymaz (o, sabit bir
 * ızgaranın üstünde dolu adayları eler), sayaç duyar: kapasite dolu bloğun
 * **bittiği yerden** yeniden sayılmalı, ızgaranın kaldığı yerden değil.
 */
export function freeWindows(working: WorkingInterval[], busy: WorkingInterval[]): WorkingInterval[] {
  const blocks = [...busy].sort((a, b) => a.startMinutes - b.startMinutes);
  const windows: WorkingInterval[] = [];
  for (const w of working) {
    let start = w.startMinutes;
    for (const b of blocks) {
      if (b.endMinutes <= start || b.startMinutes >= w.endMinutes) continue;
      if (b.startMinutes > start) windows.push({ startMinutes: start, endMinutes: b.startMinutes });
      start = Math.max(start, b.endMinutes);
      if (start >= w.endMinutes) break;
    }
    if (start < w.endMinutes) windows.push({ startMinutes: start, endMinutes: w.endMinutes });
  }
  return windows;
}

/**
 * Bugün **kaç randevu daha alınabileceği**. Ziyaretçiye söylenen sayı budur:
 * birbiriyle çakışmayan, gerçekten satılabilir randevu adedi.
 *
 * İlk hâl 15 dakikalık başlangıç saatlerini sayıyordu ("83 uygun saat") —
 * teknik olarak doğru ama insana anlamsız bir sayı: aynı saatin 45 dakikalık
 * paketi üç kez sayılıyordu. Şimdi her boş pencere kendi içinde paket süresine
 * bölünüyor (`computeSlots`, adım = süre), yani pencere başına
 * `floor(boş süre / süre)` kadar randevu.
 *
 * Saf fonksiyon: veritabanına bakmaz, birim testlerle ölçülebilir.
 */
export function countOpenSlots(input: SlotCountInput): number {
  const { dayStart, barbers, durationMinutes, minLeadMinutes, now } = input;
  // Sıfır/negatif süre `computeSlots` döngüsünü ilerletmezdi; veri bozuksa sayaç susar.
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 0;
  const toMinutes = (instant: Date) => (instant.getTime() - dayStart.getTime()) / 60_000;
  return barbers.reduce((total, barber) => {
    const busy = barber.busy.map((b) => ({ startMinutes: toMinutes(b.start), endMinutes: toMinutes(b.end) }));
    return (
      total +
      computeSlots({
        dayStart,
        workingIntervals: freeWindows(barber.workingIntervals, busy),
        // Doluluk yukarıda pencerelerden düşüldü; burada ikinci kez elenmez.
        busy: [],
        durationMinutes,
        slotStepMinutes: durationMinutes,
        minLeadMinutes,
        now,
      }).length
    );
  }, 0);
}

/**
 * Ana sayfanın hero satırındaki "bugün {n} boş randevu" sayısı.
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
    minLeadMinutes,
    now,
  });
}
