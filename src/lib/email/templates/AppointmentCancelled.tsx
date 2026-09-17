import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";

export type CancelledProps = {
  shopName: string;
  customerName: string;
  dateText: string;
  timeText: string;
  byText: string;
  bookUrl: string;
};

export function AppointmentCancelled(p: CancelledProps) {
  return (
    <Html lang="tr">
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">Randevun iptal edildi</Heading>
          <Text>Merhaba {p.customerName},</Text>
          <Text><strong>{p.dateText}</strong> günü saat <strong>{p.timeText}</strong> için randevun iptal edildi.</Text>
          <Text>{p.byText}</Text>
          <Button href={p.bookUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>Yeni randevu al</Button>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
