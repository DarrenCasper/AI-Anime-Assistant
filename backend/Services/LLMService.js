import { GoogleGenAI } from "@google/genai";

export async function generateAnimeResponse(userMessage, animeResults, chatHistory = "") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `
You are AniMate, a friendly anime recommendation assistant.

Previous conversation:
${chatHistory || "No previous conversation yet."}

User question:
${userMessage}

Jikan anime data:
${JSON.stringify(animeResults, null, 2)}

Write the final answer.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text;
}