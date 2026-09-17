export function publicUrl(key: string): string {
  // landing/ ve seed/ anahtarları R2'de değil, public/ altında yaşar; R2 taban adresi ayarlı olsa bile yerelden servis edilmeli.
  if (key.startsWith("landing/") || key.startsWith("seed/")) return `/${key}`;
  // NEXT_PUBLIC_ öneki zorunlu: bu fonksiyon istemci bileşenlerinde de çağrılıyor.
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}
