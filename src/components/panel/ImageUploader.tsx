"use client";
import { useState } from "react";
import Image from "next/image";
import { publicUrl } from "@/lib/storage-public";
import { Input } from "@/components/ui/input";

export function ImageUploader({ kind, name, defaultKey, onUploaded }: { kind: "barber" | "haircut"; name: string; defaultKey?: string; onUploaded?: (key: string) => void }) {
  const [key, setKey] = useState(defaultKey ?? "");
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    setStatus("Yükleniyor…");
    const res = await fetch("/api/upload/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, contentType: file.type }) });
    if (!res.ok) { setStatus((await res.json()).error ?? "Hata"); return; }
    const { url, key: newKey } = await res.json();
    const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
    if (!put.ok) { setStatus("Yükleme başarısız"); return; }
    setKey(newKey);
    setStatus("Yüklendi");
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
