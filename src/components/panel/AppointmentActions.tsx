"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/actions/staff-appointments";

export function AppointmentActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (status: "COMPLETED" | "NO_SHOW" | "CANCELLED") =>
    start(async () => {
      const r = await setAppointmentStatus(id, status);
      if (r.ok) { toast.success("Güncellendi"); router.refresh(); } else toast.error(r.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("COMPLETED")}>Tamamlandı</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("NO_SHOW")}>Gelmedi</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run("CANCELLED")}>İptal</Button>
    </div>
  );
}
