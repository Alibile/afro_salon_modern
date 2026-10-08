import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  // Veritabanı e2e ile paylaşılır: son testin bıraktığı satırlar (içerik, SSS)
  // seed'in "yalnızca boş tabloya yaz" kuralını boşa çıkarırdı.
  await resetDb();
  await prisma.$disconnect();
});
