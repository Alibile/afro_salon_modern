import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";
import { runSeed } from "../../prisma/seed";

describe("runSeed", () => {
  it("eski seed/ yer tutucu fotoğraf anahtarını landing/ ile değiştirir, gerçek yüklenmiş anahtara dokunmaz", async () => {
    // Kwame: Task 1 öncesi seed'den kalma "seed/" yer tutucusu — güncellenmeli.
    const kwameUser = await prisma.user.create({
      data: { name: "Kwame Mensah", email: "kwame@afrosalon.local", passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: kwameUser.id, photoKey: "seed/kwame.jpg" } });

    // Amara: panelden gerçekten yüklenmiş bir fotoğrafı var — asla üzerine yazılmamalı.
    const amaraUser = await prisma.user.create({
      data: { name: "Amara Diallo", email: "amara@afrosalon.local", passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: amaraUser.id, photoKey: "barbers/real.jpg" } });

    await runSeed(prisma);

    const kwame = await prisma.barber.findUniqueOrThrow({ where: { userId: kwameUser.id } });
    const amara = await prisma.barber.findUniqueOrThrow({ where: { userId: amaraUser.id } });
    expect(kwame.photoKey).toBe("landing/team-2.jpg");
    expect(amara.photoKey).toBe("barbers/real.jpg");
  });

  it("berber hiç yoksa varsayılan landing/ anahtarıyla oluşturur", async () => {
    await runSeed(prisma);

    const kwameUser = await prisma.user.findUniqueOrThrow({ where: { email: "kwame@afrosalon.local" } });
    const kwame = await prisma.barber.findUniqueOrThrow({ where: { userId: kwameUser.id } });
    expect(kwame.photoKey).toBe("landing/team-2.jpg");
  });

  it("iki kez çalıştırıldığında idempotenttir (kayıtları çoğaltmaz)", async () => {
    await runSeed(prisma);
    await runSeed(prisma);

    const barberCount = await prisma.barber.count();
    const serviceCount = await prisma.service.count();
    expect(barberCount).toBe(2);
    expect(serviceCount).toBe(4);
  });
});
