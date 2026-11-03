import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { applyTheme, getTheme, type Theme } from "@/lib/theme";
import { clearAllThreads } from "@/lib/chat-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Mini AI" },
      { name: "description", content: "Choose light or dark theme and manage your Mini chat history." },
      { property: "og:title", content: "Settings — Mini AI" },
      { property: "og:description", content: "Customize your Mini AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(getTheme()), []);
  const choose = (t: Theme) => { setTheme(t); applyTheme(t); };

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <section className="mt-8 rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Appearance</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([["dark", Moon, "Dark"], ["light", Sun, "Light"]] as const).map(([t, Icon, label]) => (
                <button
                  key={t}
                  onClick={() => choose(t)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 transition ${theme === t ? "border-primary bg-accent shadow-glow" : "hover:bg-accent"}`}
                >
                  <Icon className="size-5" /> {label}
                </button>
              ))}
            </div>
          </section>
          <section className="mt-6 rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Chat history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chats are saved in this browser only.</p>
            <button
              onClick={() => { if (confirm("Delete all chats?")) clearAllThreads(); }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/50 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" /> Clear all chats
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
