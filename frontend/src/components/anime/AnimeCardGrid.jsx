import AnimeCard from "./AnimeCard";

export default function AnimeCardGrid({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
}