import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";

export type ConfirmedProps = {
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
  return (
    <Html lang="tr">
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">Randevun onaylandı</Heading>
          <Text>Merhaba {p.customerName},</Text>
          <Text><strong>{p.dateText}</strong> günü saat <strong>{p.timeText}</strong>, berberin <strong>{p.barberName}</strong>.</Text>
          <Text>Hizmetler: {p.services.join(", ")}<br />Toplam: {p.totalText}</Text>
          <Button href={p.manageUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>Randevularımı gör</Button>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
