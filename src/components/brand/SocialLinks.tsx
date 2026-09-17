import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SocialSettings = { instagram: string; facebook: string; whatsapp: string };

/** wa.me bağlantısı yalnızca rakamları kabul eder (ör. 905550000000). */
export function whatsappUrl(whatsapp: string, text?: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** `tel:` bağlantısı boşluk kabul etmez; ayarlardaki telefon serbest biçimde yazılabilir. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function hasSocial(s: SocialSettings) {
  return Boolean(s.instagram.trim() || s.facebook.trim() || s.whatsapp.trim());
}

/**
 * Marka ikonları lucide 1.x'te bulunmadığından Instagram ve Facebook aynı çizim
 * diliyle (24 birim ızgara, 2px `currentColor` konturu) burada tanımlanır.
 */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

/**
 * Yalnızca ayarlarda dolu olan hesapları gösterir; hiçbiri yoksa satır render
 * edilmez. Sunucu bileşenidir, istemci bileşenlerinden de import edilebilir.
 */
export function SocialLinks({
  settings,
  className,
  linkClassName,
  iconClassName = "size-[1.15rem]",
}: {
  settings: SocialSettings;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  const items = [
    { key: "instagram", href: settings.instagram.trim(), label: "Instagram", icon: <InstagramGlyph className={iconClassName} /> },
    { key: "facebook", href: settings.facebook.trim(), label: "Facebook", icon: <FacebookGlyph className={iconClassName} /> },
    {
      key: "whatsapp",
      href: settings.whatsapp.trim() ? whatsappUrl(settings.whatsapp) : "",
      label: "WhatsApp",
      icon: <MessageCircle className={iconClassName} />,
    },
  ].filter((i) => i.href !== "");
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((i) => (
        <li key={i.key}>
          <a
            href={i.href}
            target="_blank"
            rel="noreferrer"
            aria-label={i.label}
            title={i.label}
            className={cn("inline-flex size-9 items-center justify-center transition-colors hover:text-primary", linkClassName)}
          >
            {i.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
