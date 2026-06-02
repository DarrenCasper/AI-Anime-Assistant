import AnimeCardGrid from "../anime/AnimeCardGrid";
import AnimeOverview from "../anime/AnimeOverview";
import AnimeTrailer from "../anime/AnimeTrailer";
import AnimeEpisodes from "../anime/AnimeEpisodes";
import MangaCardGrid from "../manga/MangaCardGrid";
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

  if (ui.type === "anime_trailer") {
    return <AnimeTrailer anime={ui.data?.anime} />;
  }

  if (ui.type === "anime_episodes") {
    return (
      <AnimeEpisodes
        anime={ui.data?.anime}
        episodes={ui.data?.episodes || []}
      />
    );
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
        anime={ui.data?.anime}
        isDisambiguation={ui.data?.isDisambiguation}
        onCharacterSelect={onCharacterSelect}
      />
    );
  }

  if (ui.type === "character_overview") {
    return <CharacterOverview character={ui.data?.character} />;
  }

  return null;
}