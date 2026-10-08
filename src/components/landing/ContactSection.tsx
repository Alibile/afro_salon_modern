import { useLocale, useTranslations } from "next-intl";
import { ContactForm } from "./ContactForm";
import { MapEmbed } from "./MapEmbed";
import { telHref, whatsappUrl } from "@/components/brand/SocialLinks";
import { weekdayName } from "@/lib/intl";
import type { WeeklyHoursRow } from "@/lib/queries/landing";
import { cn } from "@/lib/utils";

export function ContactSection({
  title,
  note,
  formNote,
  address,
  phone,
  email,
  whatsapp,
  mapsUrl,
  weeklyHours,
  todayDayOfWeek,
  services,
}: {
  title: string;
  note: string;
  formNote: string;
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
  const maps =
    mapsUrl.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const links = [
    email.trim()
      ? {
          key: "email",
          label: t("emailLabel"),
          text: email.trim(),
          href: `mailto:${email.trim()}`,
          external: false,
        }
      : null,
    whatsapp.trim()
      ? {
          key: "whatsapp",
          label: t("whatsappLabel"),
          text: t("whatsappText"),
          href: whatsappUrl(whatsapp, t("whatsappMessage")),
          external: true,
        }
      : null,
    {
      key: "maps",
      label: t("mapsLabel"),
      text: t("mapsText"),
      href: maps,
      external: true,
    },
  ].filter((l) => l !== null);

  return (
    <section id="iletisim" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{title}</h2>
          <p className="mt-3 text-muted-foreground">{note}</p>
        </div>

        {/* Telefonda sıra DOM sırasıdır: adres ve telefon, bağlantılar, çalışma saatleri, harita, form. */}
        <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <h3 className="display-md">{t("whereTitle")}</h3>
            <p className="mt-5 text-lg">{address}</p>
            <a
              href={telHref(phone)}
              className="mt-2 inline-block text-lg text-primary underline underline-offset-4 hover:text-foreground"
            >
              {phone}
            </a>
            <dl className="mt-8 border-t border-border">
              {links.map((l) => (
                <div
                  key={l.key}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                >
                  <dt className="text-muted-foreground">{l.label}</dt>
                  <dd>
                    <a
                      href={l.href}
                      {...(l.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {l.text}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="display-md mt-10">{t("hoursTitle")}</h3>
            <dl className="mt-5 border-t border-border">
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
                      {today && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({t("today")})
                        </span>
                      )}
                    </dt>
                    <dd
                      className={cn(
                        "tabular-nums",
                        today ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {d.opensAt && d.closesAt
                        ? `${d.opensAt}–${d.closesAt}`
                        : t("closed")}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <MapEmbed address={address} />
          </div>

          <div className="md:col-span-7 md:pl-6">
            <h3 className="display-md">{t("formTitle")}</h3>
            <p className="measure mt-3 text-muted-foreground">
              {formNote}
            </p>
            <ContactForm services={services} />
          </div>
        </div>
      </div>
    </section>
  );
}
