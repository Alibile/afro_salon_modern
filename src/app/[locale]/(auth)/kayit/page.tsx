import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function KayitPage(props: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, t] = await Promise.all([props.searchParams, getTranslations("auth.register")]);
  return (
    <>
      <h1 className="display-lg">{t("title")}</h1>
      <p className="editorial-note mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        <RegisterForm next={next} />
      </div>
    </>
  );
}
