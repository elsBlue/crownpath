import { Link, useRouterState } from "@tanstack/react-router";
import { Crosshair, LogOut, Settings2, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { isOwnerIdentity } from "@/lib/e7/owner";
import { useNotices } from "@/lib/e7/notices";
import { useArenaStore } from "@/lib/e7/store";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { Starfield } from "./starfield";
import { UpdateInbox } from "./update-inbox";

const NAV = [
  { to: "/", label: "Scout", icon: Crosshair },
  { to: "/roster", label: "Roster", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useCurrentUser();
  const role = useArenaStore((s) => s.role);
  const email = useArenaStore((s) => s.email);
  const isAdmin =
    role === "admin" || isOwnerIdentity(user?.primaryEmail, user?.displayName, email);
  const items = isAdmin
    ? [...NAV, { to: "/admin", label: "Admin", icon: Settings2 }]
    : NAV;

  return (
    <div className="relative flex h-full max-h-full flex-col overflow-hidden bg-background text-foreground">
      <Starfield />
      <header className="relative z-40 shrink-0 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="min-w-0">
            <Brand size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex min-w-0 items-center gap-1">
            <UpdateInbox />
            <AccountChip />
          </div>
        </div>
      </header>

      <main className="app-scroll relative z-10 min-h-0 flex-1 px-4 pt-6 pb-6 sm:px-6 md:pt-8 md:pb-16">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      <nav
        className="relative z-40 shrink-0 border-t border-border/80 bg-background/90 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={cn("grid h-14", items.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs tracking-wide",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function AccountChip() {
  const user = useCurrentUser();
  const role = useArenaStore((s) => s.role);
  const email = useArenaStore((s) => s.email);
  const shownEmail = email ?? user?.primaryEmail ?? null;
  const isAdmin =
    role === "admin" || isOwnerIdentity(user?.primaryEmail, user?.displayName, email);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  if (!user) return <div className="size-8 rounded-full bg-secondary" />;
  const label = user.displayName ?? user.primaryEmail ?? "Account";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 max-w-[9.5rem] items-center gap-2 rounded-full bg-secondary py-1 pr-3 pl-1 text-left"
      >
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 truncate text-xs">{label}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl bg-popover p-3 text-popover-foreground shadow-[var(--shadow-border)]"
        >
          <p className="truncate text-sm font-medium">{label}</p>
          {shownEmail ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{shownEmail}</p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Google / X session</p>
          )}
          {isAdmin ? (
            <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">Admin</p>
          ) : null}
          <div className="mt-3 flex flex-col gap-1">
            {isAdmin ? (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-secondary"
              >
                <Settings2 className="size-4" strokeWidth={1.75} />
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                setOpen(false);
                useArenaStore.getState().resetSession();
                useNotices.getState().reset();
                void signOut("/login").catch(() => setSigningOut(false));
              }}
              className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-loss hover:bg-secondary disabled:opacity-60"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
