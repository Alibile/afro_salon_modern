import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";
import { emailTranslator } from "../i18n";
import type { AppLocale } from "@/i18n/routing";

export type ConfirmedProps = {
  /** Alıcının kayıtlı dili; metin ve `<html lang>` bundan gelir. */
  locale: AppLocale;
  shopName: string;
  customerName: string;
  barberName: string;
  dateText: string;
  timeText: string;
  services: string[];
  totalText: string;
  manageUrl: string;
};

export function AppointmentConfirmed(p: ConfirmedProps) {
  const t = emailTranslator(p.locale, "confirmed");
  return (
    <Html lang={p.locale}>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">{t("heading")}</Heading>
          <Text>{t("greeting", { name: p.customerName })}</Text>
          <Text>{t.rich("when", { date: p.dateText, time: p.timeText, barber: p.barberName, b: (chunks) => <strong>{chunks}</strong> })}</Text>
          <Text>{t("services", { list: p.services.join(", ") })}<br />{t("total", { total: p.totalText })}</Text>
          <Button href={p.manageUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>{t("cta")}</Button>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
