import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isChatAbort } from "@/lib/chat-stream";

const Body = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).default("medium"),
  stream: z.boolean().default(true),
});

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
          let b;
          try { b = Body.parse(await request.json()); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
            body: JSON.stringify({
              model: "openai/gpt-image-2.5-sunburst",
              prompt: b.prompt,
              size: b.size,
              quality: b.quality,
              ...(b.stream ? { stream: true, partial_images: 1 } : {}),
            }),
            signal: request.signal,
          });
          if (!upstream.ok || !upstream.body) {
            const text = await upstream.text();
            let message = "Не удалось создать изображение.";
            if (upstream.status === 429) message = "Слишком много запросов — подождите немного.";
            else if (upstream.status === 402) message = "Закончились AI-кредиты.";
            else { try { message = JSON.parse(text)?.error?.message || message; } catch {} }
            return Response.json({ error: message }, { status: upstream.status });
          }
          if (!b.stream) {
            const data = await upstream.json();
            const b64 = data?.data?.[0]?.b64_json;
            const sse = `event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", b64_json: b64 })}\n\n`;
            return new Response(sse, { headers: { "Content-Type": "text/event-stream" } });
          }
          return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
        } catch (error) {
          if (isChatAbort(error, request.signal)) return new Response(null, { status: 499 });
          return Response.json({ error: "Сервис изображений недоступен." }, { status: 502 });
        }
      },
    },
  },
});
