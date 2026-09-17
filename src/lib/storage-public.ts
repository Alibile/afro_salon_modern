export function publicUrl(key: string): string {
  // NEXT_PUBLIC_ öneki zorunlu: bu fonksiyon istemci bileşenlerinde de çağrılıyor.
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}
