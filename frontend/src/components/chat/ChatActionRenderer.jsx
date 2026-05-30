import AnimeCardGrid from "../anime/AnimeCardGrid";
import AnimeOverview from "../anime/AnimeOverview";

export default function ChatActionRenderer({ ui }) {
  if (!ui || ui.type === "none") return null;

  if (ui.type === "anime_cards") {
    return <AnimeCardGrid items={ui.data?.items || []} />;
  }

  if (ui.type === "anime_overview") {
    return <AnimeOverview anime={ui.data?.anime} />;
  }

  return null;
}