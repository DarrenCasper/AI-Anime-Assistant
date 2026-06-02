import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnimeTrailer({ anime }) {
  if (!anime) return null;

  const embedUrl = anime.trailerEmbedUrl;
  const trailerUrl = anime.trailerUrl;
  const trailerImage = anime.trailerImage || anime.imageLarge || anime.image;

  function openTrailer() {
    if (trailerUrl) {
      window.open(trailerUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Card className="mt-4 overflow-hidden border-white/10 bg-slate-950/80 text-white shadow-xl">
      <CardContent className="p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {anime.type && <Badge variant="secondary">{anime.type}</Badge>}
              {anime.status && <Badge variant="outline" className="text-white/80">{anime.status}</Badge>}
              {anime.score && <Badge>Score {anime.score}</Badge>}
            </div>

            <h3 className="text-xl font-bold leading-tight">
              {anime.title} Trailer
            </h3>

            {anime.titleEnglish && anime.titleEnglish !== anime.title && (
              <p className="mt-1 text-sm text-slate-400">
                {anime.titleEnglish}
              </p>
            )}
          </div>

          {trailerUrl && (
            <Button onClick={openTrailer} className="shrink-0">
              Open on YouTube
            </Button>
          )}
        </div>

        {embedUrl ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={embedUrl}
                title={`${anime.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : trailerImage ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <img
              src={trailerImage}
              alt={`${anime.title} trailer preview`}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
            No trailer is available for this anime.
          </div>
        )}

        {anime.synopsis && (
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-300">
            {anime.synopsis}
          </p>
        )}
      </CardContent>
    </Card>
  );
}