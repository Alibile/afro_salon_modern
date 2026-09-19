import { Html, Body, Container, Heading, Text, Hr } from "@react-email/components";
import { emailTranslator, languageName } from "../i18n";
import type { AppLocale } from "@/i18n/routing";

export type ContactMessageProps = {
  /** Bu tek e-posta salona gider, ziyaretçiye değil: dili salonun dilidir. */
  locale: AppLocale;
  /**
   * Ziyaretçinin formu doldurduğu dil. Gövdede tek satır olarak yazılır:
   * salon mesaja hangi dilde döneceğini bilsin diye.
   */
  visitorLocale: AppLocale;
  shopName: string;
  name: string;
  phone: string;
  message: string;
  services: string[];
};

export function ContactMessage(p: ContactMessageProps) {
  const t = emailTranslator(p.locale, "contact");
  return (
    <Html lang={p.locale}>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">{t("heading")}</Heading>
          <Text><strong>{p.name}</strong>{p.phone ? ` · ${p.phone}` : ""}</Text>
          {p.services.length > 0 && (
            <>
              <Text style={{ marginBottom: 4 }}>{t("interestedIn")}</Text>
              <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
                {p.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
          <Text style={{ whiteSpace: "pre-wrap" }}>{p.message}</Text>
          <Text style={{ fontSize: 13 }}>{t("visitorLanguage", { language: languageName(p.visitorLocale, p.locale) })}</Text>
          <Hr />
          <Text style={{ fontSize: 12 }}>{t("footer", { shopName: p.shopName })}</Text>
        </Container>
      </Body>
    </Html>
  );
}
