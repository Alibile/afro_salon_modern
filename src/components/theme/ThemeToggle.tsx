"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Bilinen next-themes hidrasyon deseni: sunucu/istemci ilk render uyuşmazlığını önlemek için mount sonrası bayrak.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" aria-label="Tema" />;
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label={dark ? "Açık moda geç" : "Koyu moda geç"} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
