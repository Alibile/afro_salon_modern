"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useActionError } from "@/lib/use-action-error";

export function DeleteButton({
  title,
  description,
  confirmLabel,
  disabled,
  disabledReason,
  onConfirm,
  successMessage,
  redirectTo,
}: {
  title: string;
  description: string;
  /** Verilmezse `panel.common.delete`; başlık ve açıklama zaten çağıran taraftan çevrili gelir. */
  confirmLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onConfirm: () => Promise<ActionResult<void>>;
  successMessage: string;
  redirectTo?: string;
}) {
  const t = useTranslations("panel.common");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();

  if (disabled) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" variant="destructive" disabled title={disabledReason}>
          {t("delete")}
        </Button>
        {disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={pending}>
          {t("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              start(async () => {
                const r = await onConfirm();
                if (!r.ok) {
                  toast.error(showError(r));
                  return;
                }
                toast.success(successMessage);
                if (redirectTo) router.push(redirectTo);
                else router.refresh();
              })
            }
          >
            {confirmLabel ?? t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
