export function isChatAbort(error: unknown, signal: AbortSignal) {
  return signal.aborted || (
    typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"
  );
}

// Explicit cancellation is a normal end of a response, not a server crash.
export function cancellableChatStream(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
  const reader = body.getReader();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (cancelled) return;
        if (chunk.done) controller.close();
        else controller.enqueue(chunk.value);
      } catch (error) {
        if (cancelled) return;
        if (isChatAbort(error, signal)) controller.close();
        else controller.error(error);
      }
    },
    async cancel(reason) {
      cancelled = true;
      try {
        await reader.cancel(reason);
      } catch (error) {
        if (!isChatAbort(error, signal)) throw error;
      }
    },
  });
}