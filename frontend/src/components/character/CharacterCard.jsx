import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CharacterCard({ character, onSelect }) {
  const imageSrc = character.image;
  const mainVoiceActor = character.voiceActors?.[0];

  return (
    <Card className="group overflow-hidden rounded-2xl border-white/10 bg-white/6 text-white shadow-lg shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/9">
      <div className="relative aspect-3/4 overflow-hidden bg-black/40">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={character.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
            No image
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">
            {character.name}
          </h3>

          {character.role && (
            <p className="mt-1 text-xs text-white/60">{character.role}</p>
          )}
        </div>
      </div>

      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          {character.role && (
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {character.role}
            </Badge>
          )}

          {character.favorites !== undefined && (
            <Badge
              variant="outline"
              className="rounded-full border-white/15 text-[11px] text-white/80"
            >
              ❤ {character.favorites}
            </Badge>
          )}
        </div>

        {mainVoiceActor && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] text-white/40">Voice Actor</p>

            <p className="mt-1 truncate text-xs font-medium text-white/85">
              {mainVoiceActor.name}
            </p>

            <p className="text-[11px] text-white/45">
              {mainVoiceActor.language}
            </p>
          </div>
        )}

        <Button
          size="sm"
          variant="secondary"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => onSelect?.(character)}
        >
          View Overview
        </Button>
      </CardContent>
    </Card>
  );
}