import Link from "next/link";
import { PREVIEW_BG, TemplatePreview } from "@/components/editor/TemplatePreview";
import { CommunityActions } from "@/components/teacher/CommunityActions";
import { CommunityIcon, type MyActivitiesBase } from "@/components/teacher/MyActivitiesBoard";
import { ButtonLink } from "@/components/ui/Button";
import { communityWhere } from "@/lib/community";
import { db } from "@/lib/db";
import { TEMPLATES, templateByKey } from "@/lib/games/templates";
import { mediaUrl } from "@/lib/media/save";

// Community: activities shared by teachers (and the platform admin) with everyone on LextroSpeak.
// Reading is open to every teacher; changing means "Copy & edit", which makes your own copy.
// Shown in Teacher View (/teacher/my-activities/community) and Platform Admin (/admin/my-activities/community).

export type CommunitySearch = { q?: string; type?: string; mine?: string; gone?: string };

const LIMIT = 120;

export async function CommunityView({ sp, user, teacher, base }: { sp: CommunitySearch; user: { role: string }; teacher: { id: string }; base: MyActivitiesBase }) {
  const q = (sp.q ?? "").trim().slice(0, 100);
  const type = TEMPLATES.some((t) => t.key === sp.type) ? sp.type! : "";
  const mine = sp.mine === "1";
  const admin = user.role === "ADMIN";
  const self = `${base}/community`;

  const games = await db.game.findMany({
    where: {
      ...communityWhere,
      ...(type ? { templateKey: type } : {}),
      ...(mine ? { teacherId: teacher.id } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { topic: { contains: q, mode: "insensitive" as const } }, { level: { contains: q, mode: "insensitive" as const } }] } : {}),
    },
    orderBy: { communitySharedAt: "desc" },
    take: LIMIT,
    include: {
      teacher: { select: { user: { select: { displayName: true } } } },
      _count: { select: { items: true } },
      items: { where: { imageAssetId: { not: null } }, orderBy: { position: "asc" }, take: 1, select: { imageAssetId: true } },
    },
  });
  const copies = games.length ? await db.game.groupBy({ by: ["copiedFromId"], where: { copiedFromId: { in: games.map((g) => g.id) } }, _count: true }) : [];
  const copiesOf = new Map(copies.map((c) => [c.copiedFromId, c._count]));
  const types = TEMPLATES.filter((t) => t.available);

  const link = (p: Record<string, string>) => {
    const u = new URLSearchParams(Object.entries(p).filter(([, v]) => v));
    return `${self}${u.size ? `?${u}` : ""}`;
  };
  const from = base.startsWith("/admin") ? "admin" : "teacher";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-card px-5 py-4 shadow-soft">
        <div className="min-w-0 flex-1">
          <Link href={base} className="text-sm font-bold text-muted hover:text-ink">My Activities ›</Link>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold"><CommunityIcon className="h-7 w-7" /> Community</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink size="sm" href={`${base.startsWith("/admin") ? "/admin" : "/teacher"}/games/new`}>+ Create activity</ButtonLink>
          <form action={self} className="flex">
            {type && <input type="hidden" name="type" value={type} />}
            {mine && <input type="hidden" name="mine" value="1" />}
            <input name="q" defaultValue={q} placeholder="Search the Community…" aria-label="Search the Community" className="h-9 w-48 rounded-l-full border border-line bg-card px-4 text-sm sm:w-56" />
            <button className="h-9 rounded-r-full border border-l-0 border-line bg-paper-2 px-3 text-sm font-bold" aria-label="Search">⌕</button>
          </form>
        </div>
      </div>

      <div className="rounded-xl2 border border-line bg-card px-5 py-4">
        <p className="mb-4 max-w-3xl text-sm text-ink-2">
          Activities that teachers share with everyone on LextroSpeak. Use <b>Copy &amp; edit</b> to get your own copy in My Activities and adapt it as you like; the original never changes.
          To share one of yours, open its <b>⋮</b> menu in My Activities and choose <b>Share to Community</b>.
        </p>

        <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link href={link({ q, mine: mine ? "" : "1", type })} aria-current={mine ? "true" : undefined} className={`rounded-full px-3 py-1.5 font-bold ring-1 ${mine ? "bg-ink text-white ring-ink" : "bg-card ring-line hover:bg-paper-2"}`}>
            Shared by me
          </Link>
          <Link href={link({ q, mine: mine ? "1" : "" })} aria-current={!type ? "true" : undefined} className={`rounded-full px-3 py-1.5 font-bold ring-1 ${!type ? "bg-ink text-white ring-ink" : "bg-card ring-line hover:bg-paper-2"}`}>
            All types
          </Link>
          {types.map((t) => (
            <Link key={t.key} href={link({ q, mine: mine ? "1" : "", type: t.key })} aria-current={type === t.key ? "true" : undefined} className={`rounded-full px-3 py-1.5 font-bold ring-1 ${type === t.key ? "bg-ink text-white ring-ink" : "bg-card ring-line hover:bg-paper-2"}`}>
              {t.name}
            </Link>
          ))}
        </nav>

        {sp.gone === "1" && <p role="alert" className="mb-3 rounded-xl bg-coral-soft px-4 py-2 text-sm font-semibold text-coral-dark">That activity is no longer in the Community.</p>}

        {games.length === 0 ? (
          <div className="grid place-items-center gap-3 py-14 text-center" data-testid="community-empty">
            <p className="font-display text-xl font-semibold">{q || type || mine ? "No Community activities match" : "The Community is empty for now"}</p>
            <p className="max-w-md text-sm text-muted">Share an activity from My Activities (⋮ › Share to Community) and every teacher will be able to copy and adapt it.</p>
            <ButtonLink href={base} variant="secondary">Go to My Activities</ButtonLink>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="community-list">
            {games.map((g) => {
              const own = g.teacherId === teacher.id;
              const thumb = g.items[0]?.imageAssetId ? mediaUrl(g.items[0].imageAssetId) : null;
              const n = copiesOf.get(g.id) ?? 0;
              return (
                <li key={g.id} data-testid="community-activity" className="flex flex-col rounded-xl border border-line bg-card shadow-soft">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-t-xl" style={{ background: PREVIEW_BG[g.templateKey] ?? "#fff1de" }}>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-contain p-2" loading="lazy" />
                    ) : (
                      <div className="h-full w-full p-3 [&_svg]:h-full [&_svg]:w-full"><TemplatePreview k={g.templateKey} /></div>
                    )}
                    {own && <span className="absolute left-2 top-2 rounded-full bg-sky px-2 py-0.5 text-[11px] font-bold text-white">Yours</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 border-t border-line px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display font-semibold" title={g.title}>{g.title || "Untitled activity"}</h2>
                      <p className="truncate text-xs text-muted">
                        {templateByKey(g.templateKey)?.name ?? g.templateKey} · {g._count.items} {g._count.items === 1 ? "card" : "cards"}
                        {g.level ? ` · ${g.level}` : ""}
                      </p>
                      {g.topic && <p className="truncate text-xs text-muted">{g.topic}</p>}
                      <p className="mt-1 truncate text-xs text-ink-2">
                        by {own ? "you" : g.teacher.user.displayName}
                        {n > 0 ? ` · copied ${n} ${n === 1 ? "time" : "times"}` : ""}
                      </p>
                    </div>
                    <CommunityActions gameId={g.id} title={g.title} own={own} canRemove={admin} from={from} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {games.length === LIMIT && <p className="mt-4 text-xs text-muted">Showing the {LIMIT} most recently shared. Search or filter to find others.</p>}
      </div>
    </div>
  );
}
