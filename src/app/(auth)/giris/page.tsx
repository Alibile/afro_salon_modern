import { LoginForm } from "@/components/auth/LoginForm";

export default async function GirisPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return (
    <>
      <h1 className="display-lg">GİRİŞ YAP</h1>
      <p className="editorial-note mt-2 text-muted-foreground">Randevunu onaylamak için hesabına gir.</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </>
  );
}
