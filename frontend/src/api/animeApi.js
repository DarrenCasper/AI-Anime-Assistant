const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getAnimeAction(animeId, action) {
  if (!animeId) {
    throw new Error("animeId is required");
  }

  if (!action) {
    throw new Error("action is required");
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/anime-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      animeId,
      action
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load anime action");
  }

  return data;
}