import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildChatRequest } from "@/lib/chat-request";
import { cancellableChatStream, isChatAbort } from "@/lib/chat-stream";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20000),
        images: z.array(z.string().startsWith("data:image/").max(8_000_000)).max(4).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
        if (request.signal.aborted) return new Response(null, { status: 499 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured on the server." }, { status: 500 });

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (error) {
          if (isChatAbort(error, request.signal)) return new Response(null, { status: 499 });
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify(buildChatRequest(parsed.messages)),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          let message = "The AI service returned an error.";
          if (upstream.status === 429) message = "Too many requests — please wait a moment and try again.";
          else if (upstream.status === 402) message = "AI credits have run out for this workspace.";
          else {
            try { message = JSON.parse(text)?.error?.message || JSON.parse(text)?.message || message; } catch {}
          }
          console.error("AI error", upstream.status, text);
          return Response.json({ error: message }, { status: upstream.status });
        }

        return new Response(cancellableChatStream(upstream.body, request.signal), {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
        } catch (error) {
          if (isChatAbort(error, request.signal)) return new Response(null, { status: 499 });
          return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
        }
      },
    },
  },
});
