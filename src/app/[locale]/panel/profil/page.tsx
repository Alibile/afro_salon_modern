import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/panel/ProfileForm";
import { PasswordForm } from "@/components/panel/PasswordForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const actor = await requireStaff();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    include: { barber: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl">Profilim</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Bilgiler</h2>
        <ProfileForm
          profile={{
            name: user.name,
            phone: user.phone ?? "",
            bio: user.barber?.bio ?? "",
            photoKey: user.barber?.photoKey ?? "",
          }}
          hasBarber={Boolean(user.barber)}
        />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Şifre</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
