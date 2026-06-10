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
  getAnimeById,
  getAnimeEpisodes,
  searchCharacters,
  getCharacterById,
  filterAnimeByTag,
  sortAnimeList,
  searchManga,
  searchMangaAdvanced,
  getMangaById,
  getMangaRecommendations,
  filterMangaByTag,
  sortMangaList,
  searchPeople,
  getPersonById,
  getPersonVoiceRoles
} from "../Services/JikanService.js";
import { generateAIAnimeResponse } from "../Services/AIProviderService.js";
import { buildChatUiAction } from "../Services/uiDecisionService.js";
import { parseAnimeRequest } from "../Services/queryIntentService.js";

const router = express.Router();

function getPersonSearchText(person = {}) {
  return normalizeText(
    [
      person?.name,
      person?.givenName,
      person?.familyName,
      ...(person?.alternateNames || [])
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function isExactPersonMatch(person, query) {
  const target = normalizeText(query);

  if (!target || !person) return false;

  return getPersonSearchText(person) === target;
}

function getRelevantPersonOptions(people = [], query = "", limit = 8) {
  const safePeople = Array.isArray(people) ? people : [];
  const tokens = getTokens(query);

  if (tokens.length === 0) {
    return safePeople.slice(0, limit);
  }

  const relevant = safePeople.filter((person) => {
    const searchText = getPersonSearchText(person);
    return tokens.every((token) => searchText.includes(token));
  });

  return (relevant.length > 0 ? relevant : safePeople).slice(0, limit);
}

async function resolvePersonChoiceOrSingle(name, targetAction) {
  const safeName = String(name ?? "").trim();

  if (!safeName) {
    return {
      type: "none",
      person: null,
      options: [],
      targetAction
    };
  }

  const people = await searchPeople(safeName, 12);
  const options = getRelevantPersonOptions(people, safeName, 8);

  if (options.length === 0) {
    return {
      type: "none",
      person: null,
      options: [],
      targetAction
    };
  }

  const exact = options.find((person) => isExactPersonMatch(person, safeName));

  if (exact) {
    const detailedPerson = await getPersonById(exact.id);

    return {
      type: "single",
      person: detailedPerson || exact,
      options: [],
      targetAction
    };
  }

  if (options.length >= 2) {
    return {
      type: "options",
      person: null,
      options,
      targetAction
    };
  }

  const detailedPerson = await getPersonById(options[0].id);

  return {
    type: "single",
    person: detailedPerson || options[0],
    options: [],
    targetAction
  };
}

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

function getShownMangaIdsFromMessages(messages, seedMangaId) {
  const ids = [];

  for (const msg of messages) {
    const sameSeed =
      msg.meta?.seedManga?.id &&
      String(msg.meta.seedManga.id) === String(seedMangaId);

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
      msg.meta?.mediaType !== "manga" &&
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

function getShownMangaIdsFromTagMessages(messages, tagId) {
  const ids = [];

  for (const msg of messages) {
    const sameTag =
      msg.meta?.mediaType === "manga" &&
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

function filterExcludedManga(mangaList, excludeIds = []) {
  const excluded = new Set(excludeIds.map(String));
  return mangaList.filter((manga) => !excluded.has(String(manga.id)));
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
  return String(value ?? "")
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

function isPersonMode(mode) {
  return (
    mode === "person_options" ||
    mode === "person_overview" ||
    mode === "person_voice_roles"
  );
}

function getVoiceRoleKey(role) {
  if (role?.character?.id) {
    return `character-${role.character.id}`;
  }

  const characterName = normalizeText(role?.character?.name || "");
  const animeId = role?.anime?.id || "";

  if (!characterName) return null;

  return `character-name-${characterName}-${animeId}`;
}

function getShownVoiceRoleKeysFromMessages(messages, personId) {
  const keys = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    if (msg.meta?.mode !== "person_voice_roles") continue;

    const samePerson =
      msg.meta?.seedPerson?.id &&
      String(msg.meta.seedPerson.id) === String(personId);

    if (!samePerson) continue;

    const shownKeys = msg.meta?.shownVoiceRoleKeys || [];

    for (const key of shownKeys) {
      if (key) keys.push(key);
    }

    const roles = msg.ui?.data?.roles || [];

    for (const role of roles) {
      const key = getVoiceRoleKey(role);
      if (key) keys.push(key);
    }
  }

  return [...new Set(keys.map(String))];
}

function filterExcludedVoiceRoles(roles = [], excludeKeys = []) {
  const excluded = new Set(excludeKeys.map(String));

  return roles.filter((role) => {
    const key = getVoiceRoleKey(role);
    return key && !excluded.has(String(key));
  });
}

function findLastPersonVoiceRoleContext(messages) {
  const latestAssistantMessage = messages.find(
    (msg) => msg.role === "assistant"
  );

  if (
    latestAssistantMessage?.meta?.mode === "person_voice_roles" &&
    latestAssistantMessage?.meta?.seedPerson?.id
  ) {
    return latestAssistantMessage;
  }

  return null;
}

function isExactTitleMatch(item, query) {
  const target = normalizeText(query);

  if (!target || !item) return false;

  const possibleTitles = [
    item.title,
    item.titleEnglish,
    item.titleJapanese,
    ...(item.titleSynonyms || [])
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

function findLastSeedMangaContext(messages) {
  return messages.find(
    (msg) =>
      msg.role === "assistant" &&
      msg.meta?.seedManga?.id &&
      msg.meta?.seedManga?.title
  )?.meta?.seedManga;
}

async function resolveAnimeFromTitleOrContext(title, recentMessages) {
  const normalizedTitle = normalizeText(title);

  if (["this", "this anime", "it"].includes(normalizedTitle)) {
    const lastSeedAnime = findLastSeedAnimeContext(recentMessages);

    if (lastSeedAnime?.id) {
      const detailedAnime = await getAnimeById(lastSeedAnime.id);
      return detailedAnime || lastSeedAnime;
    }
  }

  const animeResults = await searchAnime(title, 1);

  if (animeResults.length === 0) {
    return null;
  }

  const detailedAnime = await getAnimeById(animeResults[0].id);

  return detailedAnime || animeResults[0];
}

function getShownAnimeIdsFromListMessages(messages, context = {}) {
  const ids = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    if (msg.meta?.mediaType === "manga") continue;

    const sameRanking =
      (context.rankingIntent || null) === (msg.meta?.rankingIntent || null);

    const sameTag =
      context.seedTag?.id && msg.meta?.seedTag?.id
        ? String(context.seedTag.id) === String(msg.meta.seedTag.id)
        : !context.seedTag?.id && !msg.meta?.seedTag?.id;

    const sameSeason =
      JSON.stringify(context.seasonIntent || null) ===
      JSON.stringify(msg.meta?.seasonIntent || null);

    if (!sameRanking || !sameTag || !sameSeason) continue;

    const shownAnimeIds = msg.meta?.shownAnimeIds || [];

    for (const id of shownAnimeIds) {
      ids.push(id);
    }

    const items = msg.ui?.data?.items || [];

    for (const item of items) {
      if (item.id) ids.push(item.id);
    }
  }

  return [...new Set(ids.map(String))];
}

function findLastAnimeContinuationContext(messages) {
  return messages.find(
    (msg) =>
      msg.role === "assistant" &&
      msg.meta?.mediaType !== "manga" &&
      (
        msg.meta?.seedAnime?.id ||
        msg.meta?.seedTag?.id ||
        msg.meta?.rankingIntent ||
        msg.meta?.seasonIntent ||
        msg.meta?.shownAnimeIds?.length
      )
  );
}

function getShownMangaIdsFromListMessages(messages, context = {}) {
  const ids = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    if (msg.meta?.mediaType !== "manga") continue;

    const sameRanking =
      (context.rankingIntent || null) === (msg.meta?.rankingIntent || null);

    const sameStatus =
      (context.mangaStatusIntent || null) ===
      (msg.meta?.mangaStatusIntent || null);

    const sameTag =
      context.seedTag?.id && msg.meta?.seedTag?.id
        ? String(context.seedTag.id) === String(msg.meta.seedTag.id)
        : !context.seedTag?.id && !msg.meta?.seedTag?.id;

    if (!sameRanking || !sameStatus || !sameTag) continue;

    const shownMangaIds = msg.meta?.shownMangaIds || [];

    for (const id of shownMangaIds) {
      ids.push(id);
    }

    const items = msg.ui?.data?.items || [];

    for (const item of items) {
      if (item.id) ids.push(item.id);
    }
  }

  return [...new Set(ids.map(String))];
}

function findLastMangaContinuationContext(messages) {
  return messages.find(
    (msg) =>
      msg.role === "assistant" &&
      msg.meta?.mediaType === "manga" &&
      (
        msg.meta?.seedManga?.id ||
        msg.meta?.seedTag?.id ||
        msg.meta?.rankingIntent ||
        msg.meta?.mangaStatusIntent ||
        msg.meta?.shownMangaIds?.length
      )
  );
}


function getExplicitMediaTypeFromMessage(message = "") {
  const text = message.toLowerCase();

  if (
    text.includes("manga") ||
    text.includes("manhwa") ||
    text.includes("manhua") ||
    text.includes("webtoon")
  ) {
    return "manga";
  }

  if (text.includes("anime")) {
    return "anime";
  }

  return null;
}

function findLastAssistantMediaContext(messages) {
  return messages.find(
    (msg) =>
      msg.role === "assistant" &&
      (
        msg.meta?.mediaType ||
        msg.meta?.seedManga?.id ||
        msg.meta?.seedAnime?.id ||
        msg.meta?.shownMangaIds?.length ||
        msg.meta?.shownAnimeIds?.length
      )
  )?.meta;
}

function resolveEffectiveMediaType(parsed, message, recentMessages) {
  const explicitMediaType = getExplicitMediaTypeFromMessage(message);

  if (explicitMediaType) {
    return explicitMediaType;
  }

  const lastContext = findLastAssistantMediaContext(recentMessages);

  if (parsed.wantsAnother && lastContext) {
    if (
      lastContext.mediaType === "manga" ||
      lastContext.seedManga?.id ||
      lastContext.shownMangaIds?.length
    ) {
      return "manga";
    }

    if (
      lastContext.mediaType === "anime" ||
      lastContext.seedAnime?.id ||
      lastContext.shownAnimeIds?.length
    ) {
      return "anime";
    }
  }

  return parsed.mediaType || "anime";
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
  const characterResults = await searchCharacters(characterName, 10);

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

async function resolveMangaOverview(title, recentMessages) {
  const normalizedTitle = normalizeText(title);

  if (["this", "this manga", "it"].includes(normalizedTitle)) {
    const lastSeedManga = findLastSeedMangaContext(recentMessages);

    if (lastSeedManga?.id) {
      const detailedManga = await getMangaById(lastSeedManga.id);
      return detailedManga ? [detailedManga] : [lastSeedManga];
    }
  }

  const overviewResults = await searchManga(title, 1);

  if (overviewResults.length === 0) return [];

  const detailedManga = await getMangaById(overviewResults[0].id);
  return detailedManga ? [detailedManga] : [overviewResults[0]];
}

function buildFallbackResponse(results, mode = "anime", contextInfo = {}) {
  if (!results || results.length === 0) {
    return "I could not find data for that request right now.";
  }

  if (mode === "person_options") {
    const names = results.map((person) => person.name).filter(Boolean).join(", ");
    return `I found several people that could match your request: ${names}. Which one do you mean?`;
  }

  if (mode === "person_overview") {
    const person = results[0];
    return person?.name
      ? `I found ${person.name}.`
      : "I found a person result, but I could not generate a detailed response right now.";
  }

  if (mode === "person_voice_roles") {
    const titles = results
      .map((role) => `${role.anime?.title} as ${role.character?.name}`)
      .filter(Boolean)
      .join(", ");

    return titles
      ? `I found these voice roles: ${titles}.`
      : "I could not find voice role data for that person right now.";
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

  const mediaLabel = contextInfo.mediaType === "manga" ? "manga" : "anime";
  const titles = results
    .map((item) => item.title)
    .filter(Boolean)
    .join(", ");

  if (!titles) {
    return `I found some ${mediaLabel} results, but I could not generate a detailed response right now.`;
  }

  return `I found these ${mediaLabel} that may match your request: ${titles}.`;
}

function isLowValueAnimeOption(anime) {
  if (!anime) return true;

  const title = normalizeText(anime.title || "");
  const type = anime.type || "";
  const episodes = anime.episodes || 0;

  const blockedTypes = ["Music", "CM", "PV", "ONA", "Special"];

  if (blockedTypes.includes(type)) {
    return true;
  }

  // Extra safety for short side entries.
  if (episodes > 0 && episodes <= 2 && type !== "Movie") {
    return true;
  }

  // Hide recap / summary entries.
  if (
    title.includes("recap") ||
    title.includes("recaps") ||
    title.includes("summary") ||
    title.includes("digest")
  ) {
    return true;
  }

  // Hide obvious collab / parody / unrelated side entries.
  if (
    title.includes("x mlb") ||
    title.includes("collab") ||
    title.includes("collaboration") ||
    title.includes("gakuen") ||
    title.includes("school")
  ) {
    return true;
  }

  return false;
}

function getAnimeSearchText(anime) {
  return normalizeText(
    [
      anime.title,
      anime.titleEnglish,
      anime.titleJapanese,
      ...(anime.titleSynonyms || [])
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getMeaningfulTitleTokens(query = "") {
  return getTokens(query).filter(
    (token) =>
      ![
        "anime",
        "show",
        "tell",
        "about",
        "overview",
        "trailer",
        "episodes",
        "episode",
        "for",
        "of",
        "the",
        "me",
        "please"
      ].includes(token)
  );
}

function isRelevantAnimeOption(anime, query = "") {
  const tokens = getMeaningfulTitleTokens(query);
  const searchText = getAnimeSearchText(anime);

  if (tokens.length === 0) return false;

  // For short queries, require all tokens.
  if (tokens.length <= 2) {
    return tokens.every((token) => searchText.includes(token));
  }

  // For longer titles like "kimetsu no yaiba", allow one token miss,
  // but still require most of the real title tokens to match.
  const matchedCount = tokens.filter((token) => searchText.includes(token)).length;

  return matchedCount >= Math.max(2, tokens.length - 1);
}

function scoreAnimeOption(anime, query = "") {
  const queryText = normalizeText(query);
  const titleText = normalizeText(anime.title || "");
  const englishText = normalizeText(anime.titleEnglish || "");
  const synonymText = normalizeText((anime.titleSynonyms || []).join(" "));
  const searchableText = `${titleText} ${englishText} ${synonymText}`;

  let score = 0;

  if (titleText === queryText) score += 1000;
  if (englishText === queryText) score += 900;
  if (titleText.includes(queryText)) score += 400;
  if (searchableText.includes(queryText)) score += 250;

  if (anime.type === "TV") score += 120;
  if (anime.type === "Movie") score += 90;
  if (anime.type === "ONA") score += 50;
  if (anime.type === "OVA") score += 30;

  if (anime.year) score += Math.min(Number(anime.year) - 1990, 80);
  if (anime.score) score += Number(anime.score) * 10;
  if (anime.popularity) score += Math.max(0, 10000 - anime.popularity) / 100;

  return score;
}

function getRelevantAnimeOptions(candidates = [], query = "", limit = 12) {
  const relevant = candidates
    .filter((anime) => !isLowValueAnimeOption(anime))
    .filter((anime) => isRelevantAnimeOption(anime, query))
    .sort((a, b) => scoreAnimeOption(b, query) - scoreAnimeOption(a, query));

  return relevant.slice(0, limit);
}

function shouldShowAnimeOptions(candidates = [], query = "") {
  const relevant = getRelevantAnimeOptions(candidates, query, 12);
  return relevant.length >= 2;
}


async function resolveAnimeChoiceOrSingle(title, recentMessages, targetAction) {
  const normalizedTitle = normalizeText(title);

  if (["this", "this anime", "it"].includes(normalizedTitle)) {
    const lastSeedAnime = findLastSeedAnimeContext(recentMessages);

    if (lastSeedAnime?.id) {
      const detailedAnime = await getAnimeById(lastSeedAnime.id);

      return {
        type: "single",
        anime: detailedAnime || lastSeedAnime,
        options: [],
        targetAction
      };
    }
  }

  const candidates = await searchAnime(title, 25);
  const options = getRelevantAnimeOptions(candidates, title, 12);

  if (options.length === 0) {
    return {
      type: "none",
      anime: null,
      options: [],
      targetAction
    };
  }

  if (options.length >= 2) {
    return {
      type: "options",
      anime: null,
      options,
      targetAction
    };
  }

  const detailedAnime = await getAnimeById(options[0].id);

  return {
    type: "single",
    anime: detailedAnime || options[0],
    options: [],
    targetAction
  };
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

function summarizeAnime(anime) {
  return {
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
  };
}

function summarizeManga(manga) {
  return {
    id: manga.id,
    title: manga.title,
    titleEnglish: manga.titleEnglish,
    type: manga.type,
    status: manga.status,
    publishing: manga.publishing,
    chapters: manga.chapters,
    volumes: manga.volumes,
    score: manga.score,
    popularity: manga.popularity,
    rank: manga.rank,
    genres: manga.genres,
    themes: manga.themes,
    demographics: manga.demographics,
    authors: manga.authors,
    serializations: manga.serializations
  };
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
    const mediaType = resolveEffectiveMediaType(
      parsed,
      cleanMessage,
      recentMessages
    );
    const isMangaRequest = mediaType === "manga";

    let results = [];
    let mode = parsed.intent;

    let seedTitle = null;
    let seedAnime = null;
    let seedManga = null;
    let seedTag = parsed.tag || null;
    let seedCharacter = null;
    let seedPerson = null;
    let seedPersonData = null;
    let personName = parsed.personName || null;
    let shownVoiceRoleKeys = [];

    let seasonIntent = parsed.seasonIntent || null;
    let seasonLabel = getSeasonLabel(seasonIntent);

    let rankingIntent = parsed.rankingIntent || null;
    let mangaStatusIntent = parsed.mangaStatusIntent || null;
    let overviewTitle = parsed.overviewTitle || null;
    let animeOverviewTitle = parsed.animeOverviewTitle || null;
    let mangaOverviewTitle = parsed.mangaOverviewTitle || null;

    let characterAnimeTitle = parsed.characterAnimeTitle || null;
    let characterName = parsed.characterName || null;
    let characterDisambiguation = false;

    let excludeIds = [];
    let tagFilterMatched = null;
    let targetAction = null;

    const explicitMediaType = getExplicitMediaTypeFromMessage(cleanMessage);

    const lastPersonVoiceRoleMessage =
      parsed.wantsAnother && !explicitMediaType
        ? findLastPersonVoiceRoleContext(recentMessages)
        : null;

    if (lastPersonVoiceRoleMessage?.meta?.seedPerson?.id) {
      mode = "person_voice_roles";
      targetAction = "voice_roles";

      seedPerson = lastPersonVoiceRoleMessage.meta.seedPerson;
      seedPersonData = lastPersonVoiceRoleMessage.meta.seedPersonData || seedPerson;
      personName = seedPerson.name;

      const excludeKeys = getShownVoiceRoleKeysFromMessages(
        recentMessages,
        seedPerson.id
      );

      const allRoles = await getPersonVoiceRoles(seedPerson.id, 60);

      results = filterExcludedVoiceRoles(allRoles, excludeKeys).slice(0, 20);

      if (results.length === 0) {
        results = allRoles.slice(0, 20);
      }

      shownVoiceRoleKeys = results.map(getVoiceRoleKey).filter(Boolean);
    } else if (parsed.intent === "person_overview") {
      mode = "person_overview";
      targetAction = "overview";

      const resolvedPerson = await resolvePersonChoiceOrSingle(
        personName || cleanMessage,
        "overview"
      );

      if (resolvedPerson.type === "options") {
        mode = "person_options";
        results = resolvedPerson.options;
      } else if (resolvedPerson.type === "single") {
        seedPersonData = resolvedPerson.person;
        seedPerson = {
          id: resolvedPerson.person.id,
          name: resolvedPerson.person.name
        };
        results = [resolvedPerson.person];
      } else {
        results = [];
      }
    } else if (parsed.intent === "person_voice_roles") {
      mode = "person_voice_roles";
      targetAction = "voice_roles";

      const resolvedPerson = await resolvePersonChoiceOrSingle(
        personName || cleanMessage,
        "voice_roles"
      );

      if (resolvedPerson.type === "options") {
        mode = "person_options";
        results = resolvedPerson.options;
      } else if (resolvedPerson.type === "single") {
        seedPersonData = resolvedPerson.person;
        seedPerson = {
          id: resolvedPerson.person.id,
          name: resolvedPerson.person.name
        };
        results = await getPersonVoiceRoles(resolvedPerson.person.id, 20);
        shownVoiceRoleKeys = results.map(getVoiceRoleKey).filter(Boolean);
      } else {
        results = [];
      }
    } else if (isMangaRequest) {
      if (parsed.intent === "manga_overview" || parsed.intent === "overview") {
        mode = "manga_overview";

        const title =
          mangaOverviewTitle || overviewTitle || parsed.lookupTitle || cleanMessage;

        results = await resolveMangaOverview(title, recentMessages);

        if (results.length > 0) {
          seedManga = results[0];
          seedTitle = seedManga.title;
        }
      } else if (parsed.intent === "year") {
        mode = "year";

        results = await searchMangaAdvanced({
          tagId: seedTag?.id,
          year: seasonIntent?.year,
          ranking: rankingIntent,
          status: mangaStatusIntent,
          limit: 25
        });

        results = sortMangaList(results, rankingIntent).slice(0, 5);
      } else if (parsed.intent === "season") {
        mode = rankingIntent || mangaStatusIntent || "manga_list";

        results = await searchMangaAdvanced({
          tagId: seedTag?.id,
          ranking: rankingIntent,
          status: mangaStatusIntent,
          limit: 25
        });

        results = sortMangaList(results, rankingIntent).slice(0, 5);
      } else if (parsed.intent === "list") {
        mode = rankingIntent || mangaStatusIntent || "tag";

        results = await searchMangaAdvanced({
          tagId: seedTag?.id,
          ranking: rankingIntent,
          status: mangaStatusIntent,
          limit: 25
        });

        results = results.slice(0, 5);
      } else if (parsed.intent === "recommendation") {
        mode = "recommendation";

        if (parsed.mangaTitle && !parsed.wantsAnother) {
          seedTitle = parsed.mangaTitle;

          const seedResults = await searchManga(seedTitle, 1);

          if (seedResults.length > 0) {
            seedManga = seedResults[0];
          }
        } else {
          const lastRecommendationMessage =
            findLastMangaContinuationContext(recentMessages);

          if (lastRecommendationMessage?.meta?.seedTag) {
            mode = "tag";
            seedTag = lastRecommendationMessage.meta.seedTag;
            rankingIntent = lastRecommendationMessage.meta.rankingIntent || "top_rated";
            mangaStatusIntent = lastRecommendationMessage.meta.mangaStatusIntent || null;

            excludeIds = getShownMangaIdsFromListMessages(
              recentMessages,
              lastRecommendationMessage.meta
            );

            const tagResults = await searchMangaAdvanced({
              tagId: seedTag.id,
              ranking: rankingIntent,
              status: mangaStatusIntent,
              limit: 25
            });

            const sortedResults = sortMangaList(tagResults, rankingIntent);

            results = filterExcludedManga(sortedResults, excludeIds).slice(0, 5);

            if (results.length === 0) {
              results = sortedResults.slice(0, 5);
            }
          } else if (lastRecommendationMessage?.meta?.seedManga) {
            seedManga = lastRecommendationMessage.meta.seedManga;
            seedTitle = seedManga.title;
          } else if (
            lastRecommendationMessage?.meta?.rankingIntent ||
            lastRecommendationMessage?.meta?.mangaStatusIntent ||
            lastRecommendationMessage?.meta?.shownMangaIds?.length
          ) {
            rankingIntent = lastRecommendationMessage.meta.rankingIntent || rankingIntent;
            mangaStatusIntent =
              lastRecommendationMessage.meta.mangaStatusIntent || mangaStatusIntent;
            seedTag = lastRecommendationMessage.meta.seedTag || null;

            mode = rankingIntent || mangaStatusIntent || "manga_list";

            excludeIds = getShownMangaIdsFromListMessages(
              recentMessages,
              lastRecommendationMessage.meta
            );

            const listResults = await searchMangaAdvanced({
              tagId: seedTag?.id,
              ranking: rankingIntent,
              status: mangaStatusIntent,
              limit: 25
            });

            const sortedResults = sortMangaList(listResults, rankingIntent);

            results = filterExcludedManga(sortedResults, excludeIds).slice(0, 5);

            if (results.length === 0) {
              results = sortedResults.slice(0, 5);
            }
          }
        }

        if (seedManga && mode !== "tag") {
          excludeIds = getShownMangaIdsFromMessages(recentMessages, seedManga.id);

          const recommendations = await getMangaRecommendations(
            seedManga.id,
            4,
            excludeIds
          );

          results = recommendations.length > 0 ? recommendations : [seedManga];
        }

        if (!seedManga && !seedTag && results.length === 0) {
          mode = "search";
          results = await searchManga(cleanMessage, 5);
        }
      } else {
        mode = "search";
        results = await searchManga(cleanMessage, 5);
      }
    } else if (parsed.intent === "anime_trailer") {
      const animeTitle =
        parsed.animeTrailerTitle || parsed.animeTitle || cleanMessage;

      const resolvedAnime = await resolveAnimeChoiceOrSingle(
        animeTitle,
        recentMessages,
        "trailer"
      );

      if (resolvedAnime.type === "options") {
        mode = "anime_options";
        targetAction = "trailer";
        results = resolvedAnime.options;
      } else if (resolvedAnime.type === "single") {
        mode = "anime_trailer";
        seedAnime = resolvedAnime.anime;
        seedTitle = seedAnime.title;
        results = [seedAnime];
      } else {
        mode = "anime_trailer";
        results = [];
      }
    } else if (parsed.intent === "anime_episodes") {
      const animeTitle =
        parsed.animeEpisodesTitle || parsed.animeTitle || cleanMessage;

      const resolvedAnime = await resolveAnimeChoiceOrSingle(
        animeTitle,
        recentMessages,
        "episodes"
      );

      if (resolvedAnime.type === "options") {
        mode = "anime_options";
        targetAction = "episodes";
        results = resolvedAnime.options;
      } else if (resolvedAnime.type === "single") {
        mode = "anime_episodes";
        seedAnime = resolvedAnime.anime;
        seedTitle = seedAnime.title;
        results = await getAnimeEpisodes(seedAnime.id, 12);
      } else {
        mode = "anime_episodes";
        results = [];
      }
    } else if (parsed.intent === "characters") {
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
      const animeTitle = animeOverviewTitle || overviewTitle || cleanMessage;

      const resolvedAnime = await resolveAnimeChoiceOrSingle(
        animeTitle,
        recentMessages,
        "overview"
      );

      if (resolvedAnime.type === "options") {
        mode = "anime_options";
        targetAction = "overview";
        results = resolvedAnime.options;
      } else if (resolvedAnime.type === "single") {
        mode = "overview";
        seedAnime = resolvedAnime.anime;
        seedTitle = seedAnime.title;
        results = [seedAnime];
      } else {
        mode = "overview";
        results = [];
      }
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
          isExactTitleMatch(animeOverviewResults[0], lookupTitle);

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
        const lastRecommendationMessage =
          findLastAnimeContinuationContext(recentMessages);

        if (lastRecommendationMessage?.meta?.seedTag) {
          mode = "tag";
          seedTag = lastRecommendationMessage.meta.seedTag;
          rankingIntent =
            lastRecommendationMessage.meta.rankingIntent || "top_rated";
          seasonIntent =
            lastRecommendationMessage.meta.seasonIntent || seasonIntent;

          excludeIds = getShownAnimeIdsFromListMessages(
            recentMessages,
            lastRecommendationMessage.meta
          );

          const tagResults = await searchAnimeAdvanced({
            tagId: seedTag.id,
            year: seasonIntent?.type === "year" ? seasonIntent.year : null,
            ranking: rankingIntent,
            limit: 25
          });

          const sortedResults = sortAnimeList(tagResults, rankingIntent);

          results = filterExcludedAnime(sortedResults, excludeIds).slice(0, 5);

          if (results.length === 0) {
            results = sortedResults.slice(0, 5);
          }
        } else if (lastRecommendationMessage?.meta?.seedAnime) {
          seedAnime = lastRecommendationMessage.meta.seedAnime;
          seedTitle = seedAnime.title;
        } else if (
          lastRecommendationMessage?.meta?.rankingIntent ||
          lastRecommendationMessage?.meta?.seasonIntent ||
          lastRecommendationMessage?.meta?.shownAnimeIds?.length
        ) {
          rankingIntent =
            lastRecommendationMessage.meta.rankingIntent || rankingIntent;
          seasonIntent =
            lastRecommendationMessage.meta.seasonIntent || seasonIntent;
          seedTag = lastRecommendationMessage.meta.seedTag || null;

          mode = rankingIntent || "anime_list";

          excludeIds = getShownAnimeIdsFromListMessages(
            recentMessages,
            lastRecommendationMessage.meta
          );

          const listResults = await searchAnimeAdvanced({
            tagId: seedTag?.id,
            year: seasonIntent?.type === "year" ? seasonIntent.year : null,
            ranking: rankingIntent,
            limit: 25
          });

          const sortedResults = sortAnimeList(listResults, rankingIntent);

          results = filterExcludedAnime(sortedResults, excludeIds).slice(0, 5);

          if (results.length === 0) {
            results = sortedResults.slice(0, 5);
          }
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
      mediaType,
      targetAction,
      seedAnimeData: seedAnime || null,
      rankingIntent,
      mangaStatusIntent,
      overviewTitle,
      animeOverviewTitle,
      mangaOverviewTitle,
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
      seedManga: seedManga
        ? {
          id: seedManga.id,
          title: seedManga.title
        }
        : null,
      seedCharacter,
      seedTag,
      seasonIntent,
      seasonLabel,
      tagFilterMatched,
      parsed,
      resultCount: results.length,
      personName,
      seedPerson,
      seedPersonData,
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
    const personMode = isPersonMode(mode);
    const mangaMode = !characterMode && !personMode && mediaType === "manga";
    const animeMode = !characterMode && !personMode && mediaType !== "manga";

    const assistantMeta = {
      ...contextInfo,
      shownAnimeIds: animeMode ? results.map((item) => item.id) : [],
      shownMangaIds: mangaMode ? results.map((item) => item.id) : [],
      shownCharacterIds: characterMode ? results.map((item) => item.id) : [],
      excludedAnimeIds: animeMode ? excludeIds : [],
      excludedMangaIds: mangaMode ? excludeIds : [],
      shownPersonIds: personMode && seedPerson?.id ? [seedPerson.id] : [],
      shownVoiceRoleKeys:
        mode === "person_voice_roles"
          ? shownVoiceRoleKeys.length > 0
            ? shownVoiceRoleKeys
            : results.map(getVoiceRoleKey).filter(Boolean)
          : [],
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
        shownAnime: animeMode ? results.map(summarizeAnime) : [],
        shownManga: mangaMode ? results.map(summarizeManga) : [],
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
        mediaType: "anime",
        seedCharacter: {
          id: character.id,
          name: character.name
        },
        shownAnimeIds: [],
        shownMangaIds: [],
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

router.post("/manga-overview", async (req, res) => {
  try {
    const { mangaId } = req.body;

    if (!mangaId) {
      return res.status(400).json({
        error: "mangaId is required"
      });
    }

    const manga = await getMangaById(mangaId);

    if (!manga) {
      return res.status(404).json({
        error: "Manga not found"
      });
    }

    const reply = `Here is an overview of ${manga.title}.`;

    const ui = {
      type: "manga_overview",
      data: {
        manga
      }
    };

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: reply,
      source: "jikan",
      ui,
      meta: {
        source: "jikan",
        mode: "manga_overview",
        mediaType: "manga",
        seedManga: {
          id: manga.id,
          title: manga.title
        },
        shownAnimeIds: [],
        shownMangaIds: [manga.id],
        shownCharacterIds: []
      }
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: assistantMessage.meta
    });
  } catch (error) {
    console.error("Manga overview route error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to fetch manga overview"
    });
  }
});

router.post("/anime-action", async (req, res) => {
  try {
    const { animeId, action } = req.body;

    if (!animeId) {
      return res.status(400).json({
        error: "animeId is required"
      });
    }

    if (!["overview", "trailer", "episodes"].includes(action)) {
      return res.status(400).json({
        error: "Valid action is required: overview, trailer, or episodes"
      });
    }

    const anime = await getAnimeById(animeId);

    if (!anime) {
      return res.status(404).json({
        error: "Anime not found"
      });
    }

    let mode = "overview";
    let results = [anime];

    if (action === "trailer") {
      mode = "anime_trailer";
      results = [anime];
    }

    if (action === "episodes") {
      mode = "anime_episodes";
      results = await getAnimeEpisodes(anime.id, 12);
    }

    const provider = process.env.AI_PROVIDER || "gemini";

    const contextInfo = {
      source: `${provider}+jikan`,
      mode,
      mediaType: "anime",
      targetAction: action,
      seedAnimeData: anime,
      seedAnime: {
        id: anime.id,
        title: anime.title
      },
      seedTitle: anime.title,
      resultCount: results.length
    };

    let assistantText;

    try {
      assistantText = await generateAIAnimeResponse(
        `Show ${action} for ${anime.title}`,
        results,
        "",
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
      assistantText = buildFallbackResponse(results, mode, contextInfo);
    }

    const ui = buildChatUiAction(
      `Show ${action} for ${anime.title}`,
      results,
      contextInfo
    );

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: assistantText,
      source: contextInfo.source,
      ui,
      meta: {
        ...contextInfo,
        shownAnimeIds:
          mode === "anime_episodes" ? [anime.id] : results.map((item) => item.id),
        shownMangaIds: [],
        shownCharacterIds: []
      }
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: assistantMessage.meta
    });
  } catch (error) {
    console.error("Anime action route error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to run anime action"
    });
  }
});

router.post("/person-action", async (req, res) => {
  try {
    const { personId, action } = req.body;

    if (!personId) {
      return res.status(400).json({
        error: "personId is required"
      });
    }

    if (!["overview", "voice_roles"].includes(action)) {
      return res.status(400).json({
        error: "Valid action is required: overview or voice_roles"
      });
    }

    const person = await getPersonById(personId);

    if (!person) {
      return res.status(404).json({
        error: "Person not found"
      });
    }

    let mode = "person_overview";
    let results = [person];

    if (action === "voice_roles") {
      mode = "person_voice_roles";
      results = await getPersonVoiceRoles(person.id, 20);
    }

    const provider = process.env.AI_PROVIDER || "gemini";

    const contextInfo = {
      source: `${provider}+jikan`,
      mode,
      mediaType: "anime",
      targetAction: action,
      personName: person.name,
      seedPerson: {
        id: person.id,
        name: person.name
      },
      seedPersonData: person,
      resultCount: results.length
    };

    let assistantText;

    try {
      assistantText = await generateAIAnimeResponse(
        action === "voice_roles"
          ? `Show voice roles for ${person.name}`
          : `Tell me about voice actor ${person.name}`,
        results,
        "",
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
      assistantText = buildFallbackResponse(results, mode, contextInfo);
    }

    const ui = buildChatUiAction(
      action === "voice_roles"
        ? `Show voice roles for ${person.name}`
        : `Tell me about voice actor ${person.name}`,
      results,
      contextInfo
    );

    const shownVoiceRoleKeys =
      mode === "person_voice_roles"
        ? results.map(getVoiceRoleKey).filter(Boolean)
        : [];

    const assistantMessage = await ChatMessage.create({
      role: "assistant",
      content: assistantText,
      source: contextInfo.source,
      ui,
      meta: {
        ...contextInfo,
        shownPersonIds: [person.id],
        shownVoiceRoleKeys,
        shownAnimeIds: [],
        shownMangaIds: [],
        shownCharacterIds: []
      }
    });

    res.json({
      reply: assistantMessage.content,
      ui,
      meta: assistantMessage.meta
    });
  } catch (error) {
    console.error("Person action route error:", error.message);

    res.status(500).json({
      error: error.message || "Failed to run person action"
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