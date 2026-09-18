import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";
import { emailTranslator } from "../i18n";
import type { AppLocale } from "@/i18n/routing";

export type CancelledProps = {
  locale: AppLocale;
  shopName: string;
  customerName: string;
  dateText: string;
  timeText: string;
  /** İptali kimin yaptığı; cümleyi şablon seçer, gönderen taraf metin taşımaz. */
  by: "CUSTOMER" | "STAFF";
  bookUrl: string;
};

export function AppointmentCancelled(p: CancelledProps) {
  const t = emailTranslator(p.locale, "cancelled");
  return (
    <Html lang={p.locale}>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">{t("heading")}</Heading>
          <Text>{t("greeting", { name: p.customerName })}</Text>
          <Text>{t.rich("when", { date: p.dateText, time: p.timeText, b: (chunks) => <strong>{chunks}</strong> })}</Text>
          <Text>{p.by === "CUSTOMER" ? t("byCustomer") : t("byStaff")}</Text>
          <Button href={p.bookUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>{t("cta")}</Button>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
