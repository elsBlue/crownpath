import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { unreadCount, useNotices } from "@/lib/e7/notices";
import { NOTICE_KIND_LABEL, type Notice } from "@/lib/e7/types";
import { cn } from "@/lib/utils";

function useWide() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

function ago(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(at).toLocaleDateString();
}

export function UpdateInbox() {
  const items = useNotices((s) => s.items);
  const loaded = useNotices((s) => s.loaded);
  const refresh = useNotices((s) => s.refresh);
  const markRead = useNotices((s) => s.markRead);
  const markAll = useNotices((s) => s.markAll);
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const wide = useWide();
  const unread = unreadCount(items);

  useEffect(() => {
    void refresh();
    const tick = window.setInterval(() => void refresh(), 90_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    if (!loaded) return;
    const fresh = items.filter((n) => !n.read);
    if (fresh.length === 0) return;
    const key = `${fresh[0].id}:${fresh.length}`;
    try {
      if (sessionStorage.getItem("crownpath-notice-toast") === key) return;
      sessionStorage.setItem("crownpath-notice-toast", key);
    } catch {
      /* private mode */
    }
    toast(fresh[0].title, {
      description:
        fresh.length === 1
          ? `${NOTICE_KIND_LABEL[fresh[0].kind]} · ${ago(fresh[0].at)}`
          : `${fresh.length} updates · ${NOTICE_KIND_LABEL[fresh[0].kind]}`,
    });
  }, [loaded, items]);

  return (
    <>
      <button
        type="button"
        aria-label={unread > 0 ? `Updates, ${unread} unread` : "Updates"}
        onClick={() => setOpen(true)}
        className="relative grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-4" strokeWidth={unread > 0 ? 2 : 1.75} />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] leading-none text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) void refresh();
          else setOpenId(null);
        }}
      >
        <SheetContent side={wide ? "right" : "bottom"} className="gap-0">
          <SheetHeader>
            <SheetTitle>Updates</SheetTitle>
            <SheetDescription>
              {unread > 0
                ? `${unread} unread. What changed in units, Scout, or the app.`
                : "Kit, Scout, and app notes from admin."}
            </SheetDescription>
          </SheetHeader>
          <div className="app-scroll min-h-0 flex-1 px-5 pr-12 pb-4">
            {!loaded ? (
              <p className="text-sm text-muted-foreground">Loading updates…</p>
            ) : items.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-5 text-sm leading-relaxed text-muted-foreground">
                No updates yet. When a kit or Scout change lands, it shows up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((n) => (
                  <NoticeRow
                    key={n.id}
                    notice={n}
                    open={openId === n.id}
                    onToggle={() => {
                      setOpenId((cur) => (cur === n.id ? null : n.id));
                      if (!n.read) void markRead(n.id);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
          {unread > 0 ? (
            <div className="shrink-0 border-t border-border/80 px-5 py-3">
              <Button variant="secondary" onClick={() => void markAll()}>
                Mark all read
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NoticeRow({
  notice,
  open,
  onToggle,
}: {
  notice: Notice;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full flex-col rounded-xl bg-secondary px-4 py-3 text-left",
          !notice.read && "shadow-[var(--shadow-border)]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {NOTICE_KIND_LABEL[notice.kind]}
              {!notice.read ? " · New" : ""}
            </p>
            <p className="mt-0.5 text-sm leading-snug">{notice.title}</p>
          </div>
          <p className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{ago(notice.at)}</p>
        </div>
        {open ? (
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {notice.body}
          </p>
        ) : (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
        )}
      </button>
    </li>
  );
}
