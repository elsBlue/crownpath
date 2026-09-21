import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/e7/theme";

function Toaster() {
  const theme = useTheme((s) => s.theme);
  return (
    <Sonner
      theme={theme}
      position="top-center"
      visibleToasts={3}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[min(22rem,calc(100vw-2rem))] max-w-[min(22rem,calc(100vw-2rem))] whitespace-normal bg-card text-foreground shadow-[var(--shadow-border)] border-0",
          title: "leading-snug",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export { Toaster };
