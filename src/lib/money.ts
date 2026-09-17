export function formatKurus(kurus: number): string {
  const lira = kurus / 100;
  return `${lira.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

/**
 * Satır içi fiyat düzenlemesinde girilen ham metni yorumlar. Boş alan bir
 * fiyat değildir (`Number("")` 0 verdiği için ayrı ele alınır); sayıya
 * çevrilemeyen değer geçersizdir.
 */
export type PriceInput = { kind: "empty" } | { kind: "invalid" } | { kind: "value"; lira: number };

export function parsePriceInput(raw: string): PriceInput {
  const trimmed = raw.trim();
  if (trimmed === "") return { kind: "empty" };
  const lira = Number(trimmed);
  if (!Number.isFinite(lira)) return { kind: "invalid" };
  return { kind: "value", lira };
}
