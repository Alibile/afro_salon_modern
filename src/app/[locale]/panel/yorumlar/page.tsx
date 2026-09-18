import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { TestimonialForm } from "@/components/panel/TestimonialForm";
import { TestimonialRow } from "@/components/panel/TestimonialRow";

export const dynamic = "force-dynamic";

export default async function YorumlarPage() {
  await requireAdmin();
  const testimonials = await prisma.testimonial.findMany({ orderBy: [{ createdAt: "desc" }] });
  const tr = await getTranslations("panel.testimonials");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{tr("title")}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{tr("newTitle")}</h2>
        <TestimonialForm />
      </section>
      <ul className="space-y-2">
        {testimonials.map((t) => (
          <TestimonialRow
            key={t.id}
            testimonial={{ id: t.id, name: t.name, text: t.text, rating: t.rating, sortOrder: t.sortOrder, isActive: t.isActive }}
          />
        ))}
      </ul>
    </div>
  );
}
