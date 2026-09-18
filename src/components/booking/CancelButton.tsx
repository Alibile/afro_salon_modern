"use client";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentByCustomer } from "@/actions/appointments";

export function CancelButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" disabled={pending}
      onClick={() => start(async () => {
        const r = await cancelAppointmentByCustomer(id);
        if (r.ok) { toast.success("Randevu iptal edildi"); router.refresh(); } else toast.error(r.error);
      })}>
      {pending ? "İptal ediliyor…" : "İptal et"}
    </Button>
  );
}
