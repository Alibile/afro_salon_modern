import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function KayitPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Kayıt ol</h1>
      <RegisterForm next={next} />
    </main>
  );
}
