import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { GALLERY_TAGS } from "@/lib/gallery-tags";

/**
 * Göç (`20260919101500_i18n_content`) veri taşıyor: tek dilli sütunları
 * `{tr: <eski>}` yapıyor ve galeri etiketlerini Türkçe görünen addan anahtara
 * çeviriyor. Bu dönüşümlerin testi yoksa yanlışlığı ancak üretimde, veri
 * kaybıyla görülür — üstelik göç bir kez çalıştığı için geri alınamaz.
 *
 * Test, göç SQL'inin **dosyadaki metnini** okur ve tablo adlarını ayrı bir
 * şemaya yönlendirip aynı ifadeleri göç öncesi biçimindeki satırlar üzerinde
 * çalıştırır. Böylece `CASE` eşleşmeleri ya da `jsonb_build_object` çağrıları
 * dosyada değiştiğinde test onları görür; gerçek tablolara hiç dokunmaz.
 */
const SCHEMA = "i18n_migration_test";
const MIGRATION = path.join(process.cwd(), "prisma/migrations/20260919101500_i18n_content/migration.sql");
const TABLES = ["Settings", "Service", "GalleryPhoto"] as const;

/** Göç SQL'ini, `public` yerine kendi test şemamızdaki tablolara yönlendirir. */
function scopedStatements(): string[] {
  let sql = readFileSync(MIGRATION, "utf8");
  for (const table of TABLES) sql = sql.replaceAll(`"${table}"`, `"${SCHEMA}"."${table}"`);
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}

/** Tur 4'teki (göç öncesi) sütunlar; göç yalnızca bunlara dokunuyor. */
const OLD_SETTINGS_COLUMNS = [
  "aboutTitle",
  "aboutText",
  "whyUs1Title",
  "whyUs1Text",
  "whyUs2Title",
  "whyUs2Text",
  "whyUs3Title",
  "whyUs3Text",
];

/** Tur 4'te veritabanında duran görünen etiket adları → yeni anahtarlar. */
const OLD_TAG_LABELS: Record<string, string> = {
  "Low Taper Fade": "low-taper-fade",
  "Taper Fade": "taper-fade",
  "Skin Fade": "skin-fade",
  "Buzz Cut": "buzz-cut",
  "Line-up": "line-up",
  Kıvırcık: "curly",
  "Düz Saç": "straight",
  "Kısa Saç": "short",
  "Textured Fringe": "textured-fringe",
  Afro: "afro",
  Örgü: "braids",
  Twist: "twist",
  Sakal: "beard",
};

type Row = Record<string, unknown>;

describe("20260919101500_i18n_content göçü", () => {
  let settings: Row;
  let services: Row[];
  let photos: Row[];

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${SCHEMA}"`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${SCHEMA}"."Settings" (id INTEGER PRIMARY KEY, ${OLD_SETTINGS_COLUMNS.map(
        (c) => `"${c}" TEXT NOT NULL DEFAULT ''`,
      ).join(", ")})`,
    );
    await prisma.$executeRawUnsafe(`CREATE TABLE "${SCHEMA}"."Service" (id TEXT PRIMARY KEY, "name" TEXT NOT NULL)`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${SCHEMA}"."GalleryPhoto" (id TEXT PRIMARY KEY, "caption" TEXT NOT NULL DEFAULT '', "tags" TEXT[] NOT NULL DEFAULT '{}')`,
    );

    // Göç öncesi veri: tırnak içeren metin, boş metin, her eski etiket adı,
    // serbest etiketler ve sırası önemli bir dizi.
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SCHEMA}"."Settings" (id, ${OLD_SETTINGS_COLUMNS.map((c) => `"${c}"`).join(", ")})
       VALUES (1, 'Benzersiz bir deneyim', 'İstanbul''un kalbinde', 'Usta berberler', '', 'Premium ürünler', 'Test edilmiş', 'Hijyen', 'Sterilize')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SCHEMA}"."Service" (id, "name") VALUES ('s1', 'Saç Kesimi'), ('s2', 'Örgü / Twist')`,
    );
    const labels = Object.keys(OLD_TAG_LABELS);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SCHEMA}"."GalleryPhoto" (id, "caption", "tags") VALUES
         ('p-all', 'Hepsi', ARRAY[${labels.map((l) => `'${l}'`).join(", ")}]),
         ('p-mixed', 'Karışık', ARRAY['Fade', 'Sakal', 'Dalga Deseni']),
         ('p-order', '', ARRAY['Sakal', 'Afro', 'Skin Fade']),
         ('p-empty', '', ARRAY[]::TEXT[])`,
    );

    for (const statement of scopedStatements()) await prisma.$executeRawUnsafe(statement);

    [settings] = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "${SCHEMA}"."Settings"`);
    services = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "${SCHEMA}"."Service" ORDER BY id`);
    photos = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "${SCHEMA}"."GalleryPhoto" ORDER BY id`);
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  });

  it("site metinlerini {tr: <eski>} olarak taşır, boş alanı da taşır", () => {
    expect(settings.aboutTitleI18n).toEqual({ tr: "Benzersiz bir deneyim" });
    expect(settings.aboutTextI18n).toEqual({ tr: "İstanbul'un kalbinde" });
    expect(settings.whyUs1TitleI18n).toEqual({ tr: "Usta berberler" });
    expect(settings.whyUs1TextI18n).toEqual({ tr: "" });
    expect(settings.whyUs3TextI18n).toEqual({ tr: "Sterilize" });
  });

  it("eski tek dilli sütunları düşürür", () => {
    for (const column of OLD_SETTINGS_COLUMNS) expect(settings).not.toHaveProperty(column);
    expect(services[0]).not.toHaveProperty("name");
    expect(photos[0]).not.toHaveProperty("caption");
  });

  it("hizmet adını ve galeri başlığını taşır", () => {
    expect(services.map((s) => s.nameI18n)).toEqual([{ tr: "Saç Kesimi" }, { tr: "Örgü / Twist" }]);
    expect(photos.find((p) => p.id === "p-all")!.captionI18n).toEqual({ tr: "Hepsi" });
    expect(photos.find((p) => p.id === "p-order")!.captionI18n).toEqual({ tr: "" });
  });

  it("eski Türkçe etiket adlarının **hepsini** anahtara çevirir", () => {
    const converted = photos.find((p) => p.id === "p-all")!.tags as string[];
    expect(converted).toEqual(Object.values(OLD_TAG_LABELS));
    // Dönüşen her anahtar gerçekten sabit listede olmalı.
    for (const tag of converted) expect(GALLERY_TAGS).toContain(tag);
    // Liste eksiksiz: sabit listedeki her anahtarın bir eski adı vardı.
    expect(new Set(converted)).toEqual(new Set(GALLERY_TAGS));
  });

  it("serbest etiketleri olduğu gibi bırakır", () => {
    expect(photos.find((p) => p.id === "p-mixed")!.tags).toEqual(["Fade", "beard", "Dalga Deseni"]);
  });

  it("dizi sırasını korur", () => {
    expect(photos.find((p) => p.id === "p-order")!.tags).toEqual(["beard", "afro", "skin-fade"]);
  });

  it("etiketsiz satırı boş dizi olarak bırakır", () => {
    expect(photos.find((p) => p.id === "p-empty")!.tags).toEqual([]);
  });
});

describe("göç sonrası gerçek veritabanı", () => {
  it("hiçbir galeri satırında eski Türkçe etiket adı kalmamıştır", async () => {
    const { runSeed } = await import("../../prisma/seed");
    await runSeed(prisma);
    const rows = await prisma.galleryPhoto.findMany({ select: { tags: true } });
    const used = rows.flatMap((r) => r.tags);
    expect(used.length).toBeGreaterThan(0);
    for (const tag of used) expect(Object.keys(OLD_TAG_LABELS)).not.toContain(tag);
  });
});
