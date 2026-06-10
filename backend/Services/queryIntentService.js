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

export function extractMediaType(message) {
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

  return "anime";
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

export function extractMangaStatusIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("currently publishing") ||
    text.includes("publishing manga") ||
    text.includes("ongoing manga") ||
    text.includes("ongoing manhwa") ||
    text.includes("ongoing webtoon")
  ) {
    return "publishing";
  }

  if (
    text.includes("completed manga") ||
    text.includes("finished manga") ||
    text.includes("complete manga") ||
    text.includes("completed manhwa") ||
    text.includes("finished manhwa")
  ) {
    return "complete";
  }

  if (text.includes("hiatus manga") || text.includes("on hiatus")) {
    return "hiatus";
  }

  if (text.includes("discontinued manga")) {
    return "discontinued";
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
    text.includes("best manga") ||
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
    text.includes("another manga") ||
    text.includes("more recommendation") ||
    text.includes("more recommendations") ||
    text.includes("give me another") ||
    text.includes("how about another")
  );
}

export function isCharacterListRequest(message) {
  const text = message.toLowerCase().trim();

  const patterns = [
    /characters?\s+(in|from|of)\s+.+/i,
    /cast\s+(in|from|of)\s+.+/i,
    /main cast\s+(in|from|of)\s+.+/i,
    /who are the characters\s+(in|from|of)\s+.+/i,
    /show me characters\s+(in|from|of)\s+.+/i,
    /show characters\s+(in|from|of)\s+.+/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function extractCharacterAnimeTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /characters?\s+(?:in|from|of)\s+(.+)/i,
    /cast\s+(?:in|from|of)\s+(.+)/i,
    /main cast\s+(?:in|from|of)\s+(.+)/i,
    /who are the characters\s+(?:in|from|of)\s+(.+)/i,
    /show me characters\s+(?:in|from|of)\s+(.+)/i,
    /show characters\s+(?:in|from|of)\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanCharacterAnimeTitle(match[1]);
    }
  }

  return cleanCharacterAnimeTitle(cleanMessage);
}

export function isExplicitCharacterOverviewRequest(message) {
  const text = message.toLowerCase().trim();

  const patterns = [
    /^tell me about character\s+.+/i,
    /^tell me about the character\s+.+/i,
    /^who is character\s+.+/i,
    /^who is the character\s+.+/i,
    /^explain character\s+.+/i,
    /^character overview of\s+.+/i,
    /^character details? about\s+.+/i,
    /^details? about character\s+.+/i,
    /^what is character\s+.+/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function extractCharacterName(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /tell me about character\s+(.+)/i,
    /tell me about the character\s+(.+)/i,
    /who is character\s+(.+)/i,
    /who is the character\s+(.+)/i,
    /explain character\s+(.+)/i,
    /character overview of\s+(.+)/i,
    /character details? about\s+(.+)/i,
    /details? about character\s+(.+)/i,
    /what is character\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanCharacterName(match[1]);
    }
  }

  return cleanCharacterName(cleanMessage);
}

export function isExplicitAnimeOverviewRequest(message) {
  const text = message.toLowerCase().trim();

  const patterns = [
    /^tell me about anime\s+.+/i,
    /^tell me about the anime\s+.+/i,
    /^anime overview of\s+.+/i,
    /^overview of anime\s+.+/i,
    /^details? about anime\s+.+/i,
    /^what is anime\s+.+/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function extractExplicitAnimeOverviewTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanMessage
    .replace(/^tell me about the anime\s+/i, "")
    .replace(/^tell me about anime\s+/i, "")
    .replace(/^anime overview of\s+/i, "")
    .replace(/^overview of anime\s+/i, "")
    .replace(/^details? about anime\s+/i, "")
    .replace(/^what is anime\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isExplicitMangaOverviewRequest(message) {
  const text = message.toLowerCase().trim();

  const patterns = [
    /^tell me about manga\s+.+/i,
    /^tell me about the manga\s+.+/i,
    /^tell me about manhwa\s+.+/i,
    /^tell me about the manhwa\s+.+/i,
    /^tell me about manhua\s+.+/i,
    /^tell me about webtoon\s+.+/i,

    /^manga overview of\s+.+/i,
    /^manhwa overview of\s+.+/i,
    /^overview of manga\s+.+/i,
    /^overview of manhwa\s+.+/i,

    /^details? about manga\s+.+/i,
    /^details? about manhwa\s+.+/i,
    /^what is manga\s+.+/i,
    /^what is manhwa\s+.+/i,

    /^tell me about\s+.+\s+(manga|manhwa|manhua|webtoon)$/i,
    /^what is\s+.+\s+(manga|manhwa|manhua|webtoon)$/i,
    /^details? about\s+.+\s+(manga|manhwa|manhua|webtoon)$/i,
    /^overview of\s+.+\s+(manga|manhwa|manhua|webtoon)$/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function extractMangaOverviewTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanMessage
    .replace(/^tell me about the manga\s+/i, "")
    .replace(/^tell me about manga\s+/i, "")
    .replace(/^tell me about the manhwa\s+/i, "")
    .replace(/^tell me about manhwa\s+/i, "")
    .replace(/^tell me about manhua\s+/i, "")
    .replace(/^tell me about webtoon\s+/i, "")
    .replace(/^manga overview of\s+/i, "")
    .replace(/^manhwa overview of\s+/i, "")
    .replace(/^overview of manga\s+/i, "")
    .replace(/^overview of manhwa\s+/i, "")
    .replace(/^details? about manga\s+/i, "")
    .replace(/^details? about manhwa\s+/i, "")
    .replace(/^what is manga\s+/i, "")
    .replace(/^what is manhwa\s+/i, "")
    .replace(/\b(manga|manhwa|manhua|webtoon)\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isOverviewRequest(message) {
  const text = message.toLowerCase().trim();

  const badOverviewPhrases = [
    "what is a good",
    "what are good",
    "what is the best",
    "what are the best",
    "what should i watch",
    "what should i read"
  ];

  if (badOverviewPhrases.some((phrase) => text.includes(phrase))) {
    return false;
  }

  const overviewPatterns = [
    /^tell me about\s+.+/i,
    /^what is\s+.+/i,
    /^give me an overview of\s+.+/i,
    /^overview of\s+.+/i,
    /^overview\s+.+/i,
    /^details? about\s+.+/i,
    /^explain\s+.+/i
  ];

  return overviewPatterns.some((pattern) => pattern.test(text));
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
    text.includes("manga like") ||
    text.includes("manhwa like") ||
    text.includes("webtoon like") ||
    text.includes("more like") ||
    isAnotherRecommendationRequest(message) ||
    Boolean(extractAnimeTag(message)) ||
    Boolean(extractSeasonIntent(message)) ||
    Boolean(extractRankingIntent(message)) ||
    Boolean(extractMangaStatusIntent(message))
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

export function extractMangaTitle(message) {
  const tag = extractAnimeTag(message);
  const seasonIntent = extractSeasonIntent(message);
  const rankingIntent = extractRankingIntent(message);
  const mangaStatusIntent = extractMangaStatusIntent(message);

  if (tag || seasonIntent || rankingIntent || mangaStatusIntent) {
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
    "another manga",
    "another manhwa",
    "give me another",
    "more recommendation",
    "more recommendations"
  ];

  if (noExplicitTitlePhrases.some((phrase) => lower.includes(phrase))) {
    return "";
  }

  const patterns = [
    /recommend(?: me)?(?: some)?(?: a)?(?: manga|manhwa|manhua|webtoon)?(?: similar to| like)\s+(.+)/i,
    /(?:manga|manhwa|manhua|webtoon) like\s+(.+)/i,
    /similar (?:manga|manhwa|manhua|webtoon) to\s+(.+)/i,
    /more like\s+(.+)/i,
    /like\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanMangaTitle(match[1]);
    }
  }

  return cleanMangaTitle(cleanMessage);
}

export function isAnimeTrailerRequest(message) {
  const text = message.toLowerCase();

  return (
    text.includes("trailer") ||
    text.includes("teaser") ||
    text.includes("pv") ||
    text.includes("promo video") ||
    text.includes("promotional video")
  );
}

export function isAnimeEpisodesRequest(message) {
  const text = message.toLowerCase();

  return (
    text.includes("episodes") ||
    text.includes("episode list") ||
    text.includes("list episode") ||
    text.includes("how many episodes")
  );
}

export function extractAnimeTrailerTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /(?:show|play|watch)\s+(?:me\s+)?(?:the\s+)?(?:official\s+)?(?:anime\s+)?(?:trailer|teaser|pv|promo video|promotional video)\s+(?:for|of|from)?\s+(.+)/i,
    /(?:the\s+)?(?:official\s+)?(?:anime\s+)?(?:trailer|teaser|pv|promo video|promotional video)\s+(?:for|of|from)\s+(.+)/i,
    /(.+?)\s+(?:anime\s+)?(?:trailer|teaser|pv|promo video|promotional video)$/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanAnimeFeatureTitle(match[1]);
    }
  }

  return cleanAnimeFeatureTitle(cleanMessage);
}

export function extractAnimeEpisodesTitle(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /(?:show|list)\s+(?:me\s+)?(?:the\s+)?(?:anime\s+)?episodes?\s+(?:for|of|from|in)?\s+(.+)/i,
    /(?:show|list)\s+(?:me\s+)?(?:the\s+)?episode list\s+(?:for|of|from|in)?\s+(.+)/i,
    /(?:how many episodes)\s+(?:does|do|are|is)?\s+(.+?)\s+(?:have|has)?$/i,
    /(.+?)\s+(?:anime\s+)?episodes?$/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanAnimeFeatureTitle(match[1]);
    }
  }

  return cleanAnimeFeatureTitle(cleanMessage);
}

function cleanAnimeFeatureTitle(title) {
  return title
    .replace(/\banime\b/gi, "")
    .replace(/\bofficial\b/gi, "")
    .replace(/\btrailer\b/gi, "")
    .replace(/\bteaser\b/gi, "")
    .replace(/\bpv\b/gi, "")
    .replace(/\bpromo video\b/gi, "")
    .replace(/\bpromotional video\b/gi, "")
    .replace(/\bepisodes?\b/gi, "")
    .replace(/\bepisode list\b/gi, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\bfor me\b/gi, "")
    .replace(/\bshow me\b/gi, "")
    .replace(/\bshow\b/gi, "")
    .replace(/\bwatch\b/gi, "")
    .replace(/\bplay\b/gi, "")
    .replace(/\bof\b/gi, "")
    .replace(/\bfor\b/gi, "")
    .replace(/\bfrom\b/gi, "")
    .replace(/\bin\b/gi, "")
    .replace(/\bthe\b/gi, "")
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPersonOverviewRequest(message) {
  const text = message.toLowerCase();

  return (
    text.includes("voice actor") ||
    text.includes("voice actress") ||
    text.includes("seiyuu") ||
    text.includes("seiyu") ||
    text.includes("va ") ||
    text.startsWith("va ") ||
    text.includes(" who is ") ||
    text.startsWith("who is ") ||
    text.startsWith("do you know about ")
  );
}

export function isPersonVoiceRolesRequest(message) {
  const text = message.toLowerCase();

  const hasVoiceRolePhrase =
    text.includes("what anime does") ||
    text.includes("which anime does") ||
    text.includes("what anime is") ||
    text.includes("which anime is") ||
    text.includes("anime voiced by") ||
    text.includes("voiced by") ||
    text.includes("voice roles") ||
    text.includes("roles of") ||
    text.includes("voices in") ||
    text.includes("voice in") ||
    text.includes("voice for") ||
    text.includes("voiced in") ||
    text.includes("voiced for");

  const hasPersonVoiceContext =
    text.includes("voice actor") ||
    text.includes("voice actress") ||
    text.includes("seiyuu") ||
    text.includes("seiyu") ||
    text.includes("va ") ||
    text.startsWith("va ") ||
    text.includes("voiced by") ||
    text.includes("voices") ||
    text.includes("voice ") ||
    text.includes("voice roles") ||
    text.includes("voice in") ||
    text.includes("voice for");

  return hasVoiceRolePhrase && hasPersonVoiceContext;
}

export function extractPersonOverviewName(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /do you know about (?:the\s+)?(?:voice actor|voice actress|seiyuu|seiyu|va)\s+(.+)/i,
    /tell me about (?:the\s+)?(?:voice actor|voice actress|seiyuu|seiyu|va)\s+(.+)/i,
    /who is (?:the\s+)?(?:voice actor|voice actress|seiyuu|seiyu|va)\s+(.+)/i,
    /(?:voice actor|voice actress|seiyuu|seiyu|va)\s+(.+)/i,
    /do you know about\s+(.+)/i,
    /who is\s+(.+)/i,
    /tell me about\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanPersonName(match[1]);
    }
  }

  return cleanPersonName(cleanMessage);
}

export function extractPersonVoiceRolesName(message) {
  const cleanMessage = message
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /what anime does\s+(.+?)\s+(?:voice in|voice for|voice|voices in|voices for|star in|act in)/i,
    /which anime does\s+(.+?)\s+(?:voice in|voice for|voice|voices in|voices for|star in|act in)/i,
    /what anime is\s+(.+?)\s+in/i,
    /which anime is\s+(.+?)\s+in/i,
    /anime voiced by\s+(.+)/i,
    /voiced by\s+(.+)/i,
    /voice roles? (?:of|for)\s+(.+)/i,
    /(?:voice actor|voice actress|seiyuu|seiyu|va)\s+roles? (?:of|for)?\s*(.+)/i
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern);

    if (match && match[1]) {
      return cleanPersonName(match[1]);
    }
  }

  return cleanPersonName(cleanMessage);
}

function cleanPersonName(name) {
  return name
    .replace(/\bvoice actor\b/gi, "")
    .replace(/\bvoice actress\b/gi, "")
    .replace(/\bseiyuu\b/gi, "")
    .replace(/\bseiyu\b/gi, "")
    .replace(/\bva\b/gi, "")
    .replace(/\banime\b/gi, "")
    .replace(/\broles?\b/gi, "")
    .replace(/\bvoiced by\b/gi, "")
    .replace(/\bvoice roles?\b/gi, "")
    .replace(/\bvoice in\b/gi, "")
    .replace(/\bvoice for\b/gi, "")
    .replace(/\bvoices in\b/gi, "")
    .replace(/\bvoices for\b/gi, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\bfor me\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAnimeRequest(message) {
  const mediaType = extractMediaType(message);
  const tag = extractAnimeTag(message);
  const seasonIntent = extractSeasonIntent(message);
  const mangaStatusIntent = extractMangaStatusIntent(message);
  const rankingIntent = extractRankingIntent(message);
  const wantsPersonVoiceRoles = isPersonVoiceRolesRequest(message);
  const wantsPersonOverview =
    !wantsPersonVoiceRoles && isPersonOverviewRequest(message);

  const wantsAnother = isAnotherRecommendationRequest(message);

  const wantsCharacterList =
    mediaType !== "manga" && isCharacterListRequest(message);

  const wantsExplicitCharacterOverview =
    mediaType !== "manga" && isExplicitCharacterOverviewRequest(message);

  const wantsExplicitAnimeOverview =
    mediaType !== "manga" && isExplicitAnimeOverviewRequest(message);

  const wantsExplicitMangaOverview =
    mediaType === "manga" && isExplicitMangaOverviewRequest(message);

  const wantsAnimeTrailer =
    mediaType !== "manga" && isAnimeTrailerRequest(message);

  const wantsAnimeEpisodes =
    mediaType !== "manga" && isAnimeEpisodesRequest(message);

  const wantsOverview = isOverviewRequest(message);

  let intent = "search";

  if (wantsPersonVoiceRoles) {
    intent = "person_voice_roles";
  } else if (wantsPersonOverview) {
    intent = "person_overview";
  } else if (wantsAnimeTrailer) {
    intent = "anime_trailer";
  } else if (wantsAnimeTrailer) {
    intent = "anime_trailer";
  } else if (wantsAnimeEpisodes) {
    intent = "anime_episodes";
  } else if (wantsCharacterList) {
    intent = "characters";
  } else if (wantsExplicitCharacterOverview) {
    intent = "character_overview";
  } else if (wantsExplicitMangaOverview) {
    intent = "manga_overview";
  } else if (wantsExplicitAnimeOverview) {
    intent = "anime_overview";
  } else if (mediaType === "manga" && wantsOverview) {
    intent = "manga_overview";
  } else if (mediaType !== "manga" && wantsOverview) {
    intent = "overview";
  } else if (mediaType === "manga" && seasonIntent?.type === "year") {
    intent = "year";
  } else if (mediaType === "manga" && (rankingIntent || tag || mangaStatusIntent)) {
    intent = "list";
  } else if (seasonIntent) {
    intent = seasonIntent.type === "year" ? "year" : "season";
  } else if (rankingIntent || tag) {
    intent = "list";
  } else if (isRecommendationRequest(message)) {
    intent = "recommendation";
  }

  const overviewTitle = wantsOverview ? extractOverviewTitle(message) : null;

  return {
    intent,
    mediaType,
    tag,
    seasonIntent,
    mangaStatusIntent,
    rankingIntent,

    wantsAnother,
    wantsOverview,
    wantsCharacterList,
    wantsExplicitCharacterOverview,
    wantsExplicitAnimeOverview,
    wantsExplicitMangaOverview,

    overviewTitle,
    lookupTitle: overviewTitle,
    isAmbiguousOverview:
      mediaType !== "manga" && wantsOverview && !wantsExplicitAnimeOverview,

    animeOverviewTitle: wantsExplicitAnimeOverview
      ? extractExplicitAnimeOverviewTitle(message)
      : null,

    mangaOverviewTitle:
      wantsExplicitMangaOverview || mediaType === "manga"
        ? extractMangaOverviewTitle(message)
        : null,

    characterAnimeTitle: wantsCharacterList
      ? extractCharacterAnimeTitle(message)
      : null,

    characterName: wantsExplicitCharacterOverview
      ? extractCharacterName(message)
      : null,

    animeTitle:
      mediaType !== "manga" &&
        !tag &&
        !seasonIntent &&
        !rankingIntent &&
        !wantsOverview &&
        !wantsCharacterList &&
        !wantsExplicitCharacterOverview &&
        !wantsExplicitAnimeOverview
        ? extractAnimeTitle(message)
        : "",

    mangaTitle:
      mediaType === "manga" &&
        !tag &&
        !seasonIntent &&
        !rankingIntent &&
        !mangaStatusIntent &&
        !wantsExplicitMangaOverview &&
        !wantsOverview
        ? extractMangaTitle(message)
        : "",
    wantsAnimeTrailer,
    wantsAnimeEpisodes,

    animeTrailerTitle: wantsAnimeTrailer
      ? extractAnimeTrailerTitle(message)
      : null,

    animeEpisodesTitle: wantsAnimeEpisodes
      ? extractAnimeEpisodesTitle(message)
      : null,

    wantsPersonOverview,
    wantsPersonVoiceRoles,

    personName: wantsPersonOverview
      ? extractPersonOverviewName(message)
      : wantsPersonVoiceRoles
        ? extractPersonVoiceRolesName(message)
        : null,
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

function cleanMangaTitle(title) {
  return title
    .replace(/\bplease\b/gi, "")
    .replace(/\bfor me\b/gi, "")
    .replace(/\bmanga\b/gi, "")
    .replace(/\bmanhwa\b/gi, "")
    .replace(/\bmanhua\b/gi, "")
    .replace(/\bwebtoon\b/gi, "")
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

function cleanCharacterAnimeTitle(title) {
  return title
    .replace(/\banime\b/gi, "")
    .replace(/\bcharacters?\b/gi, "")
    .replace(/\bcast\b/gi, "")
    .replace(/\bmain\b/gi, "")
    .replace(/\bof\b/gi, "")
    .replace(/\bfrom\b/gi, "")
    .replace(/\bin\b/gi, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCharacterName(name) {
  return name
    .replace(/\bcharacter\b/gi, "")
    .replace(/\bthe\b/gi, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}