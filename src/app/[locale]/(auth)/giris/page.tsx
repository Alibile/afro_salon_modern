import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function GirisPage(props: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, t] = await Promise.all([props.searchParams, getTranslations("auth.login")]);
  return (
    <>
      <h1 className="display-lg">{t("title")}</h1>
      <p className="editorial-note mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </>
  );
}
