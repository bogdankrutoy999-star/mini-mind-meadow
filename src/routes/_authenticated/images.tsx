import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageIcon, Sparkle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/images")({
  head: () => ({
    meta: [
      { title: "Image generation — Mini AI" },
      { name: "description", content: "Mini's image generation studio is coming soon." },
      { property: "og:title", content: "Image generation — Mini AI" },
      { property: "og:description", content: "Create images with Mini — coming soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImagesPage,
});

function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState(false);
  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-brand shadow-glow">
            <ImageIcon className="size-9 text-primary-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Image <span className="text-brand">Studio</span></h1>
          <p className="mt-2 text-muted-foreground">Describe a picture and Mini will draw it. This feature is coming soon.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) setNotice(true); }} className="mt-8 flex gap-2 rounded-2xl border bg-card p-2">
            <input value={prompt} onChange={(e) => { setPrompt(e.target.value); setNotice(false); }} placeholder="A neon robot drinking coffee on Mars…" className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground" />
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Sparkle className="size-4" /> Generate
            </button>
          </form>
          {notice && <p className="mt-4 text-sm text-muted-foreground">Image generation isn't switched on yet — it's ready to be connected.</p>}
        </div>
      </div>
    </AppShell>
  );
}
