export function formatKurus(kurus: number): string {
  const lira = kurus / 100;
  return `${lira.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}
