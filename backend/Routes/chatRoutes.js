import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import {
  searchAnime,
  searchAnimeAdvanced,
  getCurrentSeasonAnime,
  getUpcomingSeasonAnime,
  getSpecificSeasonAnime,
  getAnimeRecommendations,
  getAnimeCharacters,
  searchCharacters,
  getCharacterById,
  filterAnimeByTag,
  sortAnimeList
} from "../Services/JikanService.js";
import { generateAIAnimeResponse } from "../Services/AIProviderService.js";
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

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function isExactAnimeMatch(anime, query) {
  const target = normalizeText(query);

  if (!target || !anime) return false;

  const possibleTitles = [
    anime.title,
    anime.titleEnglish,
    anime.titleJapanese,
    ...(anime.titleSynonyms || [])
  ]
    .filter(Boolean)
    .map(normalizeText);

  return possibleTitles.some((title) => title === target);
}

function findBestCharacterMatch(characters, query) {
  if (!characters || characters.length === 0) return null;

  const target = normalizeText(query);
  const tokens = getTokens(query);

  const exact = characters.find(
    (character) => normalizeText(character.name) === target
  );

  if (exact) return exact;

  if (tokens.length >= 2) {
    return characters.find((character) =>
      tokens.every((token) => normalizeText(character.name).includes(token))
    );
  }

  return null;
}

function findLastSeedAnimeContext(messages) {
  return messages.find(
    (msg) =>
      msg.role === "assistant" &&
      msg.meta?.seedAnime?.id &&
      msg.meta?.seedAnime?.title
  )?.meta?.seedAnime;
}

async function resolveCharacterFromAnimeContext(characterName, recentMessages) {
  const lastSeedAnime = findLastSeedAnimeContext(recentMessages);

  if (!lastSeedAnime?.id) {
    return {
      character: null,
      seedAnime: null
    };
  }

  const animeCharacters = await getAnimeCharacters(lastSeedAnime.id, 20);
  const matchedCharacter = findBestCharacterMatch(animeCharacters, characterName);

  if (!matchedCharacter) {
    return {
      character: null,
      seedAnime: lastSeedAnime
    };
  }

  const detailedCharacter = await getCharacterById(matchedCharacter.id);

  return {
    character: detailedCharacter || matchedCharacter,
    seedAnime: lastSeedAnime
  };
}

async function resolveCharacterGlobally(characterName) {
  const characterResults = await searchCharacters(characterName, 8);

  if (characterResults.length === 0) {
    return {
      type: "none",
      results: []
    };
  }

  const tokens = getTokens(characterName);
  const bestMatch = findBestCharacterMatch(characterResults, characterName);

  if (bestMatch && tokens.length >= 2) {
    const detailedCharacter = await getCharacterById(bestMatch.id);

    return {
      type: "single",
      results: detailedCharacter ? [detailedCharacter] : [bestMatch]
    };
  }

  if (characterResults.length === 1) {
    const detailedCharacter = await getCharacterById(characterResults[0].id);

    return {
      type: "single",
      results: detailedCharacter ? [detailedCharacter] : [characterResults[0]]
    };
  }

  return {
    type: "multiple",
    results: characterResults
  };
}

function buildFallbackResponse(results, mode = "anime", contextInfo = {}) {
  if (!results || results.length === 0) {
    return "I could not find data for that request right now.";
  }

  if (mode === "characters" && contextInfo.characterDisambiguation) {
    const names = results
      .map((character) => character.name)
      .filter(Boolean)
      .join(", ");

    return `I found several characters that could match your request: ${names}. Which one do you mean?`;
  }

  if (mode === "characters" || mode === "character_overview") {
    const names = results
      .map((character) => character.name)
      .filter(Boolean)
      .join(", ");

    if (!names) {
      return "I found some character results, but I could not generate a detailed response right now.";
    }

    return `I found these characters: ${names}.`;
  }

  const titles = results
    .map((anime) => anime.title)
    .filter(Boolean)
    .join(", ");

  if (!titles) {
    return "I found some anime results, but I could not generate a detailed response right now.";
  }

  return `I found these anime that may match your request: ${titles}.`;
}

function isAiLimitError(error) {
  const message = error.message?.toLowerCase() || "";

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("insufficient_quota")
  );
}

function isCharacterMode(mode) {
  return mode === "characters" || mode === "character_overview";
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

    let results = [];
    let mode = parsed.intent;

    let seedTitle = null;
    let seedAnime = null;
    let seedTag = parsed.tag || null;
    let seedCharacter = null;

    let seasonIntent = parsed.seasonIntent || null;
    let seasonLabel = getSeasonLabel(seasonIntent);

    let rankingIntent = parsed.rankingIntent || null;
    let overviewTitle = parsed.overviewTitle || null;
    let animeOverviewTitle = parsed.animeOverviewTitle || null;

    let characterAnimeTitle = parsed.characterAnimeTitle || null;
    let characterName = parsed.characterName || null;
    let characterDisambiguation = false;

    let excludeIds = [];
    let tagFilterMatched = null;

    if (parsed.intent === "characters") {
      mode = "characters";

      const animeTitle = characterAnimeTitle || cleanMessage;
      const animeSearchResults = await searchAnime(animeTitle, 1);

      if (animeSearchResults.length > 0) {
        seedAnime = animeSearchResults[0];
        seedTitle = seedAnime.title;

        results = await getAnimeCharacters(seedAnime.id, 12);
      } else {
        results = [];
      }
    } else if (parsed.intent === "character_overview") {
      mode = "character_overview";

      characterName = parsed.characterName || cleanMessage;

      const contextualResult = await resolveCharacterFromAnimeContext(
        characterName,
        recentMessages
      );

      if (contextualResult.character) {
        seedAnime = contextualResult.seedAnime;
        seedTitle = contextualResult.seedAnime?.title || null;
        seedCharacter = {
          id: contextualResult.character.id,
          name: contextualResult.character.name
        };
        results = [contextualResult.character];
      } else {
        const globalResult = await resolveCharacterGlobally(characterName);

        if (globalResult.type === "single") {
          seedCharacter = {
            id: globalResult.results[0].id,
            name: globalResult.results[0].name
          };
          results = globalResult.results;
        } else if (globalResult.type === "multiple") {
          mode = "characters";
          characterDisambiguation = true;
          results = globalResult.results;
        } else {
          results = [];
        }
      }
    } else if (parsed.intent === "anime_overview") {
      mode = "overview";

      const animeTitle =
        animeOverviewTitle || overviewTitle || cleanMessage;

      const overviewResults = await searchAnime(animeTitle, 1);

      results = overviewResults.length > 0 ? [overviewResults[0]] : [];
    } else if (parsed.intent === "overview") {
      const lookupTitle = parsed.lookupTitle || overviewTitle || cleanMessage;
      const lookupTokens = getTokens(lookupTitle);

      const contextualResult = await resolveCharacterFromAnimeContext(
        lookupTitle,
        recentMessages
      );

      if (contextualResult.character) {
        mode = "character_overview";
        characterName = lookupTitle;
        seedAnime = contextualResult.seedAnime;
        seedTitle = contextualResult.seedAnime?.title || null;
        seedCharacter = {
          id: contextualResult.character.id,
          name: contextualResult.character.name
        };
        results = [contextualResult.character];
      } else if (lookupTokens.length === 1) {
        const globalCharacterResult = await resolveCharacterGlobally(lookupTitle);

        if (globalCharacterResult.type === "single") {
          mode = "character_overview";
          characterName = lookupTitle;
          seedCharacter = {
            id: globalCharacterResult.results[0].id,
            name: globalCharacterResult.results[0].name
          };
          results = globalCharacterResult.results;
        } else if (globalCharacterResult.type === "multiple") {
          mode = "characters";
          characterName = lookupTitle;
          characterDisambiguation = true;
          results = globalCharacterResult.results;
        } else {
          const animeOverviewResults = await searchAnime(lookupTitle, 1);
          mode = "overview";
          results =
            animeOverviewResults.length > 0 ? [animeOverviewResults[0]] : [];
        }
      } else {
        const animeOverviewResults = await searchAnime(lookupTitle, 1);
        const exactAnime =
          animeOverviewResults.length > 0 &&
          isExactAnimeMatch(animeOverviewResults[0], lookupTitle);

        if (exactAnime) {
          mode = "overview";
          results = [animeOverviewResults[0]];
        } else {
          const globalCharacterResult = await resolveCharacterGlobally(
            lookupTitle
          );

          if (globalCharacterResult.type === "single") {
            mode = "character_overview";
            characterName = lookupTitle;
            seedCharacter = {
              id: globalCharacterResult.results[0].id,
              name: globalCharacterResult.results[0].name
            };
            results = globalCharacterResult.results;
          } else if (globalCharacterResult.type === "multiple") {
            mode = "characters";
            characterName = lookupTitle;
            characterDisambiguation = true;
            results = globalCharacterResult.results;
          } else {
            mode = "overview";
            results =
              animeOverviewResults.length > 0 ? [animeOverviewResults[0]] : [];
          }
        }
      }
    } else if (parsed.intent === "season" || parsed.intent === "year") {
      if (seasonIntent.type === "current") {
        mode = "season";
        results = await getCurrentSeasonAnime(25);
      } else if (seasonIntent.type === "upcoming") {
        mode = "season";
        results = await getUpcomingSeasonAnime(25);
      } else if (seasonIntent.type === "specific") {
        mode = "season";
        results = await getSpecificSeasonAnime(
          seasonIntent.year,
          seasonIntent.season,
          25
        );
      } else if (seasonIntent.type === "year") {
        mode = "year";

        results = await searchAnimeAdvanced({
          tagId: seedTag?.id,
          year: seasonIntent.year,
          ranking: rankingIntent,
          limit: 25
        });
      }

      if (seasonIntent.type !== "year" && seedTag) {
        const filtered = filterAnimeByTag(results, seedTag.name);

        tagFilterMatched = filtered.length > 0;

        results = filtered.length > 0 ? filtered : results;
      }

      results = sortAnimeList(results, rankingIntent).slice(0, 5);
    } else if (parsed.intent === "list") {
      mode = rankingIntent || "tag";

      results = await searchAnimeAdvanced({
        tagId: seedTag?.id,
        ranking: rankingIntent,
        limit: 25
      });

      results = results.slice(0, 5);
    } else if (parsed.intent === "recommendation") {
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

          results = filterExcludedAnime(tagResults, excludeIds).slice(0, 5);

          if (results.length === 0) {
            results = tagResults.slice(0, 5);
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

        results = recommendations.length > 0 ? recommendations : [seedAnime];
      }

      if (!seedAnime && !seedTag && results.length === 0) {
        mode = "search";
        results = await searchAnime(cleanMessage, 5);
      }
    } else {
      mode = "search";
      results = await searchAnime(cleanMessage, 5);
    }

    const chatHistory = recentMessages
      .reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const provider = process.env.AI_PROVIDER || "gemini";

    const contextInfo = {
      source: `${provider}+jikan`,
      mode,
      rankingIntent,
      overviewTitle,
      animeOverviewTitle,
      characterAnimeTitle,
      characterName,
      characterDisambiguation,
      seedTitle,
      seedAnime: seedAnime
        ? {
            id: seedAnime.id,
            title: seedAnime.title
          }
        : null,
      seedCharacter,
      seedTag,
      seasonIntent,
      seasonLabel,
      tagFilterMatched,
      parsed,
      resultCount: results.length
    };

    let assistantText;

    try {
      assistantText = await generateAIAnimeResponse(
        cleanMessage,
        results,
        chatHistory,
        contextInfo
      );
    } catch (error) {
      console.error("AI provider error:", error.message);

      if (!isAiLimitError(error)) {
        throw error;
      }

      assistantText = buildFallbackResponse(results, mode, contextInfo);
    }

    if (!assistantText || !assistantText.trim()) {
      console.warn("AI returned empty response. Using fallback.");
      assistantText = buildFallbackResponse(results, mode, contextInfo);
    }

    const ui = buildChatUiAction(cleanMessage, results, contextInfo);

    const characterMode = isCharacterMode(mode);

    const assistantMeta = {
      ...contextInfo,
      shownAnimeIds: characterMode ? [] : results.map((item) => item.id),
      shownCharacterIds: characterMode ? results.map((item) => item.id) : [],
      excludedAnimeIds: excludeIds
    };

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: assistantText,
      source: contextInfo.source,
      ui,
      meta: assistantMeta
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: {
        ...assistantMeta,
        shownAnime: characterMode
          ? []
          : results.map((anime) => ({
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
            })),
        shownCharacters: characterMode
          ? results.map((character) => ({
              id: character.id,
              name: character.name,
              nameKanji: character.nameKanji,
              nicknames: character.nicknames,
              favorites: character.favorites,
              role: character.role,
              anime: character.anime?.slice(0, 5),
              manga: character.manga?.slice(0, 5),
              voiceActors: character.voiceActors?.slice(0, 5)
            }))
          : []
      }
    });
  } catch (error) {
    console.error("Chat route error:", error.message);

    res.status(500).json({
      error: error.message || "Server error"
    });
  }
});

router.post("/character-overview", async (req, res) => {
  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        error: "characterId is required"
      });
    }

    const character = await getCharacterById(characterId);

    if (!character) {
      return res.status(404).json({
        error: "Character not found"
      });
    }

    const reply = `Here is an overview of ${character.name}.`;

    const ui = {
      type: "character_overview",
      data: {
        character
      }
    };

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: reply,
      source: "jikan",
      ui,
      meta: {
        source: "jikan",
        mode: "character_overview",
        seedCharacter: {
          id: character.id,
          name: character.name
        },
        shownCharacterIds: [character.id]
      }
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: assistantMessage.meta
    });
  } catch (error) {
    console.error("Character overview route error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to fetch character overview"
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