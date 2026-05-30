import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnimeCard({ anime }) {
  const imageSrc = anime.imageLarge || anime.image || anime.imageSmall;

  return (
    <Card className="group overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/9">
      <div className="relative aspect-2/3 overflow-hidden bg-black/40">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
            No image
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-white">
            {anime.title}
          </h3>

          {anime.titleEnglish && anime.titleEnglish !== anime.title && (
            <p className="mt-1 line-clamp-1 text-xs text-white/60">
              {anime.titleEnglish}
            </p>
          )}
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {anime.score && (
            <Badge variant="secondary" className="rounded-full">
              ⭐ {anime.score}
            </Badge>
          )}

          {anime.type && (
            <Badge variant="outline" className="rounded-full border-white/15 text-white/80">
              {anime.type}
            </Badge>
          )}

          {anime.year && (
            <Badge variant="outline" className="rounded-full border-white/15 text-white/80">
              {anime.year}
            </Badge>
          )}

          {anime.episodes && (
            <Badge variant="outline" className="rounded-full border-white/15 text-white/80">
              {anime.episodes} eps
            </Badge>
          )}
        </div>

        {anime.genres?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="rounded-full">
            Save
          </Button>

          {anime.url && (
            <Button size="sm" variant="secondary" className="rounded-full" asChild>
              <a href={anime.url} target="_blank" rel="noreferrer">
                View
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}