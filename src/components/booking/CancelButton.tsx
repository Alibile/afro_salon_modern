"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentByCustomer } from "@/actions/appointments";
import { useActionError } from "@/lib/use-action-error";

export function CancelButton({ id }: { id: string }) {
  const t = useTranslations("booking");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" disabled={pending}
      onClick={() => start(async () => {
        const r = await cancelAppointmentByCustomer(id);
        if (r.ok) { toast.success(t("cancelled")); router.refresh(); } else toast.error(showError(r));
      })}>
      {pending ? t("cancelling") : t("cancel")}
    </Button>
  );
}
