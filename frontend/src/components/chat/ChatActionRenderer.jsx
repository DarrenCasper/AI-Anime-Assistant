import AnimeCardGrid from "../anime/AnimeCardGrid";
import AnimeOverview from "../anime/AnimeOverview";
import MangaCardGrid from "../Manga/MangaCardGrid";
import MangaOverview from "../manga/MangaOverview";
import CharacterCardGrid from "../character/CharacterCardGrid";
import CharacterOverview from "../character/CharacterOverview";

export default function ChatActionRenderer({ ui, onCharacterSelect }) {
  if (!ui || ui.type === "none") return null;

  if (ui.type === "anime_cards") {
    return <AnimeCardGrid items={ui.data?.items || []} />;
  }

  if (ui.type === "anime_overview") {
    return <AnimeOverview anime={ui.data?.anime} />;
  }

  if (ui.type === "manga_cards") {
    return <MangaCardGrid items={ui.data?.items || []} />;
  }

  if (ui.type === "manga_overview") {
    return <MangaOverview manga={ui.data?.manga} />;
  }

  if (ui.type === "character_cards") {
    return (
      <CharacterCardGrid
        items={ui.data?.items || []}
        anime={ui.data?.anime || null}
        isDisambiguation={ui.data?.isDisambiguation || false}
        onCharacterSelect={onCharacterSelect}
      />
    );
  }

  if (ui.type === "character_overview") {
    return <CharacterOverview character={ui.data?.character} />;
  }

  return null;
}
