import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { telHref } from "@/components/brand/SocialLinks";
import { ImageSlot } from "@/components/brand/ImageSlot";
import type { ShopStatus } from "@/lib/shop-status";
import { cn } from "@/lib/utils";

export function Hero({ status, address, phone }: { status: ShopStatus; address: string; phone: string }) {
  const open = status.isOpenToday && status.text.startsWith("Bugün açık");
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] overflow-hidden bg-primary/8 text-primary md:block">
        <AfroPattern variant="tarak" size={96} opacity={0.12} />
      </div>
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pb-16 pt-8 md:grid-cols-12 md:gap-10 md:pb-28 md:pt-16">
        <div className="md:col-span-7 md:pr-10">
          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className={cn("size-2 shrink-0 rounded-full", open ? "bg-success" : "bg-primary")} />
            {status.text}
          </p>
          <h1 className="display-hero mt-7">KIVRIMIN KENDİ GEOMETRİSİ VAR.</h1>
          <p className="editorial-note mt-7 max-w-[34ch] text-xl text-primary md:text-2xl">
            Erkeklere özel afro kesim, fade, örgü ve twist — hepsi bugünün içinde.
          </p>
          <p className="measure mt-5 leading-relaxed text-muted-foreground">
            Yarına söz vermiyoruz. Bugünün boş saatlerini burada görür, berberini seçer, iki dakikada yerini ayırırsın.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Button asChild size="lg" className="h-12 rounded-none px-7 text-base">
              <Link href="/randevu">Bugün randevu al</Link>
            </Button>
            <a href="#hizmetler" className="border-b border-foreground/30 pb-1 text-base transition-colors hover:border-foreground">
              Hizmetler ve fiyatlar
            </a>
          </div>
          <div className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
            <p>{address}</p>
            <a href={telHref(phone)} className="mt-1 inline-block underline underline-offset-4 hover:text-foreground">
              {phone}
            </a>
          </div>
        </div>
        <div className="md:col-span-5 md:pt-20">
          <figure>
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-border">
              <ImageSlot
                name="hero.jpg"
                alt="Salonda tamamlanmış bir afro kesim"
                sizes="(min-width: 768px) 40vw, 100vw"
                variant="kente"
                priority
              />
            </div>
            <figcaption className="editorial-note mt-3 text-sm text-muted-foreground">
              Her saç kendi düzenini kurar; biz o düzeni açığa çıkarırız.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
