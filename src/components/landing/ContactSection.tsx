import { cn } from "@/lib/utils";

export function ContactSection({
  address,
  phone,
  weeklyHours,
  todayLabel,
}: {
  address: string;
  phone: string;
  weeklyHours: { dayLabel: string; text: string }[];
  todayLabel: string;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <section id="iletisim" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-16 md:grid-cols-12 md:gap-10 md:py-24">
        <div className="md:col-span-7">
          <h2 className="display-lg">NEREDEYİZ</h2>
          <p className="mt-8 font-display text-3xl leading-tight tracking-wide md:text-4xl">{address}</p>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="mt-5 inline-block border-b-2 border-primary pb-1 font-display text-3xl tracking-wide text-primary transition-colors hover:border-foreground hover:text-foreground md:text-4xl"
          >
            {phone}
          </a>
          <p className="mt-8">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">
              Haritada aç
            </a>
          </p>
          <p className="editorial-note measure mt-8 text-muted-foreground">
            Randevusuz geldiğinde sıraya bakarız; garantisi yok. Aynı gün için yer ayırmak birkaç dakika sürer.
          </p>
        </div>
        <div className="md:col-span-5">
          <h3 className="display-md">ÇALIŞMA SAATLERİ</h3>
          <dl className="mt-6 border-t border-border">
            {weeklyHours.map((d) => {
              const today = d.dayLabel === todayLabel;
              return (
                <div
                  key={d.dayLabel}
                  className={cn("flex items-baseline justify-between gap-4 border-b border-border py-3", today && "border-l-2 border-l-primary pl-3")}
                >
                  <dt className={cn(today && "font-medium text-primary")}>
                    {d.dayLabel}
                    {today && <span className="editorial-note ml-2 text-sm text-muted-foreground">bugün</span>}
                  </dt>
                  <dd className={cn("tabular-nums", today ? "text-primary" : "text-muted-foreground")}>{d.text}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
