import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CharacterOverview({ character }) {
  if (!character) return null;

  const imageSrc = character.image;
  const mainVoiceActor = character.voiceActors?.[0];

  return (
    <Card className="mt-4 w-full overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col md:flex-row">
        {/* LEFT SIDE: CHARACTER IMAGE + EXTRA INFO */}
        <aside className="w-full shrink-0 border-b border-white/10 bg-black/30 p-4 md:w-70 md:border-b-0 md:border-r lg:w-[320px]">
          <div className="overflow-hidden rounded-2xl bg-black/40">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={character.name}
                className="h-105 w-full object-contain p-3"
              />
            ) : (
              <div className="flex h-105 items-center justify-center text-white/40">
                No image available
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <SideInfo label="Favorites" value={formatNumber(character.favorites) || "Unknown"} />

            {character.nameKanji && (
              <SideInfo label="Kanji Name" value={character.nameKanji} />
            )}

            {character.nicknames?.length > 0 && (
              <SideInfo
                label="Nicknames"
                value={character.nicknames.slice(0, 5).join(", ")}
              />
            )}

            {mainVoiceActor && (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <p className="text-xs text-white/35">Main Voice Actor</p>

                <div className="mt-3 flex items-center gap-3">
                  {mainVoiceActor.image && (
                    <img
                      src={mainVoiceActor.image}
                      alt={mainVoiceActor.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/80">
                      {mainVoiceActor.name}
                    </p>
                    <p className="text-xs text-white/45">
                      {mainVoiceActor.language}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {character.url && (
              <Button variant="secondary" className="w-full rounded-full" asChild>
                <a href={character.url} target="_blank" rel="noreferrer">
                  View on MAL
                </a>
              </Button>
            )}
          </div>
        </aside>

        {/* RIGHT SIDE: CHARACTER OVERVIEW */}
        <CardContent className="min-w-0 flex-1 space-y-5 p-6 lg:p-8">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">
                Character
              </Badge>

              {character.favorites !== undefined && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 text-white/80"
                >
                  ❤ {formatNumber(character.favorites)}
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                {character.name}
              </h2>

              {character.nameKanji && (
                <p className="mt-1 text-sm text-white/45">
                  {character.nameKanji}
                </p>
              )}

              {character.nicknames?.length > 0 && (
                <p className="mt-2 text-xs text-white/35">
                  Also known as: {character.nicknames.slice(0, 4).join(", ")}
                </p>
              )}
            </div>
          </div>

          {character.anime?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">
                Anime Appearances
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {character.anime.slice(0, 6).map((anime) => (
                  <AppearanceCard
                    key={`${anime.id}-${anime.role}`}
                    item={anime}
                    type="Anime"
                  />
                ))}
              </div>
            </div>
          )}

          {character.manga?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">
                Manga Appearances
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {character.manga.slice(0, 4).map((manga) => (
                  <AppearanceCard
                    key={`${manga.id}-${manga.role}`}
                    item={manga}
                    type="Manga"
                  />
                ))}
              </div>
            </div>
          )}

          {character.voiceActors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">
                Voice Actors
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {character.voiceActors.slice(0, 6).map((voiceActor) => (
                  <VoiceActorCard key={`${voiceActor.id}-${voiceActor.language}`} voiceActor={voiceActor} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">About</p>

            <p className="whitespace-pre-line text-sm leading-7 text-white/70">
              {cleanAboutText(character.about) || "No character description available."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="rounded-full">
              Save Character
            </Button>

            {character.url && (
              <Button variant="secondary" className="rounded-full" asChild>
                <a href={character.url} target="_blank" rel="noreferrer">
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

function AppearanceCard({ item, type }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-violet-400/30 hover:bg-white/6"
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="h-16 w-12 shrink-0 rounded-lg object-cover"
        />
      )}

      <div className="min-w-0">
        <p className="text-xs text-white/35">{type}</p>
        <p className="line-clamp-2 text-sm font-medium text-white/80">
          {item.title}
        </p>
        {item.role && (
          <p className="mt-1 text-xs text-violet-200/70">
            {item.role}
          </p>
        )}
      </div>
    </a>
  );
}

function VoiceActorCard({ voiceActor }) {
  return (
    <a
      href={voiceActor.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-violet-400/30 hover:bg-white/6"
    >
      {voiceActor.image && (
        <img
          src={voiceActor.image}
          alt={voiceActor.name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white/80">
          {voiceActor.name}
        </p>
        <p className="text-xs text-white/45">
          {voiceActor.language}
        </p>
      </div>
    </a>
  );
}

function SideInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-white/75">
        {value || "Unknown"}
      </p>
    </div>
  );
}

function formatNumber(value) {
  if (!value && value !== 0) return null;

  return new Intl.NumberFormat("en-US").format(value);
}

function cleanAboutText(text) {
  if (!text) return "";

  return text
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}