import { useSyncExternalStore } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string; images?: string[] | undefined };
export type Thread = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

const KEY = "mini.threads.v1";
const EVT = "mini-threads";
let cache: Thread[] | null = null;

function read(): Thread[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: Thread[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full: drop images from older chats and retry.
    const slim = next.map((t, i) => (i === 0 ? t : { ...t, messages: t.messages.map(({ images, ...m }) => (images ? { ...m, content: m.content + " [фото]" } : m)) }));
    try { localStorage.setItem(KEY, JSON.stringify(slim)); } catch {}
  }
  window.dispatchEvent(new Event(EVT));
}

const EMPTY: Thread[] = [];
export function useThreads(): Thread[] {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVT, cb);
      return () => window.removeEventListener(EVT, cb);
    },
    read,
    () => EMPTY,
  );
}

export function getThread(id: string) {
  return read().find((t) => t.id === id);
}

export function newThreadId() {
  return crypto.randomUUID().slice(0, 12);
}

export function saveMessages(id: string, messages: ChatMessage[]) {
  const all = read();
  const existing = all.find((t) => t.id === id);
  const firstUser = messages.find((m) => m.role === "user")?.content ?? "New chat";
  const title = existing && existing.title !== "New chat" ? existing.title : firstUser.slice(0, 48);
  const thread: Thread = { id, title, updatedAt: Date.now(), messages };
  write([thread, ...all.filter((t) => t.id !== id)]);
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function clearAllThreads() {
  write([]);
}
