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

export function ImageUploader({ kind, name, defaultKey, onUploaded }: { kind: "barber" | "haircut"; name: string; defaultKey?: string; onUploaded?: (key: string) => void }) {
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
    <div className="space-y-2">
      <input type="hidden" name={name} value={key} />
      {key && <Image src={publicUrl(key)} alt="" width={96} height={96} className="size-24 rounded-lg object-cover" />}
      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
