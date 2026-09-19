"use client";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { routing, type AppLocale } from "@/i18n/routing";
import type { I18nText } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

/**
 * Panelden girilen bir içerik alanının üç dilli hâli: tek bir etiket, altında
 * TR / EN / FR sekmeleri ve seçili dilin girdisi.
 *
 * Üç girdi de her zaman DOM'da durur, seçili olmayanlar `display:none` ile
 * (sınıfla değil satır içi: girdilerin kendi `display` yardımcıları var ve
 * sınıf sırası belirsiz kalırdı). Sekme değiştirmek yazılanı düşürmez,
 * `FormData` tek seferde üçünü birden taşır.
 * Adları `<alan>.tr` / `<alan>.en` / `<alan>.fr`'dir; sunucuya giden nesneyi
 * `readI18nField` toplar.
 *
 * Kontrollü kullanım (`value` + `onChange`) galeri kartı gibi `FormData`
 * kullanmayan yerler içindir; ikisinden biri verilir.
 */
type BaseProps = {
  /** Girdi adlarının öneki; `FormData` anahtarları bundan türer. */
  name: string;
  label: string;
  /** Kontrollü kullanım. */
  value?: I18nText;
  onChange?: (value: I18nText) => void;
  /** Kontrolsüz kullanım (form gönderiminde `FormData`'dan okunur). */
  defaultValue?: I18nText;
  maxLength?: number;
  placeholder?: string;
  /** Türkçe alan boş bırakılamaz. */
  required?: boolean;
};

const LOCALES = routing.locales;
const HIDDEN = { display: "none" } as const;

function useTabState(props: BaseProps) {
  const t = useTranslations("panel.i18nField");
  const tLanguage = useTranslations("common.endonyms");
  const id = useId();
  const [active, setActive] = useState<AppLocale>(routing.defaultLocale);
  const [internal, setInternal] = useState<I18nText>(props.value ?? props.defaultValue ?? { tr: "" });
  const current = props.value ?? internal;

  function set(locale: AppLocale, text: string) {
    const next: I18nText = { ...current, [locale]: text };
    setInternal(next);
    props.onChange?.(next);
  }

  const tabs = (
    <div className="flex gap-1" role="group" aria-label={props.label}>
      {LOCALES.map((locale) => {
        const on = locale === active;
        const filled = (current[locale] ?? "").trim() !== "";
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={on}
            aria-label={t("tab", { language: tLanguage(locale) })}
            onClick={() => setActive(locale)}
            className={cn(
              "label rounded-full border px-2.5 py-0.5 text-[0.65rem] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              // Boş bir çeviri sekmesi sönük durur: hangi dillerin eksik
              // olduğu, sekmeyi açmadan görünür.
              !on && !filled && "opacity-55",
            )}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );

  return { id, active, current, set, tabs };
}

function FieldShell({
  label,
  htmlFor,
  tabs,
  children,
}: {
  label: string;
  htmlFor: string;
  tabs: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {tabs}
      </div>
      {children}
    </div>
  );
}

export function I18nTextField(props: BaseProps) {
  const { id, active, current, set, tabs } = useTabState(props);
  return (
    <FieldShell label={props.label} htmlFor={`${id}-${active}`} tabs={tabs}>
      {LOCALES.map((locale) => (
        <Input
          key={locale}
          id={`${id}-${locale}`}
          name={`${props.name}.${locale}`}
          style={locale === active ? undefined : HIDDEN}
          value={current[locale] ?? ""}
          maxLength={props.maxLength}
          placeholder={props.placeholder}
          // Tarayıcı zorunluluğu yalnızca Türkçe sekmesi açıkken: gizli bir
          // `required` alan gönderimi görünmez biçimde engellerdi. Sunucu
          // doğrulaması (`errors.serviceNameMin2`) her durumda yakalar.
          required={props.required && locale === routing.defaultLocale && active === routing.defaultLocale}
          onChange={(e) => set(locale, e.target.value)}
        />
      ))}
    </FieldShell>
  );
}

export function I18nTextarea(props: BaseProps & { rows?: number }) {
  const { id, active, current, set, tabs } = useTabState(props);
  return (
    <FieldShell label={props.label} htmlFor={`${id}-${active}`} tabs={tabs}>
      {LOCALES.map((locale) => (
        <Textarea
          key={locale}
          id={`${id}-${locale}`}
          name={`${props.name}.${locale}`}
          style={locale === active ? undefined : HIDDEN}
          rows={props.rows ?? 3}
          value={current[locale] ?? ""}
          maxLength={props.maxLength}
          placeholder={props.placeholder}
          required={props.required && locale === routing.defaultLocale && active === routing.defaultLocale}
          onChange={(e) => set(locale, e.target.value)}
        />
      ))}
    </FieldShell>
  );
}
