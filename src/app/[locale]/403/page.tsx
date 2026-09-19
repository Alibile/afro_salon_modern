import { useTranslations } from "next-intl";
import { noIndex } from "@/lib/seo";

/**
 * Yetki hatası sayfası: dizine girmez.
 */
export const metadata = noIndex;

export default function Forbidden() {
  const t = useTranslations("auth");
  return (
    <main className="mx-auto max-w-sm px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t("forbidden")}</h1>
    </main>
  );
}
