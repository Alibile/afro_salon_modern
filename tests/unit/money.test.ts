import { describe, it, expect } from "vitest";
import { formatKurus } from "@/lib/money";

describe("formatKurus", () => {
  it("formats with Turkish separators", () => {
    expect(formatKurus(40000)).toBe("400,00 ₺");
    expect(formatKurus(125050)).toBe("1.250,50 ₺");
    expect(formatKurus(0)).toBe("0,00 ₺");
  });
});
