import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import { AppointmentConfirmed } from "@/lib/email/templates/AppointmentConfirmed";

describe("AppointmentConfirmed", () => {
  it("renders Turkish summary", async () => {
    const html = await render(
      <AppointmentConfirmed shopName="Afro Salon" customerName="Ali" barberName="Kwame" dateText="17 Eylül 2026 Perşembe" timeText="14:30" services={["Saç", "Sakal"]} totalText="600,00 ₺" manageUrl="http://localhost:3000/randevularim" />,
    );
    expect(html).toContain("Randevun onaylandı");
    expect(html).toContain("Kwame");
    expect(html).toContain("14:30");
    expect(html).toContain("Saç, Sakal");
  });
});
