import { Html, Body, Container, Heading, Text, Hr } from "@react-email/components";

export type ContactMessageProps = {
  shopName: string;
  name: string;
  phone: string;
  message: string;
  services: string[];
};

export function ContactMessage(p: ContactMessageProps) {
  return (
    <Html lang="tr">
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">Siteden yeni mesaj</Heading>
          <Text><strong>{p.name}</strong>{p.phone ? ` · ${p.phone}` : ""}</Text>
          {p.services.length > 0 && (
            <>
              <Text style={{ marginBottom: 4 }}>İlgilendiği hizmetler:</Text>
              <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
                {p.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
          <Text style={{ whiteSpace: "pre-wrap" }}>{p.message}</Text>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName} · iletişim formu</Text>
        </Container>
      </Body>
    </Html>
  );
}
