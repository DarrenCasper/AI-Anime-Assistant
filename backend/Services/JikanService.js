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
  return value
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
    const data = await fetchJson(
      `https://api.jikan.moe/v4/anime/${animeId}`,
      "Jikan anime detail"
    );

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