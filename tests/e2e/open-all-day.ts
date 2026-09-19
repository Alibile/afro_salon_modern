import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.workingHours.updateMany({
    data: { isOff: false, startTime: "00:00", endTime: "23:59" },
  });
  await prisma.appointment.updateMany({
    where: { status: "SCHEDULED" },
    data: { status: "CANCELLED", cancelledBy: "STAFF" },
  });
  // Ayarlar satırını entegrasyon testleri boş alanlarla bırakabiliyor
  // (`resetDb` tabloyu sıfırlar, seed ise adres/telefonu yalnızca satırı ilk
  // kez yaratırken yazar). Adres boşken ana sayfadaki harita kutusu hiç
  // basılmaz; e2e o kutuyu sınadığı için burada garantiye alınır.
  await prisma.settings.update({
    where: { id: 1 },
    data: { address: "İstanbul", phone: "+90 555 000 00 00" },
  });
  console.log("E2E: berberler tüm gün açık, bekleyen randevular iptal edildi, iletişim bilgileri dolduruldu.");
}

main().finally(() => prisma.$disconnect());
