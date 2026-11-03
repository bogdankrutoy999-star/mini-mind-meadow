import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(20000),
      }),
    )
    .min(1)
    .max(100),
});

const SYSTEM = `You are Mini, a friendly, helpful AI assistant. You help with general questions, programming, clear explanations, brainstorming and casual conversation. Answer in the language the user writes in. Use Markdown formatting (code blocks with language tags, lists) where helpful. Be concise but thorough.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured on the server." }, { status: 500 });

        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: SYSTEM }, ...parsed.messages],
          }),
          signal: request.signal,
        }).catch(() => null);

        if (!upstream) return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
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

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
