import { describe, it, expect } from "vitest";
import {
  filterByTag,
  paginate,
  nextIndex,
  prevIndex,
  normalizeTags,
  distributeColumns,
} from "@/lib/gallery-utils";

const photos = [
  { id: "1", tags: ["Fade", "Line-up"] },
  { id: "2", tags: ["Afro"] },
  { id: "3", tags: ["Fade", "Sakal"] },
  { id: "4", tags: [] },
];

describe("filterByTag", () => {
  it("etiket yoksa tüm fotoğrafları döner", () => {
    expect(filterByTag(photos, null)).toHaveLength(4);
    expect(filterByTag(photos, "")).toHaveLength(4);
  });

  it("etikete göre süzer", () => {
    expect(filterByTag(photos, "Fade").map((p) => p.id)).toEqual(["1", "3"]);
    expect(filterByTag(photos, "Afro").map((p) => p.id)).toEqual(["2"]);
  });

  it("bilinmeyen etikette boş liste döner", () => {
    expect(filterByTag(photos, "Yok")).toEqual([]);
  });

  it("sırayı korur", () => {
    expect(filterByTag(photos, "Fade")[0].id).toBe("1");
  });
});

describe("paginate", () => {
  const list = Array.from({ length: 25 }, (_, i) => i);

  it("ilk sayfada yalnızca ilk parçayı döner", () => {
    expect(paginate(list, 1, 12)).toHaveLength(12);
    expect(paginate(list, 1, 12).at(-1)).toBe(11);
  });

  it("sayfa arttıkça birikimli (kümülatif) döner", () => {
    expect(paginate(list, 2, 12)).toHaveLength(24);
    expect(paginate(list, 3, 12)).toHaveLength(25);
  });

  it("liste sayfa boyutundan küçükse hepsini döner", () => {
    expect(paginate([1, 2, 3], 1, 12)).toEqual([1, 2, 3]);
  });

  it("sayfa 1'in altına düşmez", () => {
    expect(paginate(list, 0, 12)).toHaveLength(12);
    expect(paginate(list, -5, 12)).toHaveLength(12);
  });
});

describe("nextIndex / prevIndex", () => {
  it("ileri gider ve başa döner", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
  });

  it("geri gider ve sona döner", () => {
    expect(prevIndex(2, 3)).toBe(1);
    expect(prevIndex(0, 3)).toBe(2);
  });

  it("tek elemanlı listede yerinde kalır", () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(prevIndex(0, 1)).toBe(0);
  });

  it("boş listede 0 döner", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(0, 0)).toBe(0);
  });
});

describe("normalizeTags", () => {
  it("virgülle ayrılmış metni listeye çevirir ve kırpar", () => {
    expect(normalizeTags(" Fade , Afro ")).toEqual(["Fade", "Afro"]);
  });

  it("boş parçaları atar", () => {
    expect(normalizeTags("Fade,,  ,Afro,")).toEqual(["Fade", "Afro"]);
  });

  it("büyük/küçük harf farkına bakmadan tekilleştirir, ilk yazımı korur", () => {
    expect(normalizeTags("Fade, fade, FADE")).toEqual(["Fade"]);
  });

  it("dizi girdisini de kabul eder", () => {
    expect(normalizeTags([" Sakal ", "Sakal", "Twist"])).toEqual(["Sakal", "Twist"]);
  });

  it("boş girdide boş liste döner", () => {
    expect(normalizeTags("")).toEqual([]);
    expect(normalizeTags([])).toEqual([]);
    expect(normalizeTags("  ,  ")).toEqual([]);
  });

  it("iç boşlukları tek boşluğa indirir", () => {
    expect(normalizeTags("Line   up, Örgü")).toEqual(["Line up", "Örgü"]);
  });
});

describe("distributeColumns", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("8 öğeyi 3 sütuna [3,3,2] olarak dağıtır", () => {
    const cols = distributeColumns(items, 3);
    expect(cols).toHaveLength(3);
    expect(cols.map((c) => c.length)).toEqual([3, 3, 2]);
  });

  it("soldan sağa, yukarıdan aşağı okunacak biçimde sırayı korur", () => {
    // Satır satır okunduğunda özgün sıra geri gelmeli.
    const cols = distributeColumns(items, 3);
    expect(cols[0]).toEqual(["a", "d", "g"]);
    expect(cols[1]).toEqual(["b", "e", "h"]);
    expect(cols[2]).toEqual(["c", "f"]);
  });

  it("her sütun kendi içinde özgün sırayı korur", () => {
    const cols = distributeColumns(items, 4);
    expect(cols.map((c) => c.length)).toEqual([2, 2, 2, 2]);
    expect(cols[3]).toEqual(["d", "h"]);
  });

  it("öğe sayısı sütun sayısından azsa boş sütunlar yine de döner", () => {
    const cols = distributeColumns(["a", "b"], 4);
    expect(cols).toHaveLength(4);
    expect(cols[2]).toEqual([]);
    expect(cols[3]).toEqual([]);
  });

  it("boş listede sütunlar boş döner", () => {
    expect(distributeColumns([], 2)).toEqual([[], []]);
  });

  it("hiçbir öğeyi düşürmez ya da çoğaltmaz", () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(distributeColumns(items, n).flat().sort()).toEqual([...items].sort());
    }
  });
});
