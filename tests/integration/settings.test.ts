import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { updateSettings } from "@/actions/settings";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };

describe("updateSettings", () => {
  it("updates the single row", async () => {
    const r = await updateSettings({ shopName: "Afro Salon", address: "Kadıköy", phone: "0555", cancellationWindowMinutes: 60, minLeadMinutes: 30, slotStepMinutes: 30, notifyBarberOnBooking: false }, { actor: admin });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.cancellationWindowMinutes).toBe(60);
    expect(s?.slotStepMinutes).toBe(30);
    expect(s?.notifyBarberOnBooking).toBe(false);
  });
  it("rejects invalid slot step", async () => {
    const r = await updateSettings({ shopName: "A", address: "", phone: "", cancellationWindowMinutes: 60, minLeadMinutes: 0, slotStepMinutes: 7, notifyBarberOnBooking: true }, { actor: admin });
    expect(r.ok).toBe(false);
  });
});
