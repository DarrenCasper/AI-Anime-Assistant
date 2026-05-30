import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnimeOverview({ anime }) {
  if (!anime) return null;

  const imageSrc = anime.imageLarge || anime.image || anime.imageSmall;

  return (
    <Card className="mt-4 w-full overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col md:flex-row">
        {/* LEFT SIDE: POSTER + EXTRA INFO */}
        <aside className="w-full shrink-0 border-b border-white/10 bg-black/30 p-4 md:w-70 md:border-b-0 md:border-r lg:w-[320px]">
          <div className="overflow-hidden rounded-2xl bg-black/40">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={anime.title}
                className="h-105 w-full object-contain p-3"
              />
            ) : (
              <div className="flex h-105 items-center justify-center text-white/40">
                No image available
              </div>
            )}
          </div>

          {/* This fills the blank space under the image */}
          <div className="mt-4 space-y-3">
            <SideInfo label="Season" value={formatSeason(anime.season, anime.year)} />
            <SideInfo label="Aired" value={anime.aired?.string || "Unknown"} />
            <SideInfo label="Broadcast" value={anime.broadcast?.string || "Unknown"} />
            <SideInfo label="Source" value={anime.source || "Unknown"} />
            <SideInfo label="Duration" value={anime.duration || "Unknown"} />

            {anime.studios?.length > 0 && (
              <SideInfo label="Studios" value={anime.studios.join(", ")} />
            )}

            {anime.producers?.length > 0 && (
              <SideInfo
                label="Producers"
                value={anime.producers.slice(0, 4).join(", ")}
              />
            )}

            {anime.licensors?.length > 0 && (
              <SideInfo
                label="Licensors"
                value={anime.licensors.slice(0, 3).join(", ")}
              />
            )}
          </div>
        </aside>

        {/* RIGHT SIDE: MAIN OVERVIEW */}
        <CardContent className="min-w-0 flex-1 space-y-5 p-6 lg:p-8">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {anime.type && (
                <Badge variant="secondary" className="rounded-full">
                  {anime.type}
                </Badge>
              )}

              {anime.status && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 text-white/80"
                >
                  {anime.status}
                </Badge>
              )}

              {anime.rating && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 text-white/80"
                >
                  {anime.rating}
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                {anime.title}
              </h2>

              {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                <p className="mt-1 text-sm text-white/55">
                  {anime.titleEnglish}
                </p>
              )}

              {anime.titleJapanese && (
                <p className="mt-1 text-sm text-white/40">
                  {anime.titleJapanese}
                </p>
              )}

              {anime.titleSynonyms?.length > 0 && (
                <p className="mt-2 text-xs text-white/35">
                  Also known as: {anime.titleSynonyms.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Score" value={anime.score || "N/A"} />
            <InfoBox label="Rank" value={anime.rank ? `#${anime.rank}` : "N/A"} />
            <InfoBox
              label="Popularity"
              value={anime.popularity ? `#${anime.popularity}` : "N/A"}
            />
            <InfoBox label="Episodes" value={anime.episodes || "?"} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox
              label="Members"
              value={formatNumber(anime.members) || "N/A"}
            />
            <InfoBox
              label="Favorites"
              value={formatNumber(anime.favorites) || "N/A"}
            />
            <InfoBox
              label="Scored By"
              value={formatNumber(anime.scoredBy) || "N/A"}
            />
            <InfoBox
              label="Year"
              value={anime.year && anime.year !== 0 ? anime.year : "Unknown"}
            />
          </div>

          {(anime.genres?.length > 0 ||
            anime.themes?.length > 0 ||
            anime.demographics?.length > 0) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">
                Genres, Themes & Demographics
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(anime.genres || []),
                  ...(anime.themes || []),
                  ...(anime.demographics || [])
                ]
                  .slice(0, 12)
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-400/10"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">Synopsis</p>

            <p className="whitespace-pre-line text-sm leading-7 text-white/70">
              {anime.synopsis || "No synopsis available."}
            </p>
          </div>

          {anime.background && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">Background</p>

              <p className="text-sm leading-7 text-white/55">
                {anime.background}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="rounded-full">Save to Watchlist</Button>

            {anime.url && (
              <Button variant="secondary" className="rounded-full" asChild>
                <a href={anime.url} target="_blank" rel="noreferrer">
                  View on MAL
                </a>
              </Button>
            )}

            {anime.trailerUrl && (
              <Button
                variant="outline"
                className="rounded-full border-white/15"
                asChild
              >
                <a href={anime.trailerUrl} target="_blank" rel="noreferrer">
                  Watch Trailer
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SideInfo({ label, value }) {
  if (!value || value === "Unknown") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
        <p className="text-xs text-white/35">{label}</p>
        <p className="mt-1 text-sm text-white/45">Unknown</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-white/75">
        {value}
      </p>
    </div>
  );
}

function formatSeason(season, year) {
  if (!season && (!year || year === 0)) return "Unknown";

  const cleanSeason = season
    ? season.charAt(0).toUpperCase() + season.slice(1)
    : "";

  const cleanYear = year && year !== 0 ? year : "";

  return `${cleanSeason} ${cleanYear}`.trim();
}

function formatNumber(value) {
  if (!value && value !== 0) return null;

  return new Intl.NumberFormat("en-US").format(value);
}