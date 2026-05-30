const ANIME_TAG_MAP = {
  action: { id: 1, name: "Action" },
  adventure: { id: 2, name: "Adventure" },
  comedy: { id: 4, name: "Comedy" },
  mystery: { id: 7, name: "Mystery" },
  drama: { id: 8, name: "Drama" },
  fantasy: { id: 10, name: "Fantasy" },
  horror: { id: 14, name: "Horror" },
  romance: { id: 22, name: "Romance" },
  "sci-fi": { id: 24, name: "Sci-Fi" },
  scifi: { id: 24, name: "Sci-Fi" },
  sports: { id: 30, name: "Sports" },
  supernatural: { id: 37, name: "Supernatural" },
  suspense: { id: 41, name: "Suspense" },

  isekai: { id: 62, name: "Isekai" },
  school: { id: 23, name: "School" },
  harem: { id: 35, name: "Harem" },
  mecha: { id: 18, name: "Mecha" },
  military: { id: 38, name: "Military" },
  psychological: { id: 40, name: "Psychological" },
  vampire: { id: 32, name: "Vampire" },
  "martial arts": { id: 17, name: "Martial Arts" },
  "super power": { id: 31, name: "Super Power" },
  "slice of life": { id: 36, name: "Slice of Life" }
};

export function extractAnimeTag(message) {
  const text = message.toLowerCase();

  const sortedTags = Object.entries(ANIME_TAG_MAP).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [key, tag] of sortedTags) {
    if (text.includes(key)) {
      return tag;
    }
  }

  return null;
}

export function extractGenre(message) {
  return extractAnimeTag(message);
}

export function extractSeasonIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("current season") ||
    text.includes("this season") ||
    text.includes("now airing") ||
    text.includes("airing now")
  ) {
    return { type: "current" };
  }

  if (
    text.includes("next season") ||
    text.includes("upcoming season") ||
    text.includes("upcoming anime")
  ) {
    return { type: "upcoming" };
  }

  const seasonMatch = text.match(
    /\b(winter|spring|summer|fall)\s+(20\d{2})\b/i
  );

  if (seasonMatch) {
    return {
      type: "specific",
      season: seasonMatch[1].toLowerCase(),
      year: Number(seasonMatch[2])
    };
  }

  const yearMatch = text.match(/\b(20\d{2})\b/);

  if (yearMatch) {
    return {
      type: "year",
      year: Number(yearMatch[1])
    };
  }

  return null;
}

export function extractRankingIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("popular") ||
    text.includes("most popular") ||
    text.includes("trending")
  ) {
    return "popular";
  }

  if (
    text.includes("top rated") ||
    text.includes("highest rated") ||
    text.includes("best anime") ||
    text.includes("most rated") ||
    text.includes("highest score")
  ) {
    return "top_rated";
  }

  return null;
}

export function isAnotherRecommendationRequest(message) {
  const text = message.toLowerCase();

  return (
    text.includes("another recommendation") ||
    text.includes("another one") ||
    text.includes("another anime") ||
    text.includes("more recommendation") ||
    text.includes("more recommendations") ||
    text.includes("give me another") ||
    text.includes("how about another")
  );
}

export function isOverviewRequest(message) {
  const text = message.toLowerCase();

  const overviewPatterns = [
    /^tell me about\s+.+/i,
    /^what is\s+.+/i,
    /^give me an overview of\s+.+/i,
    /^overview of\s+.+/i,
    /^overview\s+.+/i,
    /^details? about\s+.+/i,
    /^explain\s+.+/i
  ];

  return overviewPatterns.some((pattern) => pattern.test(text.trim()));
}

export function extractOverviewTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /tell me about\s+(.+)/i,
    /what is\s+(.+)/i,
    /give me an overview of\s+(.+)/i,
    /overview of\s+(.+)/i,
    /overview\s+(.+)/i,
    /details? about\s+(.+)/i,
    /explain\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanOverviewTitle(match[1]);
    }
  }

  return cleanOverviewTitle(cleanMessage);
}

export function isRecommendationRequest(message) {
  const text = message.toLowerCase();

  return (
    text.includes("recommend") ||
    text.includes("recommendation") ||
    text.includes("similar to") ||
    text.includes("anime like") ||
    text.includes("more like") ||
    isAnotherRecommendationRequest(message) ||
    Boolean(extractAnimeTag(message)) ||
    Boolean(extractSeasonIntent(message)) ||
    Boolean(extractRankingIntent(message))
  );
}

export function extractAnimeTitle(message) {
  const tag = extractAnimeTag(message);
  const seasonIntent = extractSeasonIntent(message);
  const rankingIntent = extractRankingIntent(message);

  if (tag || seasonIntent || rankingIntent) {
    return "";
  }

  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = cleanMessage.toLowerCase();

  const noExplicitTitlePhrases = [
    "how about another recommendation",
    "another recommendation",
    "another one",
    "another anime",
    "give me another",
    "more recommendation",
    "more recommendations"
  ];

  if (noExplicitTitlePhrases.some((phrase) => lower.includes(phrase))) {
    return "";
  }

  const patterns = [
    /recommend(?: me)?(?: some)?(?: an)?(?: anime)?(?: similar to| like)\s+(.+)/i,
    /anime like\s+(.+)/i,
    /similar to\s+(.+)/i,
    /more like\s+(.+)/i,
    /like\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanTitle(match[1]);
    }
  }

  return cleanTitle(cleanMessage);
}

export function parseAnimeRequest(message) {
  const tag = extractAnimeTag(message);
  const seasonIntent = extractSeasonIntent(message);
  const rankingIntent = extractRankingIntent(message);
  const wantsOverview = isOverviewRequest(message);
  const wantsAnother = isAnotherRecommendationRequest(message);

  let intent = "search";

  if (wantsOverview) {
    intent = "overview";
  } else if (seasonIntent) {
    intent = seasonIntent.type === "year" ? "year" : "season";
  } else if (rankingIntent || tag) {
    intent = "list";
  } else if (isRecommendationRequest(message)) {
    intent = "recommendation";
  }

  return {
    intent,
    tag,
    seasonIntent,
    rankingIntent,
    wantsOverview,
    wantsAnother,
    overviewTitle: wantsOverview ? extractOverviewTitle(message) : null,
    animeTitle:
      !tag && !seasonIntent && !rankingIntent && !wantsOverview
        ? extractAnimeTitle(message)
        : ""
  };
}

function cleanTitle(title) {
  return title
    .replace(/\bplease\b/gi, "")
    .replace(/\bfor me\b/gi, "")
    .replace(/\banime\b/gi, "")
    .replace(/\brecommendation\b/gi, "")
    .replace(/\brecommendations\b/gi, "")
    .replace(/\brecommend\b/gi, "")
    .replace(/\bgive me\b/gi, "")
    .replace(/\banother\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOverviewTitle(title) {
  return title
    .replace(/\banime\b/gi, "")
    .replace(/\boverview\b/gi, "")
    .replace(/\bdetails?\b/gi, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}