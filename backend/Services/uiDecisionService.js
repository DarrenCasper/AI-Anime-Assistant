import { isOverviewRequest } from "./queryIntentService.js";

export function buildChatUiAction(userMessage, results, contextInfo = {}) {
  if (!results || results.length === 0) {
    return {
      type: "none",
      data: {}
    };
  }

  const isManga = contextInfo.mediaType === "manga";

  if (contextInfo.mode === "character_overview") {
    return {
      type: "character_overview",
      data: {
        character: results[0]
      }
    };
  }

  if (contextInfo.mode === "characters") {
    return {
      type: "character_cards",
      data: {
        items: results,
        anime: contextInfo.seedAnime || null,
        isDisambiguation: contextInfo.characterDisambiguation || false
      }
    };
  }

  if (isManga && contextInfo.mode === "manga_overview") {
    return {
      type: "manga_overview",
      data: {
        manga: results[0]
      }
    };
  }

  if (
    isManga &&
    (contextInfo.mode === "overview" || isOverviewRequest(userMessage))
  ) {
    return {
      type: "manga_overview",
      data: {
        manga: results[0]
      }
    };
  }

  if (contextInfo.mode === "overview") {
    return {
      type: "anime_overview",
      data: {
        anime: results[0]
      }
    };
  }

  if (!isManga && isOverviewRequest(userMessage)) {
    return {
      type: "anime_overview",
      data: {
        anime: results[0]
      }
    };
  }

  if (isManga) {
    return {
      type: "manga_cards",
      data: {
        items: results
      }
    };
  }

  return {
    type: "anime_cards",
    data: {
      items: results
    }
  };
}