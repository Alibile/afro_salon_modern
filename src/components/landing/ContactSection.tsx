import { useLocale, useTranslations } from "next-intl";
import { ContactForm } from "./ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";
import { telHref, whatsappUrl } from "@/components/brand/SocialLinks";
import { weekdayName } from "@/lib/intl";
import type { WeeklyHoursRow } from "@/lib/queries/landing";
import { cn } from "@/lib/utils";

export function ContactSection({
  address,
  phone,
  email,
  whatsapp,
  mapsUrl,
  weeklyHours,
  todayDayOfWeek,
  services,
}: {
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  mapsUrl: string;
  weeklyHours: WeeklyHoursRow[];
  todayDayOfWeek: number;
  services: string[];
}) {
  const t = useTranslations("landing.contact");
  const locale = useLocale();
  const maps = mapsUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const links = [
    email.trim() ? { key: "email", label: t("emailLabel"), text: email.trim(), href: `mailto:${email.trim()}`, external: false } : null,
    whatsapp.trim()
      ? {
          key: "whatsapp",
          label: t("whatsappLabel"),
          text: t("whatsappText"),
          href: whatsappUrl(whatsapp, t("whatsappMessage")),
          external: true,
        }
      : null,
    { key: "maps", label: t("mapsLabel"), text: t("mapsText"), href: maps, external: true },
  ].filter((l) => l !== null);

  return (
    <section id="iletisim" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-5">
            <h3 className="display-md">{t("whereTitle")}</h3>
            <p className="display-sm mt-6">{address}</p>
            <a
              href={telHref(phone)}
              className="display-sm mt-4 inline-block border-b-2 border-primary pb-1 text-primary transition-colors hover:border-foreground hover:text-foreground"
            >
              {phone}
            </a>
            <dl className="mt-8 border-t border-border">
              {links.map((l) => (
                <div key={l.key} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
                  <dt className="text-muted-foreground">{l.label}</dt>
                  <dd>
                    <a
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {l.text}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="display-md mt-12">{t("hoursTitle")}</h3>
            <dl className="mt-6 border-t border-border">
              {weeklyHours.map((d) => {
                const today = d.dayOfWeek === todayDayOfWeek;
                return (
                  <div
                    key={d.dayOfWeek}
                    className={cn(
                      "flex items-baseline justify-between gap-4 border-b border-border py-3",
                      today && "border-l-2 border-l-primary pl-3",
                    )}
                  >
                    <dt className={cn(today && "font-medium text-primary")}>
                      {weekdayName(d.dayOfWeek, locale)}
                      {today && <span className="editorial-note ml-2 text-sm text-muted-foreground">{t("today")}</span>}
                    </dt>
                    <dd className={cn("tabular-nums", today ? "text-primary" : "text-muted-foreground")}>
                      {d.opensAt && d.closesAt ? `${d.opensAt}–${d.closesAt}` : t("closed")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Reveal>

          <Reveal className="md:col-span-7 md:pl-6" delay={staggerDelay(1, 0.08)}>
            <h3 className="display-md">{t("formTitle")}</h3>
            <p className="measure mt-3 text-muted-foreground">{t("formNote")}</p>
            <ContactForm services={services} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
