"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/actions/staff-appointments";
import { useActionError } from "@/lib/use-action-error";

export function AppointmentActions({ id }: { id: string }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (status: "COMPLETED" | "NO_SHOW" | "CANCELLED") =>
    start(async () => {
      const r = await setAppointmentStatus(id, status);
      if (r.ok) { toast.success(t("common.updated")); router.refresh(); } else toast.error(showError(r));
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("COMPLETED")}>{t("today.complete")}</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("NO_SHOW")}>{t("today.noShow")}</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run("CANCELLED")}>{t("today.cancel")}</Button>
    </div>
  );
}
