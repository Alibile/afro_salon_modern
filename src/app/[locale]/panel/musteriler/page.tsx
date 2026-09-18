import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth-helpers";
import { searchCustomers } from "@/lib/queries/customers";
import { Input } from "@/components/ui/input";
import { formatShopDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MusterilerPage(props: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireStaff();
  const { q = "" } = await props.searchParams;
  const customers = await searchCustomers(user, q);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Müşteriler</h1>
      <form><Input name="q" defaultValue={q} placeholder="Ad, telefon veya e-posta ara" /></form>
      <ul className="divide-y rounded-xl border bg-card">
        {customers.length === 0 && <li className="p-4 text-sm text-muted-foreground">Sonuç yok</li>}
        {customers.map((c) => (
          <li key={c.id}>
            <Link href={`/panel/musteriler/${c.id}`} className="flex items-center justify-between p-3 hover:bg-muted">
              <span><span className="block font-medium">{c.name}</span><span className="text-sm text-muted-foreground">{c.phone ?? c.email}</span></span>
              <span className="text-xs text-muted-foreground">{c.lastVisit ? `Son: ${formatShopDate(c.lastVisit)}` : "İlk ziyaret bekleniyor"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
