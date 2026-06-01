import MangaCard from "./MangaCard";

export default function MangaCardGrid({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  );
}
