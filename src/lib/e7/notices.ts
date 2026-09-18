import { create } from "zustand";
import { listNotices, markAllNoticesRead, markNoticeRead } from "./api";
import type { Notice } from "./types";

type NoticeState = {
  items: Notice[];
  loaded: boolean;
  reset: () => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
};

export const useNotices = create<NoticeState>((set, get) => ({
  items: [],
  loaded: false,
  reset: () => set({ items: [], loaded: false }),
  refresh: async () => {
    try {
      const items = await listNotices();
      set({ items, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  markRead: async (id: string) => {
    const prev = get().items;
    if (prev.find((n) => n.id === id)?.read) return;
    set({ items: prev.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    try {
      const items = await markNoticeRead({ data: { id } });
      set({ items, loaded: true });
    } catch {
      set({ items: prev });
    }
  },
  markAll: async () => {
    const prev = get().items;
    if (prev.every((n) => n.read)) return;
    set({ items: prev.map((n) => ({ ...n, read: true })) });
    try {
      const items = await markAllNoticesRead();
      set({ items, loaded: true });
    } catch {
      set({ items: prev });
    }
  },
}));

export function unreadCount(items: Notice[]): number {
  return items.filter((n) => !n.read).length;
}
