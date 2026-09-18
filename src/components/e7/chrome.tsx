import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  children,
  extra,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {kicker}
        </p>
        {extra}
      </div>
      <h1 className="font-display text-2xl leading-[1.15] tracking-tight sm:text-3xl">{title}</h1>
      {children ? (
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{children}</p>
      ) : null}
    </header>
  );
}

export function FilterChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full px-3.5 text-sm",
        on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div
      className="grid border-y border-border/80 py-3"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn("px-2 first:pl-0 last:pr-0 sm:px-3", i > 0 && "border-l border-border/80")}
        >
          <p className="truncate text-[10px] tracking-[0.14em] text-muted-foreground uppercase sm:tracking-[0.16em]">{item.label}</p>
          <p className="mt-0.5 font-mono text-lg tabular-nums leading-none sm:text-xl">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function LetterHead({ letter }: { letter: string }) {
  return (
    <p
      id={`az-${letter}`}
      className="scroll-mt-3 px-1 pt-4 pb-1.5 text-xs font-medium tracking-[0.18em] text-muted-foreground"
    >
      {letter}
    </p>
  );
}

export function RowCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card px-4 py-5 text-sm leading-relaxed text-muted-foreground shadow-[var(--shadow-border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const PAGE = "flex flex-col gap-5";
export const TOOLBAR = "flex flex-wrap items-center gap-2";
export const LIST = "flex flex-col gap-1";
