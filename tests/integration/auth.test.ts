import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerCustomer } from "@/actions/auth";

describe("registerCustomer", () => {
  it("creates CUSTOMER with hashed password and lowercased email", async () => {
    const r = await registerCustomer({ name: "Ali Veli", email: "Ali@Test.com", phone: "0555", password: "Sifre123!" });
    expect(r.ok).toBe(true);
    const u = await prisma.user.findUnique({ where: { email: "ali@test.com" } });
    expect(u?.role).toBe("CUSTOMER");
    expect(await bcrypt.compare("Sifre123!", u!.passwordHash)).toBe(true);
  });

  it("rejects duplicate email", async () => {
    await registerCustomer({ name: "Ali Veli", email: "ali@test.com", password: "Sifre123!" });
    const r = await registerCustomer({ name: "Ali Veli", email: "ali@test.com", password: "Sifre123!" });
    expect(r).toEqual({ ok: false, error: "Bu e-posta ile zaten bir hesap var" });
  });

  it("rejects invalid input", async () => {
    const r = await registerCustomer({ name: "A", email: "x", password: "1" });
    expect(r.ok).toBe(false);
  });
});
