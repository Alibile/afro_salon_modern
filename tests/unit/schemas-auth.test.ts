import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/schemas/auth";

describe("registerSchema", () => {
  it("accepts valid input and trims", () => {
    const r = registerSchema.safeParse({ name: " Ali Veli ", email: "ALI@test.com ", phone: "05551112233", password: "Sifre123!" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Ali Veli");
      expect(r.data.email).toBe("ali@test.com");
    }
  });
  it("rejects short password with Turkish message", () => {
    const r = registerSchema.safeParse({ name: "A", email: "a@b.co", password: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.message)).toContain("Şifre en az 8 karakter olmalı");
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
  });
});
