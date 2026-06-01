import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MangaOverview({ manga }) {
  if (!manga) return null;

  const imageSrc = manga.imageLarge || manga.image || manga.imageSmall;
  const combinedTags = [
    ...(manga.genres || []),
    ...(manga.themes || []),
    ...(manga.demographics || [])
  ];

  return (
    <Card className="mt-4 w-full overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-white/10 bg-black/30 p-4 md:w-70 md:border-b-0 md:border-r lg:w-[320px]">
          <div className="overflow-hidden rounded-2xl bg-black/40">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={manga.title}
                className="h-105 w-full object-contain p-3"
              />
            ) : (
              <div className="flex h-105 items-center justify-center text-white/40">
                No image available
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <SideInfo label="Published" value={manga.published?.string || "Unknown"} />
            <SideInfo label="Publishing" value={formatBoolean(manga.publishing)} />
            <SideInfo label="Authors" value={formatList(manga.authors)} />
            <SideInfo label="Serializations" value={formatList(manga.serializations)} />
            <SideInfo label="Chapters" value={manga.chapters || "Unknown"} />
            <SideInfo label="Volumes" value={manga.volumes || "Unknown"} />
          </div>
        </aside>

        <CardContent className="min-w-0 flex-1 space-y-5 p-6 lg:p-8">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {manga.type && (
                <Badge variant="secondary" className="rounded-full">
                  {manga.type}
                </Badge>
              )}

              {manga.status && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 text-white/80"
                >
                  {manga.status}
                </Badge>
              )}

              {manga.publishing !== undefined && manga.publishing !== null && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 text-white/80"
                >
                  {manga.publishing ? "Publishing" : "Not Publishing"}
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                {manga.title}
              </h2>

              {manga.titleEnglish && manga.titleEnglish !== manga.title && (
                <p className="mt-1 text-sm text-white/55">
                  {manga.titleEnglish}
                </p>
              )}

              {manga.titleJapanese && (
                <p className="mt-1 text-sm text-white/40">
                  {manga.titleJapanese}
                </p>
              )}

              {manga.titleSynonyms?.length > 0 && (
                <p className="mt-2 text-xs text-white/35">
                  Also known as: {manga.titleSynonyms.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Score" value={manga.score || "N/A"} />
            <InfoBox label="Rank" value={manga.rank ? `#${manga.rank}` : "N/A"} />
            <InfoBox
              label="Popularity"
              value={manga.popularity ? `#${manga.popularity}` : "N/A"}
            />
            <InfoBox label="Type" value={manga.type || "Unknown"} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Members" value={formatNumber(manga.members) || "N/A"} />
            <InfoBox label="Favorites" value={formatNumber(manga.favorites) || "N/A"} />
            <InfoBox label="Scored By" value={formatNumber(manga.scoredBy) || "N/A"} />
            <InfoBox label="Status" value={manga.status || "Unknown"} />
          </div>

          {combinedTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">
                Genres, Themes & Demographics
              </p>

              <div className="flex flex-wrap gap-2">
                {combinedTags.slice(0, 12).map((item) => (
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
              {manga.synopsis || "No synopsis available."}
            </p>
          </div>

          {manga.background && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">Background</p>
              <p className="whitespace-pre-line text-sm leading-7 text-white/55">
                {manga.background}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="rounded-full">Save to Library</Button>

            {manga.url && (
              <Button variant="secondary" className="rounded-full" asChild>
                <a href={manga.url} target="_blank" rel="noreferrer">
                  View on MAL
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

function formatBoolean(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

function formatList(value = [], limit = 4) {
  if (!Array.isArray(value) || value.length === 0) return "Unknown";
  return value.slice(0, limit).join(", ");
}

function formatNumber(value) {
  if (!value && value !== 0) return null;
  return new Intl.NumberFormat("en-US").format(value);
}
