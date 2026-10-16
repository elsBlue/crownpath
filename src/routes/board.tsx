import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/e7/app-shell";
import { BoardView } from "@/components/e7/board-view";
import { RequireAuth } from "@/components/e7/require-auth";

export const Route = createFileRoute("/board")({ component: BoardPage });

function BoardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <BoardView />
      </AppShell>
    </RequireAuth>
  );
}
