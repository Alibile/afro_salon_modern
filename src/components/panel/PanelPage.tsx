import { cn } from "@/lib/utils";

/**
 * Panel sayfalarının ortak başı: başlık, isteğe bağlı açıklama ve sağda tek
 * birincil eylem. Telefonda eylem başlığın altına iner. İçerik `max-w-5xl`,
 * ayarlar ve profil gibi form sayfaları `narrow` ile `max-w-3xl`.
 */
export function PanelPage({
  title,
  description,
  action,
  children,
  width = "default",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  width?: "default" | "narrow";
}) {
  return (
    <div className={cn("w-full", width === "narrow" ? "max-w-3xl" : "max-w-5xl")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}
