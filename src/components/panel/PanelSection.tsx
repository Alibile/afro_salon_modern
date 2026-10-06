/**
 * Form sayfalarının bölümü: `md` ve üstünde solda başlık + açıklama (4 sütun),
 * sağda alanlar (8 sütun); telefonda alt alta. Bölümler ince üst çizgiyle
 * ayrılır, kart içinde kart yok.
 */
export function PanelSection({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-12 md:gap-8">
      <div className="md:col-span-4">
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="md:col-span-8">{children}</div>
    </section>
  );
}
