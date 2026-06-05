import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/api/chatApi";
import { getCharacterOverview } from "@/api/characterApi";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
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
    const timestamp = Date.now();
    const loadingMessageId = `loading-${timestamp}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${timestamp}`,
        role: "user",
        content: userText,
        ui: null,
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
                meta: data.meta,
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

  async function handleCharacterSelect(character) {
    if (!character?.id || loading) return;

    const loadingMessageId = `character-loading-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        ui: null,
        animate: false,
        loading: true
      }
    ]);

    setLoading(true);

    try {
      const data = await getCharacterOverview(character.id);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: data.reply,
                ui: data.ui,
                meta: data.meta,
                animate: false,
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
                content: error.message || "Failed to load character overview.",
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

  async function handleAnimeSelect(anime, targetAction = "overview") {
    if (!anime?.id || loading) return;

    const userText =
      targetAction === "trailer"
        ? `Show trailer for ${anime.title}`
        : targetAction === "episodes"
          ? `Show episodes for ${anime.title}`
          : `Show overview for ${anime.title}`;

    const timestamp = Date.now();
    const loadingMessageId = `anime-action-loading-${timestamp}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-anime-action-${timestamp}`,
        role: "user",
        content: userText,
        ui: null,
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

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/anime-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          animeId: anime.id,
          action: targetAction
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load anime action.");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: data.reply,
                ui: data.ui,
                meta: data.meta,
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
                content: error.message || "Failed to load anime action.",
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

  function handleSuggestionClick(text) {
    if (loading) return;
    setInput(text);
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#050510] text-white">
      <div className="flex h-full">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#080812]/95 p-5 lg:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AniMate</h1>
            <p className="mt-1 text-sm text-white/50">AI Anime Assistant</p>
          </div>

          <Button
            className="mt-8 w-full rounded-2xl"
            variant="secondary"
            onClick={() => setMessages([])}
          >
            New Chat
          </Button>

          <div className="mt-8 space-y-3 text-sm text-white/50">
            <p className="font-medium text-white/70">Try asking:</p>

            <button
              type="button"
              onClick={() => handleSuggestionClick("Recommend anime like Naruto")}
              className="block text-left hover:text-white"
            >
              Recommend anime like Naruto
            </button>

            <button
              type="button"
              onClick={() => handleSuggestionClick("Give me popular romance anime")}
              className="block text-left hover:text-white"
            >
              Give me popular romance anime
            </button>

            <button
              type="button"
              onClick={() => handleSuggestionClick("Show me characters in Jujutsu Kaisen")}
              className="block text-left hover:text-white"
            >
              Show me characters in Jujutsu Kaisen
            </button>

            <button
              type="button"
              onClick={() => handleSuggestionClick("Tell me about Death Note")}
              className="block text-left hover:text-white"
            >
              Tell me about Death Note
            </button>
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
              {messages.length === 0 && (
                <div className="flex min-h-[55vh] items-center justify-center">
                  <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/6 p-6 text-center shadow-2xl shadow-black/20 backdrop-blur">
                    <p className="text-sm font-medium text-violet-300">
                      AniMate
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                      What anime do you want to explore?
                    </h1>

                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/50">
                      Ask for recommendations, anime overviews, seasonal anime,
                      popular titles, trailers, episodes, manga, or characters.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[
                        "Recommend anime like Naruto",
                        "Current season romance anime",
                        "Tell me about Jujutsu Kaisen",
                        "Show trailer for Jujutsu Kaisen",
                        "Show episodes for Jujutsu Kaisen"
                      ].map((text) => (
                        <button
                          key={text}
                          type="button"
                          onClick={() => handleSuggestionClick(text)}
                          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/70 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onCharacterSelect={handleCharacterSelect}
                  onAnimeSelect={handleAnimeSelect}
                />
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