import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getActionLabel(action) {
  if (action === "trailer") return "Show Trailer";
  if (action === "episodes") return "Show Episodes";
  return "Show Overview";
}

function getActionDescription(action) {
  if (action === "trailer") {
    return "I found multiple anime entries that match your trailer request. Choose the exact version you mean.";
  }

  if (action === "episodes") {
    return "I found multiple anime entries that match your episode request. Choose the exact version you mean.";
  }

  return "I found multiple anime entries that match your request. Choose the exact version you mean.";
}

export default function AnimeOptionGrid({
  items = [],
  targetAction = "overview",
  onAnimeSelect
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.07] px-5 py-4 text-sm text-white/80 shadow-xl shadow-black/20 backdrop-blur">
        {getActionDescription(targetAction)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((anime) => (
          <AnimeOptionCard
            key={anime.id}
            anime={anime}
            targetAction={targetAction}
            onAnimeSelect={onAnimeSelect}
          />
        ))}
      </div>
    </div>
  );
}

function AnimeOptionCard({ anime, targetAction, onAnimeSelect }) {
  const imageSrc = anime.imageLarge || anime.image || anime.imageSmall;

  return (
    <Card className="group overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/9">
      <CardContent className="flex h-full gap-4 p-4">
        <div className="h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/40">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={anime.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
              No image
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap gap-2">
            {anime.type && (
              <Badge
                variant="secondary"
                className="rounded-full bg-white text-slate-950 hover:bg-white"
              >
                {anime.type}
              </Badge>
            )}

            {anime.year && (
              <Badge
                variant="outline"
                className="rounded-full border-white/15 text-white/80"
              >
                {anime.year}
              </Badge>
            )}

            {anime.score && (
              <Badge
                variant="secondary"
                className="rounded-full bg-violet-500/20 text-violet-100 hover:bg-violet-500/20"
              >
                Score {anime.score}
              </Badge>
            )}
          </div>

          <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-tight text-white">
            {anime.title}
          </h3>

          {anime.titleEnglish && anime.titleEnglish !== anime.title && (
            <p className="mt-1 line-clamp-1 text-xs text-white/60">
              {anime.titleEnglish}
            </p>
          )}

          {anime.genres?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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

          <div className="mt-auto pt-6">
            <Button
              type="button"
              size="sm"
              className="w-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/30 hover:from-violet-500 hover:to-fuchsia-500"
              onClick={() => onAnimeSelect?.(anime, targetAction)}
            >
              {getActionLabel(targetAction)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}