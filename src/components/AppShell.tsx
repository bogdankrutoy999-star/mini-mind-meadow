import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ImageIcon, Menu, MessageSquare, Plus, Settings, Trash2, X } from "lucide-react";
import { Logo } from "./Logo";
import { deleteThread, newThreadId, useThreads } from "@/lib/chat-store";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const threads = useThreads();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };

  const startNew = () => {
    setOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: newThreadId() } });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {open && <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-sidebar transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Logo size={38} />
            <span className="font-display text-xl font-bold text-brand">Mini</span>
          </Link>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-2 px-3">
          <button onClick={startNew} className="flex w-full items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
            <Plus className="size-4" /> New chat
          </button>
          <Link to="/images" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-accent" activeProps={{ className: "bg-accent" }}>
            <ImageIcon className="size-4" /> Image generation
          </Link>
        </div>
        <div className="mt-4 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">History</div>
        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {threads.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet</p>}
          {threads.map((t) => (
            <div key={t.id} className={`group flex items-center rounded-lg ${params.threadId === t.id ? "bg-accent" : "hover:bg-accent/60"}`}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm">
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                aria-label="Delete chat"
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                onClick={() => {
                  deleteThread(t.id);
                  if (params.threadId === t.id) navigate({ to: "/" });
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t p-2">
          <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent" activeProps={{ className: "bg-accent" }}>
            <Settings className="size-4" /> Settings
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <button className="rounded-lg p-2 hover:bg-accent" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Logo size={28} />
          <span className="font-display font-bold text-brand">Mini</span>
          <button onClick={startNew} className="ml-auto rounded-lg p-2 hover:bg-accent" aria-label="New chat">
            <Plus className="size-5" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
