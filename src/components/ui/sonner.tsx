import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
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
