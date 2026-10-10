import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * `prisma generate` veritabanına bağlanmaz ama bu dosya yine de yüklenir;
 * Prisma'nın `env()` yardımcısı değişken yoksa fırlatır ve derleme (Netlify,
 * CI) daha ilk adımda düşer. Bu yüzden adres elle okunur: `DATABASE_URL`
 * yoksa Netlify Database'in verdiği `NETLIFY_DB_URL` (ya da eski adıyla
 * `NETLIFY_DATABASE_URL`), o da yoksa açıkça
 * geçersiz bir yer tutucu. `migrate`/`seed` gibi bağlanan komutlar yer
 * tutucuda "unset" hostuyla anlaşılır biçimde hata verir, sessizce yanlış
 * bir veritabanına gitmez.
 */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.NETLIFY_DB_URL?.trim() ||
  process.env.NETLIFY_DATABASE_URL?.trim() ||
  "postgresql://unset:unset@database-url-unset.invalid:5432/unset";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
