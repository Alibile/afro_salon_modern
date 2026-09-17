import Link from "next/link";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { getSettings } from "@/lib/settings";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-primary p-6 text-primary-foreground md:p-12">
        <AfroPattern variant="kente" size={84} opacity={0.12} />
        <Link href="/" className="relative font-display text-2xl tracking-[0.14em]">
          {settings.shopName}
        </Link>
        <div className="relative">
          <p className="display-lg">BUGÜNÜN SAATİ SENİ BEKLİYOR.</p>
          <p className="editorial-note mt-4 max-w-[32ch] text-lg text-primary-foreground/85">
            Hesabın randevunu, kesim geçmişini ve fotoğraflarını bir arada tutar.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/75">{settings.address}</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
