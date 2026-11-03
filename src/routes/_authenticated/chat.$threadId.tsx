import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChatWindow } from "@/components/ChatWindow";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Mini AI" },
      { name: "description", content: "Your conversation with Mini, the Gemini-powered AI assistant." },
      { property: "og:title", content: "Chat — Mini AI" },
      { property: "og:description", content: "Your conversation with Mini." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  return (
    <AppShell>
      <ChatWindow key={threadId} threadId={threadId} />
    </AppShell>
  );
}
