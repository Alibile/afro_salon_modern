"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
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

export function DeleteButton({
  title,
  description,
  confirmLabel = "Sil",
  disabled,
  disabledReason,
  onConfirm,
  successMessage,
  redirectTo,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onConfirm: () => Promise<ActionResult<void>>;
  successMessage: string;
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (disabled) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" variant="destructive" disabled title={disabledReason}>
          Sil
        </Button>
        {disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={pending}>
          Sil
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              start(async () => {
                const r = await onConfirm();
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                toast.success(successMessage);
                if (redirectTo) router.push(redirectTo);
                else router.refresh();
              })
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
