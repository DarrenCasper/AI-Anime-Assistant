const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getCharacterOverview(characterId) {
  if (!characterId) {
    throw new Error("characterId is required");
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/character-overview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      characterId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch character overview");
  }

  return data;
}