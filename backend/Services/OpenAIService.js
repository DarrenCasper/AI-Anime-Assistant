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
  contextInfo.mode === "characters"
    ? animeResults.map((character) => ({
        name: character.name,
        role: character.role,
        favorites: character.favorites,
        voiceActors:
          character.voiceActors?.slice(0, 2).map((va) => ({
            name: va.name,
            language: va.language
          })) || []
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
        synopsis: anime.synopsis?.slice(0, 450)
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

    - If context mode is "overview":
      Give a short overview of the single anime.
      Explain the premise, vibe, strengths, and who might enjoy it.
      Do not make a numbered list unless the user asks.

    - If context mode is "recommendation", "tag", "popular", "top_rated", "season", "year", or "list":
      Start with one natural sentence that matches the user's request.
      Then write a numbered list.
      Format each item exactly like this:
      1. Anime Title: short explanation using the synopsis, vibe, genre, score, or why it fits.
      Use 3 to 5 items maximum.
      End with one short closing sentence.

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
      `OpenAI response incomplete: ${
        response.incomplete_details?.reason || "unknown reason"
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