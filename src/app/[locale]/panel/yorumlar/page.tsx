import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { TestimonialForm } from "@/components/panel/TestimonialForm";
import { TestimonialRow } from "@/components/panel/TestimonialRow";
import { NewRecordPanel } from "@/components/panel/NewRecordPanel";

export const dynamic = "force-dynamic";

export default async function YorumlarPage() {
  await requireAdmin();
  const testimonials = await prisma.testimonial.findMany({ orderBy: [{ createdAt: "desc" }] });
  const tr = await getTranslations("panel.testimonials");
  return (
    <NewRecordPanel pageTitle={tr("title")} label={tr("newTitle")} title={tr("newTitle")} form={<TestimonialForm />}>
      <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
        {testimonials.map((t) => (
          <TestimonialRow
            key={t.id}
            testimonial={{ id: t.id, name: t.name, text: t.text, rating: t.rating, sortOrder: t.sortOrder, isActive: t.isActive }}
          />
        ))}
      </ul>
    </NewRecordPanel>
  );
}
