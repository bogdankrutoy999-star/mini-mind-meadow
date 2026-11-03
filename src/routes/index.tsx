import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
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
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || sessionStorage.getItem("mini.recovery") === "active") void navigate({ to: "/reset-password", replace: true });
      else if (data.user) void navigate({ to: "/chat/$threadId", params: { threadId: newThreadId() }, replace: true });
      else void navigate({ to: "/auth", replace: true });
    }).catch(() => { if (active) void navigate({ to: "/auth", replace: true }); });
    return () => { active = false; };
  }, [navigate]);
  return (
    <AuthLayout title="Добро пожаловать"><p role="status" className="text-center text-muted-foreground">Загрузка…</p></AuthLayout>
  );
}
