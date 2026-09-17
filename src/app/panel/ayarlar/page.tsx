import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/panel/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl">Ayarlar</h1>
      <SettingsForm initial={{ shopName: s.shopName, address: s.address, phone: s.phone, cancellationWindowMinutes: s.cancellationWindowMinutes, minLeadMinutes: s.minLeadMinutes, slotStepMinutes: s.slotStepMinutes, notifyBarberOnBooking: s.notifyBarberOnBooking }} />
    </div>
  );
}
