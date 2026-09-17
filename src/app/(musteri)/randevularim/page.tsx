import Image from "next/image";
import { requireUser } from "@/lib/auth-helpers";
import { getCustomerAppointments, getCustomerPhotos } from "@/lib/queries/customer";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
import { publicUrl } from "@/lib/storage-public";
import { formatShopDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function RandevularimPage() {
  const user = await requireUser("/randevularim");
  const [{ today, past }, photos, settings] = await Promise.all([getCustomerAppointments(user.id), getCustomerPhotos(user.id), getSettings()]);
  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-3xl">Bugünkü randevum</h1>
        {today.length === 0 ? <p className="text-muted-foreground">Bugün için randevun yok.</p> : today.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} big />)}
      </section>
      {photos.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">Kesim fotoğrafların</h2>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <figure key={p.id}>
                <Image src={publicUrl(p.storageKey)} alt="" width={300} height={300} className="aspect-square w-full rounded-xl object-cover" />
                <figcaption className="mt-1 text-xs text-muted-foreground">{formatShopDate(p.createdAt)} · {p.barberName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-2xl">Geçmiş</h2>
        {past.length === 0 ? <p className="text-muted-foreground">Henüz geçmiş randevun yok.</p> : <div className="space-y-2">{past.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>}
      </section>
    </div>
  );
}
