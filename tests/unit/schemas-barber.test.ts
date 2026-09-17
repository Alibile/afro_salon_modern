import { describe, it, expect } from "vitest";
import { createBarberSchema, workingHoursSchema } from "@/schemas/barber";

describe("barber schemas", () => {
  it("requires photoKey", () => {
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "" }).success).toBe(false);
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" }).success).toBe(true);
  });
  it("working hours: 7 days, end after start unless off", () => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0, startTime: "09:00", endTime: "19:00" }));
    expect(workingHoursSchema.safeParse({ days }).success).toBe(true);
    days[1] = { dayOfWeek: 1, isOff: false, startTime: "19:00", endTime: "09:00" };
    expect(workingHoursSchema.safeParse({ days }).success).toBe(false);
  });
});
