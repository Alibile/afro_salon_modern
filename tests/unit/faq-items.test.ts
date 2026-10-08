import { describe, it, expect } from "vitest";
import { singlePackage } from "@/lib/package";

const service = (id: string) => ({ id, durationMinutes: 45, priceKurus: 70000 });

describe("singlePackage", () => {
  it("tam olarak bir aktif hizmet varsa onu döner", () => {
    expect(singlePackage([service("a")])).toEqual(service("a"));
  });

  it("sıfır ya da birden çok hizmette null döner", () => {
    expect(singlePackage([])).toBeNull();
    expect(singlePackage([service("a"), service("b")])).toBeNull();
  });
});
