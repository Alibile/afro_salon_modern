import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Bağlantı adresi `DATABASE_URL`'den okunur. Netlify Database kurulduğunda
 * platform adresi `NETLIFY_DB_URL` adıyla verir (eski Netlify DB eklentisi
 * `NETLIFY_DATABASE_URL` derdi); ayrıca kopyalamak gerekmesin diye bunlara
 * düşülür. Prisma CLI (`migrate`, `seed`) bu dosyayı
 * kullanmaz, `prisma.config.ts` üzerinden hep `DATABASE_URL` ister.
 */
function connectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.NETLIFY_DB_URL?.trim() ||
    process.env.NETLIFY_DATABASE_URL?.trim()
  );
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
