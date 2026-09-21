import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isOwnerIdentity } from "@/lib/e7/owner";
import { useArenaStore } from "@/lib/e7/store";
import { BootScreen } from "./boot-screen";

const SEEN_KEY = "crownpath-shade";

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const hydrated = useArenaStore((s) => s.hydrated);
  const role = useArenaStore((s) => s.role);
  const email = useArenaStore((s) => s.email);
  const [introDone, setIntroDone] = useState(false);
  const [brief] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "4";
    } catch {
      return false;
    }
  });

  const ready = !isPending && !!user && hydrated;
  const showBoot = isPending || (user && (!hydrated || !introDone));

  useEffect(() => {
    if (!introDone) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "4");
    } catch {
      /* private mode */
    }
  }, [introDone]);

  if (showBoot) {
    return (
      <BootScreen
        canLeave={ready}
        brief={brief}
        onFinished={() => setIntroDone(true)}
      />
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (
    admin &&
    role !== "admin" &&
    !isOwnerIdentity(user.primaryEmail, user.displayName, email)
  ) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}
