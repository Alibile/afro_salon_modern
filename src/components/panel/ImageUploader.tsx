"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { publicUrl } from "@/lib/storage-public";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { Input } from "@/components/ui/input";

/**
 * Dosya seçiciye `accept` verilmiş olsa da kullanıcı "tüm dosyalar"ı seçip
 * yanlış türde bir dosya verebilir. Presign ucu da reddeder, ama o zaman
 * kullanıcı türle ilgisi olmayan genel bir "Hata" görür; tür burada,
 * ağa çıkmadan söylenir.
 */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ kind, name, defaultKey, onUploaded, inputId }: { kind: "barber" | "haircut"; name: string; defaultKey?: string; onUploaded?: (key: string) => void; /** Dışarıdaki `Field` etiketinin bağlanacağı dosya kutusu kimliği. */ inputId?: string }) {
  const t = useTranslations("panel.upload");
  const [key, setKey] = useState(defaultKey ?? "");
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    if (!ACCEPTED.includes(file.type)) { setStatus(t("onlyImages")); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setStatus(t("tooLarge")); return; }
    setStatus(t("uploading"));
    const res = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type, contentLength: file.size }),
    });
    if (!res.ok) { setStatus(t("error")); return; }
    const { url, key: newKey } = await res.json();
    const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
    if (!put.ok) { setStatus(t("failed")); return; }
    setKey(newKey);
    setStatus(t("done"));
    onUploaded?.(newKey);
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <input type="hidden" name={name} value={key} />
      {key && <Image src={publicUrl(key)} alt="" width={96} height={96} className="size-20 shrink-0 rounded-[var(--radius)] object-cover" />}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="py-2" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}
