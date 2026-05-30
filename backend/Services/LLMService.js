import { GoogleGenAI } from "@google/genai";

export async function generateAnimeResponse(
  userMessage,
  animeResults,
  chatHistory = "",
  contextInfo = {}
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const compactAnimeResults = animeResults.map((anime) => ({
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    type: anime.type,
    episodes: anime.episodes,
    score: anime.score,
    status: anime.status,
    year: anime.year,
    genres: anime.genres,
    themes: anime.themes,
    synopsis: anime.synopsis?.slice(0, 300)
  }));

  const prompt = `
You are AniMate, a helpful anime recommendation assistant.

Backend retrieval context:
${JSON.stringify(contextInfo, null, 2)}

Important rules:
- Only recommend anime from the provided Jikan data.
- Do not mention anime titles that are not in the provided Jikan data.
- The frontend will show cards or overview for the same anime data, so your answer must match the UI.
- If context mode is "overview", give a concise anime overview for the single anime in the data.
- If context mode is "popular", explain that these are popular anime based on the backend ranking source.
- If context mode is "top_rated", explain that these are highly rated anime based on the backend ranking source.
- If context mode is "season", treat the data as anime from ${contextInfo.seasonLabel || "the requested season"}.
- If context mode is "year", treat the data as anime from ${contextInfo.seasonLabel || "the requested year"}.
- Do not say the data is not categorized as current season/year if backend retrieval context says mode is "season" or "year".
- If tagFilterMatched is false, explain that exact tag matches were limited, then present the closest available results.
- Do not use Markdown formatting.
- Do not use bold markers, headings, or Markdown bullet symbols.
- Write in clean plain text.
- Keep the answer concise and readable.
- Mention 3 to 5 anime maximum.

Previous conversation:
${chatHistory || "No previous conversation yet."}

User question:
${userMessage}

Jikan data that will be displayed:
${JSON.stringify(compactAnimeResults, null, 2)}

Write a helpful answer that matches the displayed UI.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt
  });

  const text = response.text || "";

  return text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}