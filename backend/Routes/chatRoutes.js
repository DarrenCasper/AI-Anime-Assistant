import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import {
  searchAnime,
  searchAnimeAdvanced,
  getCurrentSeasonAnime,
  getUpcomingSeasonAnime,
  getSpecificSeasonAnime,
  getAnimeRecommendations,
  filterAnimeByTag,
  sortAnimeList
} from "../Services/JikanService.js";
import { generateAnimeResponse } from "../Services/LLMService.js";
import { buildChatUiAction } from "../Services/uiDecisionService.js";
import { parseAnimeRequest } from "../Services/queryIntentService.js";

const router = express.Router();

function getShownAnimeIdsFromMessages(messages, seedAnimeId) {
  const ids = [];

  for (const msg of messages) {
    const sameSeed =
      msg.meta?.seedAnime?.id &&
      String(msg.meta.seedAnime.id) === String(seedAnimeId);

    if (!sameSeed) continue;

    const items = msg.ui?.data?.items || [];

    for (const item of items) {
      if (item.id) ids.push(item.id);
    }
  }

  return ids;
}

function getShownAnimeIdsFromTagMessages(messages, tagId) {
  const ids = [];

  for (const msg of messages) {
    const sameTag =
      msg.meta?.seedTag?.id &&
      String(msg.meta.seedTag.id) === String(tagId);

    if (!sameTag) continue;

    const items = msg.ui?.data?.items || [];

    for (const item of items) {
      if (item.id) ids.push(item.id);
    }
  }

  return ids;
}

function filterExcludedAnime(animeList, excludeIds = []) {
  const excluded = new Set(excludeIds.map(String));
  return animeList.filter((anime) => !excluded.has(String(anime.id)));
}

function getSeasonLabel(seasonIntent) {
  if (!seasonIntent) return null;

  if (seasonIntent.type === "current") {
    return "current season";
  }

  if (seasonIntent.type === "upcoming") {
    return "upcoming season";
  }

  if (seasonIntent.type === "specific") {
    return `${seasonIntent.season} ${seasonIntent.year}`;
  }

  if (seasonIntent.type === "year") {
    return `${seasonIntent.year}`;
  }

  return null;
}

function buildFallbackResponse(animeResults) {
  if (!animeResults || animeResults.length === 0) {
    return "I could not find anime data for that request right now.";
  }

  return `I found these anime that may match your request: ${animeResults
    .map((anime) => anime.title)
    .join(", ")}.`;
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const cleanMessage = message.trim();

    await ChatMessage.create({
      role: "user",
      content: cleanMessage
    });

    const recentMessages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(30);

    const parsed = parseAnimeRequest(cleanMessage);

    let animeResults = [];
    let mode = parsed.intent;

    let seedTitle = null;
    let seedAnime = null;
    let seedTag = parsed.tag || null;

    let seasonIntent = parsed.seasonIntent || null;
    let seasonLabel = getSeasonLabel(seasonIntent);

    let rankingIntent = parsed.rankingIntent || null;
    let overviewTitle = parsed.overviewTitle || null;

    let excludeIds = [];
    let tagFilterMatched = null;

    // 1. Overview request.
    // Example: "Tell me about Death Note"
    if (parsed.intent === "overview") {
      mode = "overview";

      const overviewResults = await searchAnime(
        overviewTitle || cleanMessage,
        1
      );

      animeResults = overviewResults.length > 0 ? [overviewResults[0]] : [];
    }

    // 2. Season / year request with optional tag and ranking.
    // Examples:
    // "current season romance anime"
    // "upcoming action anime"
    // "spring 2025 fantasy anime"
    // "popular romance anime from 2025"
    else if (parsed.intent === "season" || parsed.intent === "year") {
      if (seasonIntent.type === "current") {
        mode = "season";
        animeResults = await getCurrentSeasonAnime(25);
      } else if (seasonIntent.type === "upcoming") {
        mode = "season";
        animeResults = await getUpcomingSeasonAnime(25);
      } else if (seasonIntent.type === "specific") {
        mode = "season";
        animeResults = await getSpecificSeasonAnime(
          seasonIntent.year,
          seasonIntent.season,
          25
        );
      } else if (seasonIntent.type === "year") {
        mode = "year";

        animeResults = await searchAnimeAdvanced({
          tagId: seedTag?.id,
          year: seasonIntent.year,
          ranking: rankingIntent,
          limit: 25
        });
      }

      if (seasonIntent.type !== "year" && seedTag) {
        const filtered = filterAnimeByTag(animeResults, seedTag.name);

        tagFilterMatched = filtered.length > 0;

        animeResults =
          filtered.length > 0
            ? filtered
            : animeResults;
      }

      animeResults = sortAnimeList(animeResults, rankingIntent).slice(0, 5);
    }

    // 3. List request with optional tag and ranking.
    // Examples:
    // "popular anime"
    // "popular romance anime"
    // "top rated action anime"
    // "isekai anime"
    else if (parsed.intent === "list") {
      mode = rankingIntent || "tag";

      animeResults = await searchAnimeAdvanced({
        tagId: seedTag?.id,
        ranking: rankingIntent,
        limit: 25
      });

      animeResults = animeResults.slice(0, 5);
    }

    // 4. Anime-like recommendation or vague follow-up.
    // Examples:
    // "Recommend anime like Naruto"
    // "How about another recommendation?"
    else if (parsed.intent === "recommendation") {
      mode = "recommendation";

      if (parsed.animeTitle && !parsed.wantsAnother) {
        seedTitle = parsed.animeTitle;

        const seedResults = await searchAnime(seedTitle, 1);

        if (seedResults.length > 0) {
          seedAnime = seedResults[0];
        }
      } else {
        const lastRecommendationMessage = recentMessages.find(
          (msg) =>
            msg.role === "assistant" &&
            (msg.meta?.seedAnime?.id || msg.meta?.seedTag?.id)
        );

        if (lastRecommendationMessage?.meta?.seedTag) {
          mode = "tag";
          seedTag = lastRecommendationMessage.meta.seedTag;

          excludeIds = getShownAnimeIdsFromTagMessages(
            recentMessages,
            seedTag.id
          );

          const tagResults = await searchAnimeAdvanced({
            tagId: seedTag.id,
            ranking: "top_rated",
            limit: 25
          });

          animeResults = filterExcludedAnime(tagResults, excludeIds).slice(
            0,
            5
          );

          if (animeResults.length === 0) {
            animeResults = tagResults.slice(0, 5);
          }
        } else if (lastRecommendationMessage?.meta?.seedAnime) {
          seedAnime = lastRecommendationMessage.meta.seedAnime;
          seedTitle = seedAnime.title;
        }
      }

      if (seedAnime && mode !== "tag") {
        excludeIds = getShownAnimeIdsFromMessages(recentMessages, seedAnime.id);

        const recommendations = await getAnimeRecommendations(
          seedAnime.id,
          4,
          excludeIds
        );

        animeResults =
          recommendations.length > 0 ? recommendations : [seedAnime];
      }

      if (!seedAnime && !seedTag && animeResults.length === 0) {
        mode = "search";
        animeResults = await searchAnime(cleanMessage, 5);
      }
    }

    // 5. Normal search.
    else {
      mode = "search";
      animeResults = await searchAnime(cleanMessage, 5);
    }

    const chatHistory = recentMessages
      .reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const contextInfo = {
      source: "gemini+jikan",
      mode,
      rankingIntent,
      overviewTitle,
      seedTitle,
      seedAnime: seedAnime
        ? {
            id: seedAnime.id,
            title: seedAnime.title
          }
        : null,
      seedTag,
      seasonIntent,
      seasonLabel,
      tagFilterMatched,
      parsed,
      resultCount: animeResults.length
    };

    let assistantText;

    try {
      assistantText = await generateAnimeResponse(
        cleanMessage,
        animeResults,
        chatHistory,
        contextInfo
      );
    } catch (error) {
      const isGeminiLimit =
        error.message.includes("429") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.toLowerCase().includes("quota");

      if (!isGeminiLimit) {
        throw error;
      }

      assistantText = buildFallbackResponse(animeResults);
    }

    const ui = buildChatUiAction(cleanMessage, animeResults, contextInfo);

    const assistantMeta = {
      ...contextInfo,
      shownAnimeIds: animeResults.map((anime) => anime.id),
      excludedAnimeIds: excludeIds
    };

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: assistantText,
      source: "gemini+jikan",
      ui,
      meta: assistantMeta
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: {
        ...assistantMeta,
        shownAnime: animeResults.map((anime) => ({
          id: anime.id,
          title: anime.title,
          type: anime.type,
          score: anime.score,
          year: anime.year,
          season: anime.season,
          popularity: anime.popularity,
          rank: anime.rank,
          genres: anime.genres,
          themes: anime.themes
        }))
      }
    });
  } catch (error) {
    console.error("Chat route error:", error.message);

    res.status(500).json({
      error: error.message || "Server error"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({
      error: error.message || "Failed to fetch chat messages"
    });
  }
});

export default router;