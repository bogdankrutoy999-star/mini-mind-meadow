import { describe, expect, it } from "vitest";
import { cancellableChatStream, isChatAbort } from "@/lib/chat-stream";

describe("Chat cancellation", () => {
  it("recognizes aborts before response headers arrive", () => {
    expect(isChatAbort(new DOMException("Stopped", "AbortError"), new AbortController().signal)).toBe(true);
  });

  it("ends a cancelled upstream stream without throwing", async () => {
    const upstream = new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new DOMException("Stopped", "AbortError")); },
    });
    const reader = cancellableChatStream(upstream, new AbortController().signal).getReader();
    await expect(reader.read()).resolves.toEqual({ done: true, value: undefined });
  });

  it("preserves real stream failures", async () => {
    const failure = new Error("Connection lost");
    const upstream = new ReadableStream<Uint8Array>({ start(controller) { controller.error(failure); } });
    const reader = cancellableChatStream(upstream, new AbortController().signal).getReader();
    await expect(reader.read()).rejects.toThrow("Connection lost");
  });

  it("forwards successful stream bytes unchanged", async () => {
    const bytes = new TextEncoder().encode("data: hello\n\n");
    const upstream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } });
    const reader = cancellableChatStream(upstream, new AbortController().signal).getReader();
    expect((await reader.read()).value).toEqual(bytes);
    expect((await reader.read()).done).toBe(true);
  });
});