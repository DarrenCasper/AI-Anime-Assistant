import ChatActionRenderer from "./ChatActionRenderer";
import TypewriterText from "./TypewriterText";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatMessage({
  message,
  onCharacterSelect,
  onAnimeSelect,
  onPersonSelect
}) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div className={isUser ? "flex justify-start" : "flex justify-end"}>
      <div
        className={
          isUser
            ? "max-w-[80%] sm:max-w-[70%] lg:max-w-[55%]"
            : "w-full max-w-[95%] sm:max-w-[88%] lg:max-w-[78%]"
        }
      >
        <div
          className={
            isUser
              ? "rounded-3xl rounded-bl-md bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-950/30"
              : "rounded-3xl rounded-br-md border border-white/10 bg-white/[0.07] px-5 py-4 text-sm leading-7 text-white/90 shadow-xl shadow-black/20 backdrop-blur"
          }
        >
          {message.loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                AniMate is thinking...
              </div>

              <Skeleton className="h-4 w-[90%] bg-white/10" />
              <Skeleton className="h-4 w-[75%] bg-white/10" />
              <Skeleton className="h-4 w-[55%] bg-white/10" />
            </div>
          ) : isAssistant && message.animate ? (
            <TypewriterText text={message.content} speed={8} />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {isAssistant && !message.loading && (
          <ChatActionRenderer
            ui={message.ui}
            onCharacterSelect={onCharacterSelect}
            onAnimeSelect={onAnimeSelect}
            onPersonSelect={onPersonSelect}
          />
        )}
      </div>
    </div>
  );
}