import { describe, it, expect, vi } from "vitest";

vi.mock("node:fs", () => ({ default: { existsSync: vi.fn(() => false) } }));
vi.mock("react-dom", () => ({ preload: vi.fn() }));

import fs from "node:fs";
import { preload } from "react-dom";
import { heroSources, preloadHero } from "@/lib/hero-image";

const EMPTY = { hero: null, heroMobile: null, about: null };
const KEY = "uploads/site/6f1b2c3d-1111-4222-8333-444455556666.jpg";

/**
 * Hero fotoğrafı önce panelden yüklenen yuvadan, o boşsa `public/landing/`
 * dosyasından gelir; ikisi de yoksa `null` (desenli yer tutucu). Yuva
 * fotoğrafının ölçüsü veritabanındaki kayıttır, dosyanınki sabit kırpım.
 */
describe("heroSources", () => {
  it("yuva doluysa yuvanın fotoğrafını ve ölçüsünü kullanır", () => {
    const { wide, tall } = heroSources({ ...EMPTY, hero: { storageKey: KEY, width: 2400, height: 1600 } }, "alt");
    expect(wide?.src).toContain(encodeURIComponent("/" + KEY));
    expect(wide?.width).toBe(2400);
    expect(tall).toBeNull();
  });

  it("yuva boşsa diskteki dosyaya düşer, o da yoksa null (Review Focus 4)", () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const { wide, tall } = heroSources(EMPTY, "alt");
    expect(wide?.src).toContain(encodeURIComponent("/landing/hero.jpg"));
    expect(tall).toBeNull();
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(heroSources(EMPTY, "alt")).toEqual({ wide: null, tall: null });
  });

  it("preloadHero yalnızca var olan kırpımları duyurur, iki kırpımda media yazar", () => {
    vi.mocked(preload).mockClear();
    preloadHero({ ...EMPTY, hero: { storageKey: KEY, width: 2400, height: 1600 }, heroMobile: { storageKey: KEY.replace(".jpg", ".webp"), width: 1200, height: 1500 } });
    expect(preload).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(preload).mock.calls;
    expect(calls[0][1]).toMatchObject({ as: "image", fetchPriority: "high", media: "(min-width: 768px)" });
    expect(calls[1][1]).toMatchObject({ media: "(max-width: 767px)" });
    vi.mocked(preload).mockClear();
    preloadHero(EMPTY);
    expect(preload).not.toHaveBeenCalled();
  });
});
