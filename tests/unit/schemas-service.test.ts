import { describe, it, expect } from "vitest";
import { serviceSchema } from "@/schemas/service";

describe("serviceSchema", () => {
  it("accepts valid", () => {
    expect(serviceSchema.safeParse({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }).success).toBe(true);
  });
  it("rejects duration not multiple of 5", () => {
    const r = serviceSchema.safeParse({ name: "Saç", durationMinutes: 32, priceLira: 400, sortOrder: 1 });
    expect(r.success).toBe(false);
  });
  it("coerces strings from FormData", () => {
    const r = serviceSchema.safeParse({ name: "Saç", durationMinutes: "45", priceLira: "550.5", sortOrder: "2" });
    expect(r.success && r.data.priceLira).toBe(550.5);
  });
});
