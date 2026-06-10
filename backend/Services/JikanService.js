function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAnime(anime) {
  const jpg = anime.images?.jpg;
  const webp = anime.images?.webp;

  return {
    id: anime.mal_id,

    title: anime.title,
    titleEnglish: anime.title_english,
    titleJapanese: anime.title_japanese,
    titleSynonyms: anime.title_synonyms || [],

    type: anime.type,
    source: anime.source,
    episodes: anime.episodes,
    status: anime.status,
    airing: anime.airing,

    aired: {
      from: anime.aired?.from,
      to: anime.aired?.to,
      string: anime.aired?.string
    },

    duration: anime.duration,
    rating: anime.rating,

    score: anime.score,
    scoredBy: anime.scored_by,
    rank: anime.rank,
    popularity: anime.popularity,
    members: anime.members,
    favorites: anime.favorites,

    season: anime.season,
    year: anime.year,

    broadcast: anime.broadcast
      ? {
        day: anime.broadcast.day,
        time: anime.broadcast.time,
        timezone: anime.broadcast.timezone,
        string: anime.broadcast.string
      }
      : null,

    synopsis: anime.synopsis,
    background: anime.background,

    image:
      webp?.large_image_url ||
      jpg?.large_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    imageSmall:
      webp?.small_image_url ||
      jpg?.small_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    imageLarge:
      webp?.large_image_url ||
      jpg?.large_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    url: anime.url,
    trailerUrl: anime.trailer?.url,
    trailerEmbedUrl: anime.trailer?.embed_url,
    trailerImage: anime.trailer?.images?.maximum_image_url,

    producers: anime.producers?.map((producer) => producer.name) || [],
    licensors: anime.licensors?.map((licensor) => licensor.name) || [],
    studios: anime.studios?.map((studio) => studio.name) || [],

    genres: anime.genres?.map((genre) => genre.name) || [],
    explicitGenres: anime.explicit_genres?.map((genre) => genre.name) || [],
    themes: anime.themes?.map((theme) => theme.name) || [],
    demographics: anime.demographics?.map((demo) => demo.name) || []
  };
}

function normalizeCharacter(character) {
  const jpg = character.images?.jpg;
  const webp = character.images?.webp;

  return {
    id: character.mal_id,
    name: character.name,
    nameKanji: character.name_kanji,
    nicknames: character.nicknames || [],
    about: character.about,
    favorites: character.favorites || 0,
    image: webp?.image_url || jpg?.image_url,
    url: character.url
  };
}

function normalizeManga(manga) {
  const jpg = manga.images?.jpg;
  const webp = manga.images?.webp;

  return {
    id: manga.mal_id,

    title: manga.title,
    titleEnglish: manga.title_english,
    titleJapanese: manga.title_japanese,
    titleSynonyms: manga.title_synonyms || [],

    type: manga.type,
    status: manga.status,
    publishing: manga.publishing,

    published: {
      from: manga.published?.from,
      to: manga.published?.to,
      string: manga.published?.string
    },

    chapters: manga.chapters,
    volumes: manga.volumes,

    score: manga.score,
    scoredBy: manga.scored_by,
    rank: manga.rank,
    popularity: manga.popularity,
    members: manga.members,
    favorites: manga.favorites,

    synopsis: manga.synopsis,
    background: manga.background,

    image:
      webp?.large_image_url ||
      jpg?.large_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    imageSmall:
      webp?.small_image_url ||
      jpg?.small_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    imageLarge:
      webp?.large_image_url ||
      jpg?.large_image_url ||
      webp?.image_url ||
      jpg?.image_url,

    url: manga.url,

    authors: manga.authors?.map((author) => author.name) || [],
    serializations:
      manga.serializations?.map((serialization) => serialization.name) || [],

    genres: manga.genres?.map((genre) => genre.name) || [],
    explicitGenres:
      manga.explicit_genres?.map((genre) => genre.name) || [],
    themes: manga.themes?.map((theme) => theme.name) || [],
    demographics:
      manga.demographics?.map((demo) => demo.name) || []
  };
}

function normalizeAnimeEpisode(episode) {
  return {
    id: episode.mal_id,
    number: episode.mal_id,
    title: episode.title,
    titleJapanese: episode.title_japanese,
    titleRomanji: episode.title_romanji,
    aired: episode.aired,
    score: episode.score,
    filler: episode.filler,
    recap: episode.recap,
    url: episode.url,
    forumUrl: episode.forum_url
  };
}

function normalizePerson(person) {
  const jpg = person.images?.jpg;

  return {
    id: person.mal_id,
    name: person.name,
    givenName: person.given_name,
    familyName: person.family_name,
    alternateNames: person.alternate_names || [],
    birthday: person.birthday,
    favorites: person.favorites || 0,
    about: person.about,
    image: jpg?.image_url,
    url: person.url,
    websiteUrl: person.website_url
  };
}

function normalizePersonVoiceRole(item = {}) {
  const anime = item.anime || {};
  const character = item.character || {};

  return {
    role: item.role || null,

    anime: anime?.mal_id
      ? {
        id: anime.mal_id,
        title: anime.title,
        image:
          anime.images?.webp?.image_url ||
          anime.images?.jpg?.image_url ||
          null,
        url: anime.url || null
      }
      : null,

    character: character?.mal_id
      ? {
        id: character.mal_id,
        name: character.name,
        image:
          character.images?.webp?.image_url ||
          character.images?.jpg?.image_url ||
          null,
        url: character.url || null
      }
      : null
  };
}

function isLowValueVoiceRole(role) {
  if (!role?.anime?.title || !role?.character?.name) return true;

  const title = normalizeForSearch(role.anime.title);
  const type = role.anime.type || "";
  const episodes = role.anime.episodes || 0;

  const blockedTypes = ["Music", "CM", "PV"];

  if (blockedTypes.includes(type)) {
    return true;
  }

  if (type === "Special" && episodes > 0 && episodes <= 3) {
    return true;
  }

  const badTitleWords = [
    "mini anime",
    "mini",
    "chibi",
    "recap",
    "recaps",
    "summary",
    "digest",
    "music video",
    "commercial",
    "cm",
    "pv",
    "specials",
    "special",
    "shitsumonbako",
    "x mlb",
    "collab",
    "collaboration"
  ];

  if (badTitleWords.some((word) => title.includes(word))) {
    return true;
  }

  return false;
}

function getVoiceRoleScore(role) {
  if (!role?.anime) return 0;

  let score = 0;

  if (role.role === "Main") {
    score += 5000;
  } else if (role.role === "Supporting") {
    score += 1000;
  }

  if (role.anime.type === "TV") score += 900;
  if (role.anime.type === "Movie") score += 700;
  if (role.anime.type === "OVA") score += 250;
  if (role.anime.type === "ONA") score += 200;

  if (role.anime.score) {
    score += Number(role.anime.score) * 120;
  }

  if (role.anime.popularity) {
    score += Math.max(0, 10000 - Number(role.anime.popularity)) / 2;
  }

  if (role.anime.rank) {
    score += Math.max(0, 10000 - Number(role.anime.rank)) / 3;
  }

  if (role.anime.episodes && role.anime.episodes > 3) {
    score += 150;
  }

  return score;
}

function sortVoiceRolesByValue(roles) {
  return [...roles].sort((a, b) => {
    const scoreA = getVoiceRoleScore(a);
    const scoreB = getVoiceRoleScore(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    if (a.role === "Main" && b.role !== "Main") return -1;
    if (a.role !== "Main" && b.role === "Main") return 1;

    return 0;
  });
}

function enrichVoiceRoleWithAnimeDetail(role, animeDetail) {
  if (!animeDetail || !role?.anime) {
    return role;
  }

  return {
    ...role,
    anime: {
      ...role.anime,
      title: animeDetail.title || role.anime.title,
      image: animeDetail.image || role.anime.image,
      url: animeDetail.url || role.anime.url,
      type: animeDetail.type,
      episodes: animeDetail.episodes,
      score: animeDetail.score,
      popularity: animeDetail.popularity,
      rank: animeDetail.rank,
      year: animeDetail.year,
      genres: animeDetail.genres || []
    }
  };
}

function getPersonRelevanceScore(person, query) {
  const queryText = normalizeForSearch(query);
  const nameText = normalizeForSearch(person.name);
  const givenNameText = normalizeForSearch(person.givenName);
  const familyNameText = normalizeForSearch(person.familyName);
  const alternateText = normalizeForSearch(
    (person.alternateNames || []).join(" ")
  );

  const searchableText = `${nameText} ${givenNameText} ${familyNameText} ${alternateText}`;
  const tokens = getSearchTokens(query);
  const favorites = person.favorites || 0;

  if (!queryText || !nameText) {
    return favorites;
  }

  let score = 0;

  score += favorites * 5;

  if (nameText === queryText) score += 1_000_000;

  if (tokens.length >= 2) {
    if (tokens.every((token) => searchableText.includes(token))) {
      score += 700_000;
    }

    if (searchableText.includes(queryText)) {
      score += 300_000;
    }

    return score;
  }

  if (nameText.includes(queryText)) score += 50_000;
  if (searchableText.includes(queryText)) score += 20_000;

  return score;
}

function sortPeopleByRelevance(people, query) {
  return [...people].sort((a, b) => {
    const scoreA = getPersonRelevanceScore(a, query);
    const scoreB = getPersonRelevanceScore(b, query);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return (b.favorites || 0) - (a.favorites || 0);
  });
}

export async function getAnimeEpisodes(animeId, limit = 12, page = 1) {
  try {
    const url = new URL(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);

    url.searchParams.append("page", String(page));

    const data = await fetchJson(url, "Jikan anime episodes");

    return (data.data || [])
      .map(normalizeAnimeEpisode)
      .filter((episode) => episode.title)
      .slice(0, limit);
  } catch (error) {
    console.error("Jikan anime episodes error:", error.message);
    throw new Error("Failed to fetch anime episodes from Jikan API");
  }
}

export async function searchManga(query, limit = 5) {
  try {
    const url = new URL("https://api.jikan.moe/v4/manga");

    url.searchParams.append("q", query);
    url.searchParams.append("limit", String(limit));
    url.searchParams.append("sfw", "true");

    const data = await fetchJson(url, "Jikan manga search");

    return data.data
      .map(normalizeManga)
      .filter((manga) => manga.title && manga.image);
  } catch (error) {
    console.error("Jikan manga search error:", error.message);
    throw new Error("Failed to fetch manga data from Jikan API");
  }
}

export async function searchMangaAdvanced({
  tagId = null,
  year = null,
  ranking = null,
  status = null,
  limit = 10
}) {
  try {
    const url = new URL("https://api.jikan.moe/v4/manga");

    if (tagId) {
      url.searchParams.append("genres", String(tagId));
    }

    if (year) {
      url.searchParams.append("start_date", `${year}-01-01`);
      url.searchParams.append("end_date", `${year}-12-31`);
    }

    if (status) {
      url.searchParams.append("status", status);
    }

    if (ranking === "popular") {
      url.searchParams.append("order_by", "popularity");
      url.searchParams.append("sort", "asc");
    } else if (ranking === "top_rated") {
      url.searchParams.append("order_by", "score");
      url.searchParams.append("sort", "desc");
      url.searchParams.append("min_score", "7");
    } else {
      url.searchParams.append("order_by", "score");
      url.searchParams.append("sort", "desc");
      url.searchParams.append("min_score", "7");
    }

    url.searchParams.append("sfw", "true");
    url.searchParams.append("limit", String(limit));

    const data = await fetchJson(url, "Jikan advanced manga search");

    return data.data
      .map(normalizeManga)
      .filter((manga) => manga.title && manga.image);
  } catch (error) {
    console.error("Jikan advanced manga search error:", error.message);
    throw new Error("Failed to fetch advanced manga search from Jikan API");
  }
}

export async function getMangaById(mangaId) {
  try {
    const data = await fetchJson(
      `https://api.jikan.moe/v4/manga/${mangaId}/full`,
      "Jikan manga detail"
    );

    return normalizeManga(data.data);
  } catch (error) {
    console.error("Jikan manga detail error:", error.message);
    return null;
  }
}

export async function getMangaRecommendations(
  mangaId,
  limit = 4,
  excludeIds = []
) {
  try {
    const excluded = new Set(excludeIds.map(String));

    const data = await fetchJson(
      `https://api.jikan.moe/v4/manga/${mangaId}/recommendations`,
      "Jikan manga recommendations"
    );

    return data.data
      .slice(0, 20)
      .map((item) => ({
        id: item.entry.mal_id,
        title: item.entry.title,
        image:
          item.entry.images?.webp?.image_url ||
          item.entry.images?.jpg?.image_url,
        url: item.entry.url
      }))
      .filter((manga) => !excluded.has(String(manga.id)))
      .slice(0, limit);
  } catch (error) {
    console.error("Jikan manga recommendations error:", error.message);
    throw new Error("Failed to fetch manga recommendations from Jikan API");
  }
}

export function filterMangaByTag(mangaList, tagName) {
  if (!tagName) return mangaList;

  const target = tagName.toLowerCase();

  return mangaList.filter((manga) => {
    const genres = manga.genres || [];
    const themes = manga.themes || [];
    const demographics = manga.demographics || [];

    return [...genres, ...themes, ...demographics].some(
      (item) => item.toLowerCase() === target
    );
  });
}

export function sortMangaList(mangaList, ranking = null) {
  const list = [...mangaList];

  if (ranking === "popular") {
    return list.sort((a, b) => {
      const aPopularity = a.popularity || Number.MAX_SAFE_INTEGER;
      const bPopularity = b.popularity || Number.MAX_SAFE_INTEGER;
      return aPopularity - bPopularity;
    });
  }

  if (ranking === "top_rated") {
    return list.sort((a, b) => {
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      return bScore - aScore;
    });
  }

  return list;
}

function isGoodRecommendation(anime) {
  if (!anime) return false;
  if (!anime.title || !anime.image) return false;

  const badTypes = ["Music", "CM", "PV"];

  if (badTypes.includes(anime.type)) return false;

  if (anime.score !== null && anime.score !== undefined && anime.score < 6.5) {
    return false;
  }

  return true;
}

async function fetchJson(url, errorLabel, retries = 2) {
  const response = await fetch(url);

  if (response.status === 429) {
    if (retries > 0) {
      console.log(`${errorLabel}: rate limited by Jikan. Retrying...`);
      await sleep(2000);
      return fetchJson(url, errorLabel, retries - 1);
    }

    throw new Error(`${errorLabel} status 429`);
  }

  if (!response.ok) {
    throw new Error(`${errorLabel} status ${response.status}`);
  }

  return response.json();
}

function normalizeForSearch(value = "") {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTokens(value = "") {
  return normalizeForSearch(value)
    .split(" ")
    .filter(Boolean);
}

function getCharacterRelevanceScore(character, query) {
  const queryText = normalizeForSearch(query);
  const nameText = normalizeForSearch(character.name);
  const tokens = getSearchTokens(query);
  const favorites = character.favorites || 0;

  if (!queryText || !nameText) {
    return favorites;
  }

  let score = 0;

  // Popularity matters a lot for ambiguous single-name searches.
  // Example: "Megumi" should allow "Fushiguro, Megumi" to rank higher
  // than random exact-name "Megumi" characters with very low favorites.
  score += favorites * 10;

  // Multi-word query means the user is probably specific.
  // Example: "Megumi Fushiguro"
  if (tokens.length >= 2) {
    if (nameText === queryText) {
      score += 1_000_000;
    }

    if (tokens.every((token) => nameText.includes(token))) {
      score += 700_000;
    }

    if (nameText.includes(queryText)) {
      score += 300_000;
    }

    return score;
  }

  // Single-word query means ambiguous.
  // Do not over-prioritize exact low-popularity names.
  if (nameText === queryText) {
    score += 5_000;
  }

  if (nameText.startsWith(queryText)) {
    score += 3_000;
  }

  if (nameText.includes(queryText)) {
    score += 10_000;
  }

  return score;
}

function sortCharactersByRelevance(characters, query) {
  return [...characters].sort((a, b) => {
    const scoreA = getCharacterRelevanceScore(a, query);
    const scoreB = getCharacterRelevanceScore(b, query);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return (b.favorites || 0) - (a.favorites || 0);
  });
}

export async function searchAnime(query, limit = 5) {
  try {
    const url = new URL("https://api.jikan.moe/v4/anime");

    url.searchParams.append("q", query);
    url.searchParams.append("limit", String(limit));
    url.searchParams.append("sfw", "true");

    const data = await fetchJson(url, "Jikan anime search");

    return data.data.map(normalizeAnime).filter((anime) => anime.title);
  } catch (error) {
    console.error("Jikan anime search error:", error.message);
    throw new Error("Failed to fetch anime data from Jikan API");
  }
}

export async function searchAnimeAdvanced({
  tagId = null,
  year = null,
  ranking = null,
  limit = 10
}) {
  try {
    const url = new URL("https://api.jikan.moe/v4/anime");

    if (tagId) {
      url.searchParams.append("genres", String(tagId));
    }

    if (year) {
      url.searchParams.append("start_date", `${year}-01-01`);
      url.searchParams.append("end_date", `${year}-12-31`);
    }

    if (ranking === "popular") {
      url.searchParams.append("order_by", "popularity");
      url.searchParams.append("sort", "asc");
    } else if (ranking === "top_rated") {
      url.searchParams.append("order_by", "score");
      url.searchParams.append("sort", "desc");
      url.searchParams.append("min_score", "7");
    } else {
      url.searchParams.append("order_by", "score");
      url.searchParams.append("sort", "desc");
      url.searchParams.append("min_score", "7");
    }

    url.searchParams.append("sfw", "true");
    url.searchParams.append("limit", String(limit));

    const data = await fetchJson(url, "Jikan advanced anime search");

    return data.data
      .map(normalizeAnime)
      .filter((anime) => anime.title && anime.image);
  } catch (error) {
    console.error("Jikan advanced search error:", error.message);
    throw new Error("Failed to fetch advanced anime search from Jikan API");
  }
}

export async function searchAnimeByTag(tagId, limit = 5) {
  return searchAnimeAdvanced({
    tagId,
    ranking: "top_rated",
    limit
  });
}

export async function searchAnimeByGenre(genreId, limit = 5) {
  return searchAnimeByTag(genreId, limit);
}

export async function searchAnimeByYear(year, limit = 10) {
  return searchAnimeAdvanced({
    year,
    ranking: "top_rated",
    limit
  });
}

export async function getCurrentSeasonAnime(limit = 10) {
  return fetchSeasonEndpoint("https://api.jikan.moe/v4/seasons/now", limit);
}

export async function getUpcomingSeasonAnime(limit = 10) {
  return fetchSeasonEndpoint(
    "https://api.jikan.moe/v4/seasons/upcoming",
    limit
  );
}

export async function getSpecificSeasonAnime(year, season, limit = 10) {
  return fetchSeasonEndpoint(
    `https://api.jikan.moe/v4/seasons/${year}/${season}`,
    limit
  );
}

async function fetchSeasonEndpoint(endpoint, limit = 10) {
  try {
    const url = new URL(endpoint);

    url.searchParams.append("sfw", "true");
    url.searchParams.append("limit", String(limit));

    const data = await fetchJson(url, "Jikan season search");

    return data.data
      .map(normalizeAnime)
      .filter((anime) => anime.title && anime.image);
  } catch (error) {
    console.error("Jikan season search error:", error.message);
    throw new Error("Failed to fetch season anime from Jikan API");
  }
}

export async function getPopularAnime(limit = 10) {
  return searchAnimeAdvanced({
    ranking: "popular",
    limit
  });
}

export async function getTopRatedAnime(limit = 10) {
  return searchAnimeAdvanced({
    ranking: "top_rated",
    limit
  });
}

export function filterAnimeByTag(animeList, tagName) {
  if (!tagName) return animeList;

  const target = tagName.toLowerCase();

  return animeList.filter((anime) => {
    const genres = anime.genres || [];
    const themes = anime.themes || [];

    return [...genres, ...themes].some(
      (item) => item.toLowerCase() === target
    );
  });
}

export function sortAnimeList(animeList, ranking = null) {
  const list = [...animeList];

  if (ranking === "popular") {
    return list.sort((a, b) => {
      const aPopularity = a.popularity || Number.MAX_SAFE_INTEGER;
      const bPopularity = b.popularity || Number.MAX_SAFE_INTEGER;
      return aPopularity - bPopularity;
    });
  }

  if (ranking === "top_rated") {
    return list.sort((a, b) => {
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      return bScore - aScore;
    });
  }

  return list;
}

export async function getAnimeById(animeId) {
  try {
    if (!animeId) return null;

    const data = await fetchJson(
      `https://api.jikan.moe/v4/anime/${animeId}/full`,
      "Jikan anime detail"
    );

    if (!data?.data) {
      return null;
    }

    return normalizeAnime(data.data);
  } catch (error) {
    console.error("Jikan anime detail error:", error.message);
    return null;
  }
}

export async function getAnimeRecommendations(
  animeId,
  limit = 4,
  excludeIds = []
) {
  try {
    const excluded = new Set(excludeIds.map(String));

    const data = await fetchJson(
      `https://api.jikan.moe/v4/anime/${animeId}/recommendations`,
      "Jikan recommendations"
    );

    const basicRecommendations = data.data
      .slice(0, 20)
      .map((item) => ({
        id: item.entry.mal_id,
        title: item.entry.title,
        image: item.entry.images?.jpg?.image_url,
        url: item.entry.url
      }))
      .filter((anime) => !excluded.has(String(anime.id)));

    const detailedRecommendations = [];

    for (const anime of basicRecommendations) {
      if (detailedRecommendations.length >= limit) break;

      const detail = await getAnimeById(anime.id);

      if (isGoodRecommendation(detail)) {
        detailedRecommendations.push(detail);
      }

      await sleep(1200);
    }

    return detailedRecommendations;
  } catch (error) {
    console.error("Jikan recommendations error:", error.message);
    throw new Error("Failed to fetch anime recommendations from Jikan API");
  }
}

export async function getAnimeCharacters(animeId, limit = 12) {
  try {
    const data = await fetchJson(
      `https://api.jikan.moe/v4/anime/${animeId}/characters`,
      "Jikan anime characters"
    );

    const characters = data.data.map((item) => ({
      id: item.character.mal_id,
      name: item.character.name,
      role: item.role,
      image:
        item.character.images?.webp?.image_url ||
        item.character.images?.jpg?.image_url,
      url: item.character.url,
      favorites: item.favorites || 0,
      voiceActors:
        item.voice_actors?.slice(0, 3).map((va) => ({
          id: va.person.mal_id,
          name: va.person.name,
          language: va.language,
          image:
            va.person.images?.jpg?.image_url ||
            va.person.images?.webp?.image_url,
          url: va.person.url
        })) || []
    }));

    return characters
      .sort((a, b) => {
        if (a.role === "Main" && b.role !== "Main") return -1;
        if (a.role !== "Main" && b.role === "Main") return 1;

        return (b.favorites || 0) - (a.favorites || 0);
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Jikan anime characters error:", error.message);
    throw new Error("Failed to fetch anime characters from Jikan API");
  }
}

export async function searchCharacters(query, limit = 8) {
  try {
    const url = new URL("https://api.jikan.moe/v4/characters");

    url.searchParams.append("q", query);

    // Fetch more than needed so we can rank locally.
    url.searchParams.append("limit", String(Math.max(limit, 25)));

    const data = await fetchJson(url, "Jikan character search");

    const characters = data.data
      .map(normalizeCharacter)
      .filter((character) => character.name && character.image);

    return sortCharactersByRelevance(characters, query).slice(0, limit);
  } catch (error) {
    console.error("Jikan character search error:", error.message);
    throw new Error("Failed to search characters from Jikan API");
  }
}

export async function getCharacterById(characterId) {
  try {
    const data = await fetchJson(
      `https://api.jikan.moe/v4/characters/${characterId}/full`,
      "Jikan character detail"
    );

    const character = data.data;

    return {
      ...normalizeCharacter(character),
      anime:
        character.anime?.map((item) => ({
          id: item.anime.mal_id,
          title: item.anime.title,
          role: item.role,
          image:
            item.anime.images?.webp?.image_url ||
            item.anime.images?.jpg?.image_url,
          url: item.anime.url
        })) || [],
      manga:
        character.manga?.map((item) => ({
          id: item.manga.mal_id,
          title: item.manga.title,
          role: item.role,
          image:
            item.manga.images?.webp?.image_url ||
            item.manga.images?.jpg?.image_url,
          url: item.manga.url
        })) || [],
      voiceActors:
        character.voices?.slice(0, 8).map((voice) => ({
          id: voice.person.mal_id,
          name: voice.person.name,
          language: voice.language,
          image:
            voice.person.images?.jpg?.image_url ||
            voice.person.images?.webp?.image_url,
          url: voice.person.url
        })) || []
    };
  } catch (error) {
    console.error("Jikan character detail error:", error.message);
    throw new Error("Failed to fetch character detail from Jikan API");
  }
}

export async function searchPeople(query, limit = 8) {
  try {
    const safeQuery = String(query ?? "").trim();

    if (!safeQuery) {
      return [];
    }

    const url = new URL("https://api.jikan.moe/v4/people");

    url.searchParams.append("q", safeQuery);
    url.searchParams.append("limit", String(Math.max(limit, 12)));

    const data = await fetchJson(url, "Jikan people search");

    const people = (data.data || [])
      .map(normalizePerson)
      .filter((person) => person.name && person.image);

    return sortPeopleByRelevance(people, safeQuery).slice(0, limit);
  } catch (error) {
    console.error("Jikan people search error:", error.message);
    throw new Error("Failed to search people from Jikan API");
  }
}

export async function getPersonById(personId) {
  try {
    if (!personId) return null;

    const data = await fetchJson(
      `https://api.jikan.moe/v4/people/${personId}/full`,
      "Jikan person detail"
    );

    const person = data.data;

    if (!person) {
      return null;
    }

    const voices = (person.voices || [])
      .map(normalizePersonVoiceRole)
      .filter((role) => !isBadVoiceRole(role))
      .sort((a, b) => scoreVoiceRole(b) - scoreVoiceRole(a))
      .slice(0, 8);

    return {
      ...normalizePerson(person),

      anime:
        person.anime?.slice(0, 12).map((item) => ({
          position: item.position,
          id: item.anime?.mal_id,
          title: item.anime?.title,
          image:
            item.anime?.images?.webp?.image_url ||
            item.anime?.images?.jpg?.image_url,
          url: item.anime?.url
        })) || [],

      manga:
        person.manga?.slice(0, 8).map((item) => ({
          position: item.position,
          id: item.manga?.mal_id,
          title: item.manga?.title,
          image:
            item.manga?.images?.webp?.image_url ||
            item.manga?.images?.jpg?.image_url,
          url: item.manga?.url
        })) || [],

      voices
    };
  } catch (error) {
    console.error("Jikan person detail error:", error.message);
    throw new Error("Failed to fetch person detail from Jikan API");
  }
}

function isBadVoiceRole(role) {
  if (!role?.anime?.title || !role?.character?.name) return true;

  const title = normalizeForSearch(role.anime.title);

  const badTitleWords = [
    "mini anime",
    "mini",
    "chibi",
    "recap",
    "recaps",
    "summary",
    "digest",
    "music video",
    "commercial",
    "cm",
    "pv",
    "special",
    "specials",
    "shitsumonbako",
    "x mlb",
    "collab",
    "collaboration",
    "event",
    "festival",
    "promo"
  ];

  return badTitleWords.some((word) => title.includes(word));
}

function scoreVoiceRole(role) {
  let score = 0;

  const title = normalizeForSearch(role.anime?.title || "");

  if (role.role === "Main") score += 5000;
  if (role.role === "Supporting") score += 1000;

  // Prefer normal anime titles over side entries.
  if (!title.includes("ova")) score += 200;
  if (!title.includes("ona")) score += 150;
  if (!title.includes("special")) score += 300;
  if (!title.includes("mini")) score += 300;
  if (!title.includes("recap")) score += 300;

  // Small title quality bonuses.
  if (role.anime?.title?.length <= 80) score += 100;
  if (role.character?.image) score += 100;
  if (role.anime?.image) score += 100;

  return score;
}

function getVoiceRoleDedupeKey(role) {
  if (role?.character?.id) {
    return `character-${role.character.id}`;
  }

  return `character-name-${normalizeForSearch(role?.character?.name || "")}`;
}

function getVoiceRoleDisplayScore(role) {
  let score = scoreVoiceRole(role);

  const animeTitle = normalizeForSearch(role?.anime?.title || "");

  // Prefer the cleaner/base-looking entry when the same character appears
  // across multiple seasons, specials, OVAs, etc.
  if (!animeTitle.includes("season")) score += 400;
  if (!animeTitle.includes("2nd")) score += 150;
  if (!animeTitle.includes("3rd")) score += 150;
  if (!animeTitle.includes("movie")) score += 120;
  if (!animeTitle.includes("ova")) score += 200;
  if (!animeTitle.includes("ona")) score += 200;

  return score;
}

function mergeDuplicateVoiceRoles(roles = []) {
  const grouped = new Map();

  for (const role of roles) {
    const key = getVoiceRoleDedupeKey(role);

    if (!key) continue;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...role,
        appearances: role.anime ? [role.anime] : []
      });
      continue;
    }

    const existing = grouped.get(key);

    const existingAppearanceIds = new Set(
      (existing.appearances || []).map((anime) => String(anime.id))
    );

    if (role.anime?.id && !existingAppearanceIds.has(String(role.anime.id))) {
      existing.appearances = [...(existing.appearances || []), role.anime];
    }

    const existingScore = getVoiceRoleDisplayScore(existing);
    const newScore = getVoiceRoleDisplayScore(role);

    // Keep the better display representative, but preserve all appearances.
    if (newScore > existingScore) {
      grouped.set(key, {
        ...role,
        appearances: existing.appearances
      });
    }
  }

  return [...grouped.values()];
}

export async function getPersonVoiceRoles(personId, limit = 20) {
  try {
    if (!personId) return [];

    const allRawRoles = [];

    // Fetch only person voice pages.
    // Do NOT call getAnimeById for every role, because it rate-limits Jikan.
    for (let page = 1; page <= 3; page++) {
      const url = new URL(`https://api.jikan.moe/v4/people/${personId}/voices`);
      url.searchParams.append("page", String(page));

      const data = await fetchJson(
        url,
        `Jikan person voice roles page ${page}`
      );

      allRawRoles.push(...(data.data || []));

      if (!data.pagination?.has_next_page) break;

      await sleep(450);
    }

    const roles = allRawRoles
      .map(normalizePersonVoiceRole)
      .filter((role) => !isBadVoiceRole(role));

    const mergedRoles = mergeDuplicateVoiceRoles(roles)
      .sort((a, b) => scoreVoiceRole(b) - scoreVoiceRole(a));

    return mergedRoles.slice(0, limit);
  } catch (error) {
    console.error("Jikan person voice roles error:", error.message);
    throw new Error("Failed to fetch person voice roles from Jikan API");
  }
}