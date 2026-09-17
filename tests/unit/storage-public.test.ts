import { describe, it, expect, afterEach, vi } from "vitest";
import { publicUrl } from "@/lib/storage-public";

describe("publicUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("R2 taban adresi ayarlıyken bile landing/ anahtarlarını yerelden servis eder", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example");
    expect(publicUrl("landing/team-1.jpg")).toBe("/landing/team-1.jpg");
  });

  it("R2 taban adresi ayarlıyken diğer anahtarları R2'ye yönlendirir", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example");
    expect(publicUrl("barbers/x.jpg")).toBe("https://cdn.example/barbers/x.jpg");
  });

  it("R2 taban adresi boşken diğer anahtarları da yerelden servis eder", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "");
    expect(publicUrl("barbers/x.jpg")).toBe("/barbers/x.jpg");
  });
});
