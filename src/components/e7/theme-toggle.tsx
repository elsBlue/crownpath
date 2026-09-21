import { Leaf, Moon } from "lucide-react";
import { useTheme } from "@/lib/e7/theme";

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark sky" : "Switch to light breeze"}
      title={light ? "Dark sky" : "Light breeze"}
      className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {light ? (
        <Moon className="size-4" strokeWidth={1.75} />
      ) : (
        <Leaf className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
