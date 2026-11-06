import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildChatRequest, GEMINI_CHAT_MODEL } from "@/lib/chat-request";
import { isChatAbort } from "@/lib/chat-stream";
import { GEMINI_API_BASE, GEMINI_KEY_MISSING, geminiError, geminiStream } from "@/lib/gemini";

const Body = z.object({ messages: z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(20000),
  images: z.array(z.string().regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/).max(8_000_000)).max(4).optional(),
})).min(1).max(100) });

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: async ({ request }) => {
    try {
      if (request.signal.aborted) return new Response(null, { status: 499 });
      const parsed = Body.safeParse(await request.json());
      if (!parsed.success) return Response.json({ error: "Некорректное сообщение или слишком большой запрос." }, { status: 400 });
      const apiKey = process.env["GEMINI_API_KEY"];
      if (!apiKey) return Response.json({ error: GEMINI_KEY_MISSING }, { status: 503 });
      const upstream = await fetch(`${GEMINI_API_BASE}/${GEMINI_CHAT_MODEL}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(buildChatRequest(parsed.data.messages)),
        signal: request.signal,
      });
      if (!upstream.ok) {
        await upstream.body?.cancel();
        return Response.json({ error: geminiError(upstream.status) }, { status: upstream.status });
      }
      if (!upstream.body) return Response.json({ error: "Gemini не вернул ответ." }, { status: 502 });
      return new Response(geminiStream(upstream.body, request.signal, "chat"), {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform" },
      });
    } catch (error) {
      if (isChatAbort(error, request.signal)) return new Response(null, { status: 499 });
      if (error instanceof SyntaxError) return Response.json({ error: "Некорректный запрос." }, { status: 400 });
      return Response.json({ error: "Не удалось подключиться к Google Gemini. Проверьте доступность API." }, { status: 502 });
    }
  } } },
});