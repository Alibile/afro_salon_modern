import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";
import { emailTranslator } from "../i18n";
import type { AppLocale } from "@/i18n/routing";

export type NewAppointmentForBarberProps = {
  locale: AppLocale;
  barberName: string;
  customerName: string;
  customerPhone: string;
  timeText: string;
  services: string[];
  panelUrl: string;
};

export function NewAppointmentForBarber(p: NewAppointmentForBarberProps) {
  const t = emailTranslator(p.locale, "barberNotice");
  return (
    <Html lang={p.locale}>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">{t("heading")}</Heading>
          <Text>{t("greeting", { name: p.barberName })}</Text>
          <Text>{t.rich("body", { customer: p.customerName, phone: p.customerPhone, time: p.timeText, b: (chunks) => <strong>{chunks}</strong> })}</Text>
          <Text>{t("services", { list: p.services.join(", ") })}</Text>
          <Button href={p.panelUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>{t("cta")}</Button>
          <Hr />
        </Container>
      </Body>
    </Html>
  );
}
