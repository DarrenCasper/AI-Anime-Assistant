const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getPersonAction(personId, action) {
  if (!personId) {
    throw new Error("personId is required");
  }

  if (!action) {
    throw new Error("action is required");
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/person-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personId,
      action
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load person action");
  }

  return data;
}