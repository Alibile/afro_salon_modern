import { addMinutes } from "./time";

export type WorkingInterval = { startMinutes: number; endMinutes: number };
export type Interval = { start: Date; end: Date };

export type AvailabilityInput = {
  /** Dükkan saat diliminde günün 00:00'ı (UTC instant) */
  dayStart: Date;
  /** Gün içi çalışma aralıkları, dakika cinsinden (öğle arası için birden fazla) */
  workingIntervals: WorkingInterval[];
  /** Mevcut randevular + izinler */
  busy: Interval[];
  durationMinutes: number;
  slotStepMinutes: number;
  minLeadMinutes: number;
  now: Date;
};

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Gün baştan sona izinli mi? Berberin o günkü **bütün** çalışma aralıkları bir
 * izinle örtülüyse gün "dolu" değil **kapalı**dır: berber salonda yok, saat
 * açılması da beklenmez. Ayrım ziyaretçi yüzünde görünür — çip "Dolu" yerine
 * "Kapalı" der, sihirbaz "bu gün kapalıyız" cümlesini basar.
 *
 * Saf fonksiyon: hem tek günü hesaplayan `getAvailability` hem de bütün
 * pencereyi özetleyen `getDaySummaries` aynı kuralı buradan okur, yoksa iki yer
 * aynı gün için farklı şey söylerdi.
 */
export function isFullyOff(dayStart: Date, workingIntervals: WorkingInterval[], off: Interval[]): boolean {
  if (workingIntervals.length === 0) return false;
  return workingIntervals.every((w) =>
    off.some(
      (o) =>
        o.start.getTime() <= addMinutes(dayStart, w.startMinutes).getTime() &&
        o.end.getTime() >= addMinutes(dayStart, w.endMinutes).getTime(),
    ),
  );
}

export function computeSlots(input: AvailabilityInput): Date[] {
  const { dayStart, workingIntervals, busy, durationMinutes, slotStepMinutes, minLeadMinutes, now } = input;
  const earliest = addMinutes(now, minLeadMinutes);
  const slots: Date[] = [];

  for (const w of workingIntervals) {
    // Döngü koşulu (m + durationMinutes <= w.endMinutes) slotun çalışma
    // aralığı içinde bittiğini zaten garanti eder.
    for (let m = w.startMinutes; m + durationMinutes <= w.endMinutes; m += slotStepMinutes) {
      const start = addMinutes(dayStart, m);
      const end = addMinutes(start, durationMinutes);
      if (start < earliest) continue;
      const candidate = { start, end };
      if (busy.some((b) => overlaps(candidate, b))) continue;
      slots.push(start);
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}
