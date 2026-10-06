"use client";
import { createContext, useContext, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PanelPage } from "./PanelPage";

const CloseContext = createContext<() => void>(() => {});

/**
 * Yeni kayıt formunun içinden paneli kapatmak için. Form bir panelin içinde
 * değilse (satır içi düzenleme) boş bir fonksiyon döner; çağırmak zararsız.
 */
export function useNewRecordClose() {
  return useContext(CloseContext);
}

/**
 * Liste sayfalarının ortak kurgusu: başlık ve sağda "Yeni …" düğmesi; düğme
 * basılınca listenin üstünde kenarlıklı bir form paneli açılır, "Kapat" ya da
 * başarılı kayıt (`useNewRecordClose`) kapatır. Liste önce gelir, form ancak
 * istenince. Sunucu sayfası formu hazır bir öğe olarak verir (`form`), paneli
 * kapatma işlevi forma context ile ulaşır.
 */
export function NewRecordPanel({
  pageTitle,
  description,
  label,
  title,
  form,
  children,
  width,
}: {
  pageTitle: React.ReactNode;
  description?: React.ReactNode;
  /** Düğme metni ("Yeni hizmet"). */
  label: string;
  /** Açılan panelin başlığı; çoğu zaman düğmeyle aynı metin. */
  title: string;
  form: React.ReactNode;
  children: React.ReactNode;
  width?: "default" | "narrow";
}) {
  const t = useTranslations("panel.common");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <PanelPage
      title={pageTitle}
      description={description}
      width={width}
      action={
        <Button onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Plus aria-hidden />
          {label}
        </Button>
      }
    >
      {open && (
        <section className="rounded-[var(--radius)] border border-border p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-medium">{title}</h2>
            <Button variant="ghost" size="sm" onClick={close}>
              <X aria-hidden />
              {t("close")}
            </Button>
          </div>
          <CloseContext.Provider value={close}>{form}</CloseContext.Provider>
        </section>
      )}
      {children}
    </PanelPage>
  );
}
