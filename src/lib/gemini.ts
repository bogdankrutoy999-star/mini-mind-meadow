import { createParser } from "eventsource-parser";
import { isChatAbort } from "./chat-stream";

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_KEY_MISSING = "Gemini не подключён: добавьте серверный секрет GEMINI_API_KEY в настройках проекта → Secrets.";

export function geminiError(status: number) {
  if (status === 400) return "Google отклонил запрос. Проверьте параметры и доступность Gemini для вашего проекта.";
  if (status === 401) return "Google не принял ключ Gemini. Проверьте GEMINI_API_KEY.";
  if (status === 403) return "Google запретил доступ к Gemini. Проверьте права ключа и официальную доступность API в регионе.";
  if (status === 404) return "Выбранная модель Gemini недоступна в Google API. Требуется проверить её доступность.";
  if (status === 429) return "Достигнут лимит Google Gemini. Проверьте квоту и оплату в Google AI Studio или попробуйте позже.";
  return "Google Gemini временно недоступен. Попробуйте позже.";
}

export type GeminiChunk = {
  error?: { code?: number };
  promptFeedback?: { blockReason?: string };
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean; inlineData?: { data?: string; mimeType?: string } }[] };
    finishReason?: string;
    groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
  }[];
};

// Google SSE is translated to Mini's own events, keeping provider details off the UI.
export function geminiStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, mode: "chat" | "image") {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let cancelled = false;
  let ended = false;
  let output = false;
  const sources = new Map<string, string>();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      const fail = (message: string) => { if (!ended) { emit({ type: "error", error: { message } }); ended = true; } };
      const parser = createParser({ onEvent(event) {
        if (cancelled || ended) return;
        let chunk: GeminiChunk;
        try { chunk = JSON.parse(event.data) as GeminiChunk; }
        catch { fail("Получен некорректный ответ Gemini."); return; }
        if (chunk.error) { fail(geminiError(chunk.error.code ?? 502)); return; }
        if (chunk.promptFeedback?.blockReason) { fail("Gemini отказался отвечать на этот запрос."); return; }
        const candidate = chunk.candidates?.[0];
        for (const part of candidate?.content?.parts ?? []) {
          if (mode === "chat" && part.text && !part.thought) {
            output = true; emit({ type: "delta", text: part.text });
          }
          if (mode === "image" && part.inlineData?.data) {
            output = true;
            emit({ type: "image_generation.completed", b64_json: part.inlineData.data, mime_type: part.inlineData.mimeType ?? "image/png" });
          }
        }
        for (const entry of candidate?.groundingMetadata?.groundingChunks ?? []) {
          if (entry.web?.uri?.startsWith("https://")) sources.set(entry.web.uri, entry.web.title ?? entry.web.uri);
        }
        const finish = candidate?.finishReason;
        if (finish && finish !== "STOP") {
          fail(finish === "MAX_TOKENS" ? "Gemini достиг предела длины ответа; сохранена полученная часть." : "Gemini завершил запрос без полного ответа.");
        }
      } });
      try {
        while (!cancelled && !ended) {
          const chunk = await reader.read();
          if (chunk.done) break;
          parser.feed(decoder.decode(chunk.value, { stream: true }));
        }
        if (cancelled) return;
        parser.feed(decoder.decode());
        parser.reset({ consume: true });
        if (!ended && !signal.aborted) {
          if (!output) fail(mode === "chat" ? "Gemini не вернул текст ответа." : "Gemini не вернул изображение.");
          else {
            if (mode === "chat" && sources.size) emit({ type: "delta", text: "\n\n" + [...sources].map(([url, title], i) => `[${i + 1}. ${title.replace(/[\[\]]/g, "")}](${url})`).join("\n") });
            emit({ type: "done" });
          }
        }
        controller.close();
      } catch (error) {
        if (cancelled) return;
        if (!isChatAbort(error, signal)) fail("Соединение с Gemini прервано. Полученная часть ответа сохранена.");
        controller.close();
      } finally { await reader.cancel().catch(() => {}); }
    },
    async cancel(reason) { cancelled = true; await reader.cancel(reason).catch(() => {}); },
  });
}

export async function readMiniReply(body: ReadableStream<Uint8Array>, onText: (text: string) => void) {
  let completed = false;
  let failure: string | undefined;
  const parser = createParser({ onEvent(event) {
    try {
      const data = JSON.parse(event.data) as { type?: string; text?: string; error?: { message?: string } };
      if (data.type === "delta" && data.text) onText(data.text);
      if (data.type === "done") completed = true;
      if (data.type === "error") failure = data.error?.message ?? "Ошибка ответа Gemini.";
    } catch { failure = "Некорректный ответ сервера."; }
  } });
  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      parser.feed(decoder.decode(chunk.value, { stream: true }));
    }
    parser.feed(decoder.decode());
    parser.reset({ consume: true });
  } finally { await reader.cancel().catch(() => {}); }
  if (failure) throw new Error(failure);
  if (!completed) throw new Error("Ответ Gemini прервался. Полученная часть сохранена.");
}