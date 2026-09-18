import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth-helpers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { Badge } from "@/components/ui/badge";
import { publicUrl } from "@/lib/storage-public";

export const dynamic = "force-dynamic";

export default async function BerberlerPage() {
  await requireAdmin();
  const barbers = await listBarbersForAdmin();
  const t = await getTranslations("panel");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{t("barbers.title")}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("barbers.newTitle")}</h2>
        <BarberForm mode="create" />
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {barbers.map((b) => (
          <li key={b.id}>
            <Link href={`/panel/berberler/${b.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted">
              <Image src={publicUrl(b.photoKey)} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{b.name} {!b.isActive && <Badge variant="secondary">{t("common.inactive")}</Badge>}</span>
                <span className="block truncate text-sm text-muted-foreground">{b.email}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
