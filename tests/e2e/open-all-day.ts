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
  console.log("E2E: berberler tüm gün açık, bekleyen randevular iptal edildi.");
}

main().finally(() => prisma.$disconnect());
