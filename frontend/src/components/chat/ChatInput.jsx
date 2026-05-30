import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatInput({ input, setInput, onSend, loading }) {
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="border-t border-white/10 bg-[#080812]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for anime recommendations..."
          className="min-h-12 resize-none rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-white/35 focus-visible:ring-violet-500"
        />

        <Button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="rounded-2xl px-6"
        >
          {loading ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  );
}