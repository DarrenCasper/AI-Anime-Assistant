import { generateAnimeResponse as generateGeminiAnimeResponse } from "./LLMService.js";
import { generateOpenAIAnimeResponse } from "./OpenAIService.js";

export async function generateAIAnimeResponse(
  userMessage,
  animeResults,
  chatHistory = "",
  contextInfo = {}
) {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "openai") {
    return generateOpenAIAnimeResponse(
      userMessage,
      animeResults,
      chatHistory,
      contextInfo
    );
  }

  return generateGeminiAnimeResponse(
    userMessage,
    animeResults,
    chatHistory,
    contextInfo
  );
}