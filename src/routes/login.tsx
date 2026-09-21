import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/e7/brand";
import { BootScreen } from "@/components/e7/boot-screen";
import { Atmosphere } from "@/components/e7/atmosphere";
import { ThemeToggle } from "@/components/e7/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function authErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : "Could not sign in";
  const m = raw.toLowerCase();
  if (m.includes("already") || m.includes("exists")) return "That email already has an account. Sign in instead.";
  if (m.includes("invalid") || m.includes("credential") || m.includes("incorrect")) {
    return "Wrong email or password.";
  }
  if (m.includes("password") && m.includes("8")) return "Password must be at least 8 characters.";
  return raw;
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) return <BootScreen label="Checking session…" />;
  if (user) {
    void navigate({ to: "/" });
    return <BootScreen />;
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const mail = email.trim().toLowerCase();
      if (mode === "up") {
        const signed = await authClient.signUp.email({
          email: mail,
          password,
          name: name.trim() || mail.split("@")[0]!,
        });
        if (signed.error) throw new Error(signed.error.message ?? "Could not create account");
        await authClient.getSession();
        await navigate({ to: "/" });
        return;
      }
      const result = await authClient.signIn.email({ email: mail, password });
      if (result.error) throw new Error(result.error.message ?? "Could not sign in");
      await authClient.getSession();
      await navigate({ to: "/" });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid h-full min-h-full place-items-center bg-background px-4 text-foreground">
      <Atmosphere />
      <div className="absolute top-3 right-3 z-20">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Brand size="lg" />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in to save your roster, settings, and results on this account.
        </p>

        {!authEnabled ? (
          <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            <form onSubmit={onEmail} className="flex flex-col gap-3">
              {mode === "up" ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="nickname"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </div>
              {error ? <p className="text-sm text-loss">{error}</p> : null}
              <Button type="submit" className="h-12" disabled={busy}>
                {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
              </Button>
              <button
                type="button"
                className="h-11 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode(mode === "up" ? "in" : "up");
                  setError(null);
                }}
              >
                {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs tracking-wider text-muted-foreground uppercase">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="h-12"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
