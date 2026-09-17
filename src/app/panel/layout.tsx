import { requireStaff } from "@/lib/auth-helpers";
import { PanelNav } from "@/components/panel/PanelNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <span className="font-display text-xl text-primary">Panel</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction}><Button variant="ghost" size="sm">Çıkış</Button></form>
          </div>
        </div>
        <PanelNav isAdmin={user.role === "ADMIN"} />
        <p className="px-4 pb-3 text-xs text-muted-foreground">{user.name}</p>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
