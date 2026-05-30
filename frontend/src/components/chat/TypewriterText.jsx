import { useEffect, useState } from "react";

export default function TypewriterText({ text = "", speed = 12 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");

    if (!text) return;

    let index = 0;

    const interval = setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {displayedText.length < text.length && (
        <span className="ml-1 animate-pulse">▍</span>
      )}
    </p>
  );
}