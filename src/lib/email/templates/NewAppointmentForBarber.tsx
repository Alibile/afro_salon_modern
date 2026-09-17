import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";

export type NewAppointmentForBarberProps = {
  barberName: string;
  customerName: string;
  customerPhone: string;
  timeText: string;
  services: string[];
  panelUrl: string;
};

export function NewAppointmentForBarber(p: NewAppointmentForBarberProps) {
  return (
    <Html lang="tr">
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">Yeni randevu</Heading>
          <Text>Merhaba {p.barberName},</Text>
          <Text><strong>{p.customerName}</strong> ({p.customerPhone}) için saat <strong>{p.timeText}</strong> randevu alındı.</Text>
          <Text>Hizmetler: {p.services.join(", ")}</Text>
          <Button href={p.panelUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>Paneli aç</Button>
          <Hr />
        </Container>
      </Body>
    </Html>
  );
}
