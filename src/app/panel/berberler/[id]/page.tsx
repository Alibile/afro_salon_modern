import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBarberDetail } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { WorkingHoursForm } from "@/components/panel/WorkingHoursForm";
import { DeleteButton } from "@/components/panel/DeleteButton";
import { deleteBarber } from "@/actions/barbers";

export const dynamic = "force-dynamic";

export default async function BerberDetayPage(props: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await props.params;
  const barber = await getBarberDetail(id);
  if (!barber) notFound();
  const hasHistory = barber.appointmentCount > 0 || barber.photoCount > 0;
  const isSelf = actor.barberId === barber.id;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl">{barber.name}</h1>
        <DeleteButton
          title="Berber silinsin mi?"
          description={`"${barber.name}" kalıcı olarak silinecek; kullanıcı hesabı ve çalışma saatleri de silinecek. Bu işlem geri alınamaz.`}
          disabled={hasHistory || isSelf}
          disabledReason={
            isSelf
              ? "Kendi hesabınızı silemezsiniz"
              : hasHistory
                ? "Bu berberin randevu veya fotoğraf geçmişi var, silinemez; pasife alın"
                : undefined
          }
          onConfirm={() => deleteBarber(barber.id)}
          successMessage="Berber silindi"
          redirectTo="/panel/berberler"
        />
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Bilgiler</h2>
        <BarberForm mode="edit" barber={barber} />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Çalışma saatleri</h2>
        <WorkingHoursForm barberId={barber.id} hours={barber.hours} />
      </section>
    </div>
  );
}
