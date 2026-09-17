import { LoginForm } from "@/components/auth/LoginForm";

export default async function GirisPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Giriş yap</h1>
      <LoginForm next={next} />
    </main>
  );
}
