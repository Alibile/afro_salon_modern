import { describe, it, expect } from "vitest";
import { ok, fail } from "@/lib/action-result";

describe("action-result", () => {
  it("ok wraps data", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });
  it("fail hata anahtarını taşır", () => {
    expect(fail("errors.slotTaken")).toEqual({ ok: false, error: "errors.slotTaken" });
  });
  // Yer tutucusuz anahtarlarda `params` hiç yazılmaz: integration testleri
  // sonucun tamamını `toEqual` ile karşılaştırıyor.
  it("params yalnızca verilirse eklenir", () => {
    expect(fail("errors.cancelWindow", { minutes: 120 })).toEqual({
      ok: false,
      error: "errors.cancelWindow",
      params: { minutes: 120 },
    });
    expect(Object.hasOwn(fail("errors.notAllowed"), "params")).toBe(false);
  });
});
