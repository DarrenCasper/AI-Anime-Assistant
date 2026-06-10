import OpenAI from "openai";

function extractOpenAIText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    const parts = [];

    for (const item of response.output) {
      if (Array.isArray(item.content)) {
        for (const content of item.content) {
          if (typeof content.text === "string") {
            parts.push(content.text);
          }
        }
      }
    }

    return parts.join("\n").trim();
  }

  return "";
}

function sanitizeAIText(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

export async function generateOpenAIAnimeResponse(
  userMessage,
  animeResults,
  chatHistory = "",
  contextInfo = {}
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const compactResults =
    contextInfo.mode === "characters" || contextInfo.mode === "character_overview"
      ? animeResults.map((character) => ({
        name: character.name,
        role: character.role,
        favorites: character.favorites,
        about: character.about?.slice(0, 450),
        voiceActors:
          character.voiceActors?.slice(0, 2).map((va) => ({
            name: va.name,
            language: va.language
          })) || [],
        anime:
          character.anime?.slice(0, 3).map((item) => ({
            title: item.title,
            role: item.role
          })) || [],
        manga:
          character.manga?.slice(0, 3).map((item) => ({
            title: item.title,
            role: item.role
          })) || []
      }))
      : contextInfo.mode === "person_options"
        ? animeResults.map((person) => ({
          name: person.name,
          givenName: person.givenName,
          familyName: person.familyName,
          alternateNames: person.alternateNames,
          favorites: person.favorites,
          about: person.about?.slice(0, 250)
        }))
        : contextInfo.mode === "person_overview"
          ? animeResults.map((person) => ({
            name: person.name,
            givenName: person.givenName,
            familyName: person.familyName,
            alternateNames: person.alternateNames,
            birthday: person.birthday,
            favorites: person.favorites,
            about: person.about?.slice(0, 700),
            voices:
              person.voices?.slice(0, 8).map((role) => ({
                anime: role.anime?.title,
                character: role.character?.name,
                role: role.role
              })) || [],
            anime:
              person.anime?.slice(0, 5).map((item) => ({
                title: item.title,
                position: item.position
              })) || [],
            manga:
              person.manga?.slice(0, 3).map((item) => ({
                title: item.title,
                position: item.position
              })) || []
          }))
          : contextInfo.mode === "person_voice_roles"
            ? animeResults.map((role) => ({
              anime: role.anime?.title,
              character: role.character?.name,
              role: role.role
            }))
            : contextInfo.mode === "anime_episodes"
              ? animeResults.map((episode) => ({
                number: episode.number,
                title: episode.title,
                titleJapanese: episode.titleJapanese,
                titleRomanji: episode.titleRomanji,
                aired: episode.aired,
                score: episode.score,
                filler: episode.filler,
                recap: episode.recap
              }))
              : contextInfo.mode === "anime_options"
                ? animeResults.map((anime) => ({
                  title: anime.title,
                  titleEnglish: anime.titleEnglish,
                  titleJapanese: anime.titleJapanese,
                  titleSynonyms: anime.titleSynonyms,
                  type: anime.type,
                  episodes: anime.episodes,
                  score: anime.score,
                  status: anime.status,
                  year: anime.year,
                  season: anime.season,
                  popularity: anime.popularity,
                  rank: anime.rank,
                  genres: anime.genres,
                  themes: anime.themes,
                  synopsis: anime.synopsis?.slice(0, 250)
                }))
                : contextInfo.mediaType === "manga"
                  ? animeResults.map((manga) => ({
                    title: manga.title,
                    titleEnglish: manga.titleEnglish,
                    titleJapanese: manga.titleJapanese,
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
                    serializations: manga.serializations,
                    synopsis: manga.synopsis?.slice(0, 450)
                  }))
                  : animeResults.map((anime) => ({
                    title: anime.title,
                    titleEnglish: anime.titleEnglish,
                    type: anime.type,
                    episodes: anime.episodes,
                    score: anime.score,
                    status: anime.status,
                    year: anime.year,
                    season: anime.season,
                    popularity: anime.popularity,
                    rank: anime.rank,
                    genres: anime.genres,
                    themes: anime.themes,
                    synopsis: anime.synopsis?.slice(0, 450),
                    trailerUrl: anime.trailerUrl ? "available" : null,
                    trailerEmbedUrl: anime.trailerEmbedUrl ? "available" : null
                  }));

  const prompt = `
    You are AniMate, a friendly anime assistant.

    You have access to selected results from the app's backend. Use those results as your factual source, but do not mention "Jikan", "API", "backend", "provided data", or "database" in the final answer.

    Backend retrieval context:
    ${JSON.stringify(contextInfo, null, 2)}

    User question:
    ${userMessage}

    Previous conversation:
    ${chatHistory || "No previous conversation yet."}

    Results available to discuss:
    ${JSON.stringify(compactResults, null, 2)}

    Response rules:
    - Only mention items from the results above.
    - Do not invent extra anime titles or character names.
    - Do not mention Jikan, API, backend, provided data, retrieved data, or database.
    - Do not use Markdown bold markers.
    - Do not use headings.
    - Write naturally, like a helpful anime guide.
    - Keep the response concise but useful.

    Formatting rules by mode:
    - If context mode is "characters":
      Start with one natural sentence introducing the cast.
      Then write a numbered list.
      Format each item exactly like this:
      1. Character Name: role and short explanation.
      Use 5 to 8 characters maximum.
      Do not describe them as anime recommendations.

    - If context mode is "character_overview":
      Give a short character overview.
      Explain who the character is, their role, personality/vibe, and notable appearances if available.
      Do not make a numbered list unless the user asks.

    - If context mode is "overview":
      Give a short overview of the single anime.
      Explain the premise, vibe, strengths, and who might enjoy it.
      Do not make a numbered list unless the user asks.

    - If context mode is "manga_overview":
      Give a short overview of the single manga, manhwa, manhua, or webtoon.
      Explain the premise, vibe, strengths, genre appeal, author/serialization info if available, and who might enjoy it.
      Mention chapters, volumes, score, or status only if available and useful.
      Do not make a numbered list unless the user asks.

    - If context mode is "anime_trailer":
      Write a short paragraph about the anime's trailer or trailer availability.
      Do not mention the trailer URL, embed URL, API, backend, or that you have access to trailer data.
      If a trailer is available, explain what the viewer can expect from the anime based on the title, synopsis, genre, and vibe.
      If trailer data is not available, say naturally that an official trailer does not seem to be available here.
      Do not make a numbered list.

    - If context mode is "anime_episodes":
      Start with one natural sentence introducing the episode list.
      Then write a numbered list.
      Format each item exactly like this:
      1. Episode 1 - Episode Title: short note using aired date, score, filler/recap status, or basic episode info.
      Use 5 to 8 episodes maximum.
      Do not claim the user can watch full episodes here.
      Do not describe episodes as recommendations.

    - If context mode is "recommendation", "tag", "popular", "top_rated", "season", "year", "list", "anime_list", or "manga_list":
      Start with one natural sentence that matches the user's request.
      Then write a numbered list.
      If mediaType is "manga", format each item exactly like this:
      1. Manga Title: short explanation using the synopsis, vibe, genre, score, status, author, or why it fits.
      If mediaType is not "manga", format each item exactly like this:
      1. Anime Title: short explanation using the synopsis, vibe, genre, score, or why it fits.
      Use 3 to 5 items maximum.
      End with one short closing sentence.

    - If context mode is "anime_options":
      The user asked for an anime title that may refer to multiple entries.
      Do not give an overview, recommendation, trailer explanation, or episode list yet.
      Tell the user that multiple matching anime entries were found and ask them to choose the exact version.
      Mention that the cards below contain the selectable options.
      Keep the response to 1 short sentence.
      
      - If context mode is "person_options":
      The user asked for a voice actor, voice actress, or seiyuu name that may match multiple people.
      Do not give a biography yet.
      Tell the user that multiple matching people were found and ask them to choose from the cards below.
      Keep the response to 1 short sentence.

    - If context mode is "person_overview":
      Give a short overview of the voice actor, voice actress, or seiyuu.
      Mention their name, basic bio details if available, and a few notable anime voice roles if available.
      Do not make a long biography.
      Do not invent roles.

    - If context mode is "person_voice_roles":
      Start with one natural sentence introducing the voice roles.
      Then write a numbered list.
      Format each item exactly like this:
      1. Anime Title: voices Character Name as role type if available.
      Use 5 to 10 items maximum.
      Do not invent anime titles or characters.

    Final answer:
    `;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-nano",
    input: prompt,
    reasoning: {
      effort: "low"
    },
    text: {
      verbosity: "medium"
    },
    max_output_tokens: 1500
  });

  console.log("OpenAI response status:", response.status);
  console.log("OpenAI incomplete details:", response.incomplete_details || null);
  console.log("OpenAI usage:", response.usage || null);

  if (response.status === "incomplete") {
    throw new Error(
      `OpenAI response incomplete: ${response.incomplete_details?.reason || "unknown reason"
      }`
    );
  }

  const text = sanitizeAIText(extractOpenAIText(response));

  if (!text) {
    console.log("OpenAI raw response:", JSON.stringify(response, null, 2));
    throw new Error("OpenAI returned empty text");
  }

  return text;
}