import CharacterCard from "./CharacterCard";

export default function CharacterCardGrid({
  items = [],
  anime = null,
  isDisambiguation = false,
  onCharacterSelect
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4 space-y-4">
      {isDisambiguation && (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-white">
          <p className="text-sm font-medium">Pick the character you mean</p>
          <p className="mt-1 text-xs text-white/55">
            I found multiple possible matches, sorted by popularity.
          </p>
        </div>
      )}

      {anime && (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-white">
          <p className="text-xs text-white/50">Characters from</p>
          <h3 className="text-base font-semibold">{anime.title}</h3>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {items.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={onCharacterSelect}
          />
        ))}
      </div>
    </div>
  );
}