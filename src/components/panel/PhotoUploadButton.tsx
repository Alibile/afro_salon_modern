"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { addHaircutPhoto } from "@/actions/photos";

export function PhotoUploadButton({ customerId, barbers }: { customerId: string; barbers: { id: string; name: string }[] | null }) {
  const [open, setOpen] = useState(false);
  const [barberId, setBarberId] = useState(barbers?.[0]?.id);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Fotoğraf ekle</Button>;
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {barbers && (
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <ImageUploader kind="haircut" name="storageKey" onUploaded={(key) => start(async () => {
        const r = await addHaircutPhoto({ customerId, storageKey: key, barberId });
        if (!r.ok) { toast.error(r.error); return; }
        toast.success(r.data.deletedKeys.length ? "Fotoğraf eklendi, en eski fotoğraf silindi" : "Fotoğraf eklendi");
        setOpen(false);
        router.refresh();
      })} />
      {pending && <p className="text-xs text-muted-foreground">Kaydediliyor…</p>}
    </div>
  );
}
