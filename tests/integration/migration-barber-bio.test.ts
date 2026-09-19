import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";

/**
 * Göç (`20260919160000_barber_bio_i18n`) berber biyografisini
 * `{tr: <eski>}` yapıyor. Task 4'ün göç testiyle (`migration-i18n.test.ts`)
 * aynı desen: göç SQL'inin **dosyadaki metni** okunur, tablo adı ayrı bir
 * şemaya yönlendirilir ve aynı ifadeler göç öncesi biçimindeki satırlar
 * üzerinde çalıştırılır. Gerçek tablolara hiç dokunulmaz.
 *
 * Buradaki asıl soru `coalesce`: eski `bio` sütunu `NULL` olabiliyordu ve
 * `jsonb_build_object('tr', NULL)` `{"tr": null}` üretirdi — `asI18nText`
 * bunu boş metne indirse de sütun geçersiz bir üç dilli nesne taşırdı.
 */
const SCHEMA = "barber_bio_migration_test";
const MIGRATION = path.join(process.cwd(), "prisma/migrations/20260919160000_barber_bio_i18n/migration.sql");

/** Göç SQL'ini, `public` yerine kendi test şemamızdaki tabloya yönlendirir. */
function scopedStatements(): string[] {
  const sql = readFileSync(MIGRATION, "utf8").replaceAll(`"Barber"`, `"${SCHEMA}"."Barber"`);
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}

type Row = Record<string, unknown>;

describe("20260919160000_barber_bio_i18n göçü", () => {
  let rows: Row[];

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${SCHEMA}"`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${SCHEMA}"."Barber" (id TEXT PRIMARY KEY, "bio" TEXT, "photoKey" TEXT NOT NULL DEFAULT '')`,
    );
    // Göç öncesi veri: dolu metin, tırnak içeren metin, boş metin ve NULL.
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${SCHEMA}"."Barber" (id, "bio") VALUES
         ('b-dolu', 'Fade ve tasarım kesim uzmanı'),
         ('b-tirnak', 'Örgü, twist ve line-up''ın ustası'),
         ('b-bos', ''),
         ('b-null', NULL)`,
    );

    for (const statement of scopedStatements()) await prisma.$executeRawUnsafe(statement);
    rows = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "${SCHEMA}"."Barber" ORDER BY id`);
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  });

  it("biyografiyi {tr: <eski>} olarak taşır", () => {
    expect(rows.find((r) => r.id === "b-dolu")!.bioI18n).toEqual({ tr: "Fade ve tasarım kesim uzmanı" });
    expect(rows.find((r) => r.id === "b-tirnak")!.bioI18n).toEqual({ tr: "Örgü, twist ve line-up'ın ustası" });
  });

  it("boş ve yazılmamış (NULL) biyografiyi boş Türkçe metne indirir", () => {
    expect(rows.find((r) => r.id === "b-bos")!.bioI18n).toEqual({ tr: "" });
    expect(rows.find((r) => r.id === "b-null")!.bioI18n).toEqual({ tr: "" });
  });

  it("eski tek dilli sütunu düşürür", () => {
    for (const row of rows) expect(row).not.toHaveProperty("bio");
  });
});
