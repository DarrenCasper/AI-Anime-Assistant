import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/api/chatApi";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi, I'm AniMate. Ask me for anime recommendations.",
      ui: null,
      animate: false,
      loading: false
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const loadingMessageId = `loading-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
        animate: false,
        loading: false
      },
      {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        ui: null,
        animate: false,
        loading: true
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(userText);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: data.reply,
                ui: data.ui,
                animate: true,
                loading: false
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: error.message || "Something went wrong.",
                ui: null,
                animate: true,
                loading: false
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#050510] text-white">
      <div className="flex h-full">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#080812]/95 p-5 lg:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AniMate</h1>
            <p className="mt-1 text-sm text-white/50">AI Anime Assistant</p>
          </div>

          <Button className="mt-8 w-full rounded-2xl" variant="secondary">
            New Chat
          </Button>

          <div className="mt-8 space-y-2 text-sm text-white/50">
            <p className="font-medium text-white/70">Try asking:</p>
            <p>Recommend anime like Naruto</p>
            <p>Best romance anime</p>
            <p>Anime like Sword Art Online</p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-white/10 bg-[#080812]/80 px-6 py-4 backdrop-blur">
            <h2 className="text-lg font-semibold">Anime Chat</h2>
            <p className="text-sm text-white/45">
              Ask, explore, and get anime recommendations.
            </p>
          </header>

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0">
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              loading={loading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}