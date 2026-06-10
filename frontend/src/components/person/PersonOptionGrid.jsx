import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getActionLabel(action) {
  if (action === "voice_roles") return "Show Voice Roles";
  return "Show Profile";
}

export default function PersonOptionGrid({
  items = [],
  targetAction = "overview",
  onPersonSelect
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.07] px-5 py-4 text-sm text-white/80 shadow-xl shadow-black/20 backdrop-blur">
        I found multiple people that match your request. Choose the exact voice actor or actress you mean.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((person) => (
          <Card
            key={person.id}
            className="group overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/9"
          >
            <CardContent className="flex h-full gap-4 p-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/40">
                {person.image ? (
                  <img
                    src={person.image}
                    alt={person.name}
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
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-white text-slate-950 hover:bg-white"
                  >
                    Person
                  </Badge>

                  {person.favorites > 0 && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-white/15 text-white/80"
                    >
                      {person.favorites} favorites
                    </Badge>
                  )}
                </div>

                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">
                  {person.name}
                </h3>

                {(person.givenName || person.familyName) && (
                  <p className="mt-1 line-clamp-1 text-xs text-white/60">
                    {[person.givenName, person.familyName].filter(Boolean).join(" ")}
                  </p>
                )}

                {person.alternateNames?.length > 0 && (
                  <p className="mt-2 line-clamp-2 text-xs text-violet-200/80">
                    Also known as: {person.alternateNames.slice(0, 3).join(", ")}
                  </p>
                )}

                <div className="mt-auto pt-5">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/30 hover:from-violet-500 hover:to-fuchsia-500"
                    onClick={() => onPersonSelect?.(person, targetAction)}
                  >
                    {getActionLabel(targetAction)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}