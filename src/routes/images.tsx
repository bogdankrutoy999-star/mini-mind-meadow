import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Download, ImageIcon, Sparkle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { streamImage } from "@/lib/stream-image";
import { IMAGE_FREE_LIMIT, buildImagePrompt, IMAGE_STYLES, type ImageStyle } from "@/lib/image-studio";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image Studio — Mini AI" },
      { name: "description", content: "Create images from a text description with Mini's Image Studio." },
      { property: "og:title", content: "Image Studio — Mini AI" },
      { property: "og:description", content: "Describe a picture and Mini will draw it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImagesPage,
});

const USED_KEY = "mini.images.used";
const SIZES = [
  { id: "1024x1024", label: "1:1" },
  { id: "1536x1024", label: "16:9" },
  { id: "1024x1536", label: "9:16" },
] as const;

function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<ImageStyle>("none");
  const [size, setSize] = useState<(typeof SIZES)[number]["id"]>("1024x1024");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [used, setUsed] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setUsed(Number(localStorage.getItem(USED_KEY) || 0)); }, []);
  const left = Math.max(0, IMAGE_FREE_LIMIT - used);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || busy || left <= 0) return;
    setBusy(true); setError(null); setImage(null); setFinal(false);
    try {
      await streamImage("/api/image", { prompt: buildImagePrompt(prompt, style), size, quality }, (url, isFinal) => {
        setImage(url); if (isFinal) setFinal(true);
      });
      const n = used + 1;
      setUsed(n); localStorage.setItem(USED_KEY, String(n));
    } catch (err) {
      const msg = (err as Error).message;
      const m = msg.match(/\{.*\}/);
      try { setError(m ? JSON.parse(m[0]).error : msg); } catch { setError(msg); }
    } finally { setBusy(false); }
  }

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand shadow-glow">
              <ImageIcon className="size-8 text-primary-foreground" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">Image <span className="text-brand">Studio</span></h1>
            <p className="mt-2 text-muted-foreground">Опиши картинку — и Mini её нарисует.</p>
            <p className="mt-3 inline-block rounded-full border bg-card px-3 py-1 text-sm">
              Осталось генераций: <b className="text-brand">{left}</b> / {IMAGE_FREE_LIMIT}
            </p>
          </div>

          <form onSubmit={generate} className="mt-6 space-y-4 rounded-2xl border bg-card p-4 shadow-glow">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              placeholder="Милый неоновый 3D-робот Mini пьёт какао на Марсе…"
              className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground" />
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Стиль</p>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLES.map((s) => <button type="button" key={s.id} onClick={() => setStyle(s.id)} className={chip(style === s.id)}>{s.label}</button>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Формат</p>
                <div className="flex gap-2">{SIZES.map((s) => <button type="button" key={s.id} onClick={() => setSize(s.id)} className={chip(size === s.id)}>{s.label}</button>)}</div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Качество</p>
                <div className="flex gap-2">
                  {([["low", "Быстро"], ["medium", "Обычное"], ["high", "Высокое"]] as const).map(([id, l]) =>
                    <button type="button" key={id} onClick={() => setQuality(id)} className={chip(quality === id)}>{l}</button>)}
                </div>
              </div>
            </div>
            <button disabled={busy || !prompt.trim() || left <= 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-primary-foreground disabled:opacity-40">
              <Sparkle className="size-4" /> {busy ? "Рисую…" : left <= 0 ? "Генерации закончились" : "Сгенерировать"}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
            </div>
          )}
          {(image || busy) && (
            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
              {image ? (
                <img src={image} alt={prompt} className={`w-full transition duration-500 ${final ? "" : "blur-md"}`} />
              ) : (
                <div className="flex aspect-square items-center justify-center text-muted-foreground animate-pulse">Mini рисует…</div>
              )}
              {final && image && (
                <a href={image} download="mini-image.png" className="flex items-center justify-center gap-2 p-3 text-sm hover:bg-accent">
                  <Download className="size-4" /> Скачать
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
