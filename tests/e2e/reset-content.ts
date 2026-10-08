import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * E2e veritabanı entegrasyon testleriyle paylaşılır ve içerik tabloları seed
 * tarafından yalnızca boşken doldurulur: bir önceki koşudan kalan panel
 * içeriği, SSS ya da görsel yuvası ana sayfayı değiştirirdi. Seed'den önce
 * üçü de sıfırlanır; seed altı soruyu yeniden yazar.
 */
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  await prisma.contentBlock.deleteMany();
  await prisma.siteImage.deleteMany();
  await prisma.faqItem.deleteMany();
}
main().finally(() => prisma.$disconnect());
