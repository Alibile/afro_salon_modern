import { describe, it, expect } from "vitest";
import { ok, fail } from "@/lib/action-result";

describe("action-result", () => {
  it("ok wraps data", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });
  it("fail wraps error message", () => {
    expect(fail("Hata")).toEqual({ ok: false, error: "Hata" });
  });
});
