import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PersonVoiceRoles({ person, roles = [] }) {
  if (!person && roles.length === 0) return null;

  return (
    <Card className="mt-4 rounded-3xl border-white/10 bg-white/6 text-white shadow-xl shadow-black/20 backdrop-blur">
      <CardContent className="p-5">
        <div className="mb-5">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">
              Voice Roles
            </Badge>

            {roles.length > 0 && (
              <Badge
                variant="outline"
                className="rounded-full border-white/15 text-white/80"
              >
                {roles.length} roles shown
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-bold text-white">
            {person?.name ? `${person.name}'s Anime Voice Roles` : "Anime Voice Roles"}
          </h3>

          <p className="mt-1 text-sm text-white/50">
            Anime roles from MyAnimeList voice acting data.
          </p>
        </div>

        {roles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No voice role data is available for this person.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <VoiceRoleCard
                key={`${role.anime?.id}-${role.character?.id}`}
                role={role}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceRoleCard({ role }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">
        {role.character?.image ? (
          <img
            src={role.character.image}
            alt={role.character.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : role.anime?.image ? (
          <img
            src={role.anime.image}
            alt={role.anime.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap gap-2">
          {role.role && (
            <Badge
              variant="outline"
              className="rounded-full border-white/15 text-white/80"
            >
              {role.role}
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-sm font-bold text-white">
          {role.character?.name || "Unknown Character"}
        </p>

        <p className="mt-1 line-clamp-2 text-xs text-violet-200/80">
          {role.anime?.title || "Unknown Anime"}
        </p>

        {role.appearances?.length > 1 && (
          <p className="mt-1 line-clamp-2 text-xs text-white/45">
            Also appears in:{" "}
            {role.appearances
              .filter((anime) => anime.id !== role.anime?.id)
              .slice(0, 3)
              .map((anime) => anime.title)
              .join(", ")}
          </p>
        )}

        {role.anime?.url && (
          <a
            href={role.anime.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            View anime
          </a>
        )}
      </div>
    </div>
  );
}