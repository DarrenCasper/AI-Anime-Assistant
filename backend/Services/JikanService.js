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