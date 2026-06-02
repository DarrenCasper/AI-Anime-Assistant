import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnimeEpisodes({ anime, episodes = [] }) {
  if (!anime && episodes.length === 0) return null;

  return (
    <Card className="mt-4 border-white/10 bg-slate-950/80 text-white shadow-xl">
      <CardContent className="p-4 md:p-5">
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Episodes</Badge>
            {anime?.episodes && (
              <Badge variant="outline" className="text-white/80">Total: {anime.episodes}</Badge>
            )}
          </div>

          <h3 className="text-xl font-bold leading-tight">
            {anime?.title ? `${anime.title} Episodes` : "Anime Episodes"}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Episode information from MyAnimeList via Jikan.
          </p>
        </div>

        {episodes.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
            No episode data is available for this anime.
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <EpisodeItem
                key={episode.id || episode.number || episode.title}
                episode={episode}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EpisodeItem({ episode }) {
  const airedText = formatDate(episode.aired);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              Episode {episode.number || episode.id || "?"}
            </Badge>

            {episode.score && (
              <Badge variant="outline" className="text-white/80">Score {episode.score}</Badge>
            )}

            {episode.filler && (
              <Badge className="bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/20">
                Filler
              </Badge>
            )}

            {episode.recap && (
              <Badge className="bg-blue-500/20 text-blue-200 hover:bg-blue-500/20">
                Recap
              </Badge>
            )}
          </div>

          <h4 className="font-semibold text-white">
            {episode.title || "Untitled Episode"}
          </h4>

          {episode.titleJapanese && (
            <p className="mt-1 text-sm text-slate-400">
              {episode.titleJapanese}
            </p>
          )}

          {airedText && (
            <p className="mt-2 text-xs text-slate-500">Aired: {airedText}</p>
          )}
        </div>

        {episode.url && (
          <Button
            variant="outline"
            size="sm"
            className="text-black/80 hover:text-indigo-300"
            onClick={() =>
              window.open(episode.url, "_blank", "noopener,noreferrer")
            }
          >
            Open MAL
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}