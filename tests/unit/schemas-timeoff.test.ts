import { describe, it, expect } from "vitest";
import { timeOffSchema } from "@/schemas/timeoff";

/**
 * İzin tek gün (tüm gün ya da saatli) ya da tarih aralığı (yalnızca tüm gün)
 * olabilir. `endDate` isteğe bağlıdır; verilince başlangıçtan önce olamaz,
 * 60 günü aşamaz ve saatli izinle birleşemez.
 */
describe("timeOffSchema", () => {
  const base = { barberId: "b1", date: "2026-10-06", allDay: true as const };

  it("bitiş tarihi olmadan tek gün geçer", () => {
    expect(timeOffSchema.safeParse(base).success).toBe(true);
  });

  it("aralık: bitiş başlangıca eşit ya da sonra olmalı", () => {
    expect(timeOffSchema.safeParse({ ...base, endDate: "2026-10-10" }).success).toBe(true);
    expect(timeOffSchema.safeParse({ ...base, endDate: "2026-10-06" }).success).toBe(true);
    const r = timeOffSchema.safeParse({ ...base, endDate: "2026-10-05" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.endBeforeStart");
  });

  it("aralık en fazla 60 gün", () => {
    expect(timeOffSchema.safeParse({ ...base, endDate: "2026-12-05" }).success).toBe(true);
    const r = timeOffSchema.safeParse({ ...base, endDate: "2026-12-06" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.rangeTooLong");
  });

  it("saatli izin aralıkla birleşemez", () => {
    const r = timeOffSchema.safeParse({ ...base, allDay: false, startTime: "12:00", endTime: "13:00", endDate: "2026-10-08" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.rangeNeedsAllDay");
  });

  it("boş bitiş tarihi yok sayılır", () => {
    const r = timeOffSchema.safeParse({ ...base, endDate: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.endDate).toBeUndefined();
  });
});
