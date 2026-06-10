import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export default function PersonOverview({ person }) {
    if (!person) return null;

    const birthday = formatDate(person.birthday);
    const topVoices = person.voices || [];

    return (
        <Card className="mt-4 overflow-hidden rounded-3xl border-white/10 bg-white/6 text-white shadow-xl shadow-black/20 backdrop-blur">
            <CardContent className="p-5">
                <div className="flex flex-col gap-5 md:flex-row">
                    <div className="mx-auto aspect-3/4 w-36 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-black/40 md:mx-0">
                        {person.image ? (
                            <img
                                src={person.image}
                                alt={person.name}
                                className="h-full w-full object-cover object-top"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
                                No image
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="rounded-full">
                                Voice Actor
                            </Badge>

                            {person.favorites > 0 && (
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-white/15 text-white/80"
                                >
                                    {person.favorites} favorites
                                </Badge>
                            )}

                            {birthday && (
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-white/15 text-white/80"
                                >
                                    Born {birthday}
                                </Badge>
                            )}
                        </div>

                        <h3 className="text-2xl font-bold text-white">{person.name}</h3>

                        {(person.givenName || person.familyName) && (
                            <p className="mt-1 text-sm text-white/60">
                                {[person.givenName, person.familyName].filter(Boolean).join(" ")}
                            </p>
                        )}

                        {person.alternateNames?.length > 0 && (
                            <p className="mt-2 text-sm text-violet-200/80">
                                Also known as: {person.alternateNames.slice(0, 5).join(", ")}
                            </p>
                        )}

                        {person.about && (
                            <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-white/75">
                                {person.about}
                            </p>
                        )}
                    </div>
                </div>

                {topVoices.length > 0 && (
                    <div className="mt-6">
                        <h4 className="mb-3 text-sm font-semibold text-white/80">
                            Notable voice roles
                        </h4>

                        <div className="grid gap-3 md:grid-cols-2">
                            {topVoices.slice(0, 8).map((role) => (
                                <div
                                    key={`${role.anime?.id}-${role.character?.id}`}
                                    className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                                >
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">
                                        {role.character?.image ? (
                                            <img
                                                src={role.character.image}
                                                alt={role.character.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : role.anime?.image ? (
                                            <img
                                                src={role.anime.image}
                                                alt={role.anime.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white">
                                            {role.character?.name}
                                        </p>

                                        <p className="mt-1 line-clamp-2 text-xs text-white/55">
                                            {role.anime?.title}
                                        </p>

                                        {role.role && (
                                            <p className="mt-1 text-xs text-violet-200">
                                                {role.role}
                                            </p>
                                        )}

                                        {role.appearances?.length > 1 && (
                                            <p className="mt-1 line-clamp-2 text-[11px] text-white/40">
                                                Also appears in:{" "}
                                                {role.appearances
                                                    .filter((anime) => anime.id !== role.anime?.id)
                                                    .slice(0, 2)
                                                    .map((anime) => anime.title)
                                                    .join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}