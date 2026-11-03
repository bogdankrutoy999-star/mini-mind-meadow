import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, ArrowUp, ImageIcon, Square } from "lucide-react";
import { Logo } from "./Logo";
import { getThread, saveMessages, type ChatMessage } from "@/lib/chat-store";

const SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a Python function to reverse a linked list",
  "Brainstorm names for a coffee shop",
  "How do I stay focused while studying?",
];

export function ChatWindow({ threadId }: { threadId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(getThread(threadId)?.messages ?? []);
    setError(null);
    taRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    saveMessages(threadId, history);
    setInput("");
    setError(null);
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const payload = l.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (delta) {
              reply += delta;
              setMessages([...history, { role: "assistant", content: reply }]);
            }
          } catch {}
        }
      }
      if (!reply) throw new Error("Mini didn't return an answer. Please try again.");
      saveMessages(threadId, [...history, { role: "assistant", content: reply }]);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        if (reply) saveMessages(threadId, [...history, { role: "assistant", content: reply }]);
      } else {
        setError((e as Error).message);
        if (reply) saveMessages(threadId, [...history, { role: "assistant", content: reply }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      taRef.current?.focus();
    }
  }

  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";
  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center">
            <div className="float-slow"><Logo size={120} /></div>
            <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Hi, I'm <span className="text-brand">Mini</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Ask me anything — code, ideas, explanations, or just chat.</p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-primary/50 hover:bg-accent">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-bubble-foreground shadow-glow">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <Logo size={32} />
                  <div className="prose-mini min-w-0 flex-1 pt-0.5 text-[15px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ),
            )}
            {loading && !lastIsAssistant && (
              <div className="flex items-center gap-3">
                <Logo size={32} />
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>
      <div className="px-3 pb-4 pt-2">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-glow focus-within:border-primary/60"
        >
          <Link to="/images" title="Image generation" className="rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <ImageIcon className="size-5" />
          </Link>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            rows={1}
            placeholder="Message Mini…"
            className="max-h-48 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {loading ? (
            <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop" className="rounded-xl bg-secondary p-2.5 hover:bg-accent">
              <Square className="size-5" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Send" className="rounded-xl bg-brand p-2.5 text-primary-foreground transition disabled:opacity-40">
              <ArrowUp className="size-5" />
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">Mini is powered by Google Gemini and can make mistakes.</p>
      </div>
    </div>
  );
}
