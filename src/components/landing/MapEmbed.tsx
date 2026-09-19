"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { AfroPattern } from "@/components/brand/AfroPattern";

/**
 * Gömülü harita, ancak istenirse.
 *
 * Google'ın `output=embed` çerçevesi açılışta yüz kilobaytlarca betik ve üçüncü
 * taraf çerez getiriyor; ana sayfanın Lighthouse puanı da ziyaretçinin gizliliği
 * de bunu bedavaya vermiyor. Kutu önce desenli bir yer tutucudur; iframe ancak
 * düğmeye basılınca DOM'a girer, yani o ana kadar google.com'a **hiçbir istek
 * gitmez**. JavaScript hiç çalışmazsa kutu yer tutucu olarak kalır — yanındaki
 * "Haritada aç" bağlantısı zaten aynı konumu yeni sekmede açar.
 *
 * Adres boşsa kutu hiç basılmaz: boş bir sorguyla açılan harita İstanbul'un
 * ortasını gösterirdi.
 */
export function MapEmbed({ address }: { address: string }) {
  const t = useTranslations("landing.contact");
  const [loaded, setLoaded] = useState(false);
  const trimmed = address.trim();
  if (!trimmed) return null;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
  return (
    <div className="mt-10">
      <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-secondary text-primary sm:aspect-[16/10]">
        {loaded ? (
          <iframe
            title={t("mapFrameTitle", { address: trimmed })}
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <>
            <AfroPattern variant="tarak" size={88} opacity={0.12} />
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-secondary-foreground transition-colors hover:text-primary"
            >
              <MapPin aria-hidden className="size-7" />
              <span className="label border-b border-current pb-1">{t("mapLoad")}</span>
            </button>
          </>
        )}
      </div>
      {/* Not yalnızca yüklenmeden önce: harita açıldıktan sonra "istek gitmez"
          demek yanlış olurdu. */}
      {!loaded && <p className="mt-3 text-sm text-muted-foreground">{t("mapPrivacy")}</p>}
    </div>
  );
}
