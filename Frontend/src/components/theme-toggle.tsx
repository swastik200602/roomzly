import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

function getInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("roomzly-theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", t === "light");
  root.style.colorScheme = t;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = getInitial();
    setTheme(t);
    applyTheme(t);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem("roomzly-theme", next);
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={
        "size-9 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors " +
        className
      }
      suppressHydrationWarning
    >
      {mounted ? (
        theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
