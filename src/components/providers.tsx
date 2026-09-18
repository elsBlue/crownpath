import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getArena, getCatalog } from "@/lib/e7/api";
import { useCatalog } from "@/lib/e7/catalog";
import { useNotices } from "@/lib/e7/notices";
import { useArenaStore } from "@/lib/e7/store";

function HydrateArena() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      useArenaStore.getState().resetSession();
      useNotices.getState().reset();
      return;
    }
    let cancelled = false;
    void useNotices.getState().refresh();
    Promise.all([getCatalog(), getArena()])
      .then(([catalog, arena]) => {
        if (cancelled) return;
        useCatalog.getState().setCatalog(catalog);
        useArenaStore.getState().applyServer(arena);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        if (message === "Unauthorized") {
          useArenaStore.getState().resetSession();
          return;
        }
        useArenaStore.setState({ hydrated: true });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, isPending]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <HydrateArena />
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
