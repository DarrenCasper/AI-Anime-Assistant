import { isOverviewRequest } from "./queryIntentService.js";

export function buildChatUiAction(userMessage, animeResults, contextInfo = {}) {
  if (!animeResults || animeResults.length === 0) {
    return {
      type: "none",
      data: {}
    };
  }

  if (contextInfo.mode === "overview") {
    return {
      type: "anime_overview",
      data: {
        anime: animeResults[0]
      }
    };
  }

  if (isOverviewRequest(userMessage)) {
    return {
      type: "anime_overview",
      data: {
        anime: animeResults[0]
      }
    };
  }

  return {
    type: "anime_cards",
    data: {
      items: animeResults
    }
  };
}