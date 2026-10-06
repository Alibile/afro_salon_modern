import { describe, it, expect } from "vitest";
import { wizardStep, servicesDoneAfterChange } from "@/lib/booking-steps";

/**
 * Sihirbazın adım kuralı (Tur 8 düzeltmesi): hizmet adımı seçimle değil
 * **tamamlanmayla** kapanır, yoksa ikinci hizmet eklenemezdi. Tek hizmetli
 * salonda ilk dokunuş yeter; birden çok hizmette "Devam" gerekir.
 */
describe("wizardStep", () => {
  it("hizmet seçilmemişse ya da adım tamamlanmamışsa 1", () => {
    expect(wizardStep({ serviceIds: [], servicesDone: false, barberId: null })).toBe(1);
    expect(wizardStep({ serviceIds: ["a"], servicesDone: false, barberId: null })).toBe(1);
    expect(wizardStep({ serviceIds: [], servicesDone: true, barberId: "b" })).toBe(1);
  });
  it("hizmet tamamlandı, berber yoksa 2; berber varsa 3", () => {
    expect(wizardStep({ serviceIds: ["a"], servicesDone: true, barberId: null })).toBe(2);
    expect(wizardStep({ serviceIds: ["a", "c"], servicesDone: true, barberId: "b" })).toBe(3);
  });
});

describe("servicesDoneAfterChange", () => {
  it("tek hizmetli salonda ilk seçim adımı kapatır", () => {
    expect(servicesDoneAfterChange(1, ["a"])).toBe(true);
    expect(servicesDoneAfterChange(1, [])).toBe(false);
  });
  it("birden çok hizmette seçim adımı açık bırakır", () => {
    expect(servicesDoneAfterChange(2, ["a"])).toBe(false);
    expect(servicesDoneAfterChange(3, ["a", "b"])).toBe(false);
  });
});
