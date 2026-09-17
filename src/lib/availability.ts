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
