import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function KayitPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return (
    <>
      <h1 className="display-lg">KAYIT OL</h1>
      <p className="editorial-note mt-2 text-muted-foreground">Bir dakika sürer; sonrasında randevun iki dokunuş uzakta.</p>
      <div className="mt-8">
        <RegisterForm next={next} />
      </div>
    </>
  );
}
