import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { newThreadId } from "@/lib/chat-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini — Your friendly AI assistant" },
      { name: "description", content: "Chat with Mini, an AI assistant powered by Google Gemini for questions, code, and ideas." },
      { property: "og:title", content: "Mini — Your friendly AI assistant" },
      { property: "og:description", content: "Chat with Mini, an AI assistant powered by Google Gemini." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/chat/$threadId", params: { threadId: newThreadId() }, replace: true });
  }, [navigate]);
  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center"><Logo size={80} /></div>
    </AppShell>
  );
}
