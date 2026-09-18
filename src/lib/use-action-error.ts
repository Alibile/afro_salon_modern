import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { formatActionError, type ErrorParams, type ErrorTranslator } from "@/lib/errors";

/**
 * Hata anahtarını kullanıcının dilinde metne çeviren tek çağrı. Her bileşen
 * `useTranslations("errors")` yazıp anahtarı elle kırpmasın diye burada
 * toplanır; `formatActionError` tanımadığı bir değeri ham hâliyle geri verdiği
 * için henüz çevrilmemiş yüzeyler (panel, Task 3) de boş uyarı göstermez.
 *
 * `useTranslations` tip düzeyinde yalnızca bilinen anahtarları kabul eder;
 * buradaki değer çalışma zamanında sunucudan gelen bir dizgedir, bu yüzden
 * gevşek `ErrorTranslator` arayüzüne tek bir yerde indirilir.
 */
export function useActionError(): (result: { error: string; params?: ErrorParams }) => string {
  const t = useTranslations("errors") as unknown as ErrorTranslator;
  return useCallback((result) => formatActionError(t, result), [t]);
}
