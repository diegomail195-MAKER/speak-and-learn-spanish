import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Panel";
import { deleteGame, duplicateGame, setGameStatus } from "@/lib/actions/games";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/games/templates";

export const metadata = { title: "Interactive Games" };

type Search = { q?: string; status?: string; category?: string; sort?: string };

export default async function GamesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { user } = await requireTeacherPage();
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") : undefined;
  const [games, categories] = await Promise.all([
    db.game.findMany({
      where: {
        schoolId: user.schoolId,
        status: status ?? { not: "ARCHIVED" },
        categoryId: sp.category || undefined,
        ...(sp.q ? { OR: [{ title: { contains: sp.q, mode: "insensitive" as const } }, { topic: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
      },
      include: { category: true, _count: { select: { items: true, assignments: true } } },
      orderBy: sp.sort === "title" ? { title: "asc" } : { updatedAt: "desc" },
    }),
    db.category.findMany({ where: { schoolId: user.schoolId }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Interactive Games" title="Activities" subtitle="Voice-first activities: flashcards, spelling, wheels, diagrams, boxes and more." actions={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>} />
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search title or topic" className="h-10 min-w-56 flex-1 rounded-full border border-line bg-card px-4" aria-label="Search" />
        <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Status">
          <option value="">Drafts &amp; published</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="h-10 rounded-full border border-line bg-card px-3" aria-label="Sort">
          <option value="">Recently edited</option>
          <option value="title">Title A–Z</option>
        </select>
        <button className="h-10 rounded-full bg-ink px-5 font-bold text-white">Filter</button>
      </form>
      {games.length === 0 ? (
        <EmptyState title="No games here yet" body="Choose a template, add pictures, questions and answers, then assign it." action={<ButtonLink href="/teacher/games/new">+ Create Activity</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
          {games.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <Link href={`/teacher/games/${g.id}/edit`} className="min-w-60 flex-1">
                <span className="block font-display text-lg font-semibold hover:text-coral">{g.title || "Untitled game"}</span>
                <span className="text-sm text-muted">
                  {templateByKey(g.templateKey)?.name} · {g._count.items} questions{g.category ? ` · ${g.category.nameEn}` : ""} · {g._count.assignments} assignments
                </span>
              </Link>
              <Badge tone={g.status === "PUBLISHED" ? "leaf" : g.status === "ARCHIVED" ? "coral" : "neutral"}>{g.status.toLowerCase()}</Badge>
              <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                <Link href={`/teacher/games/${g.id}/preview`} className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Preview</Link>
                {g.status === "PUBLISHED" && <Link href={`/teacher/assignments/new?gameId=${g.id}`} className="rounded-full px-3 py-1.5 text-teal-dark hover:bg-teal-soft">Assign</Link>}
                <form action={duplicateGame}><input type="hidden" name="gameId" value={g.id} /><button className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Duplicate</button></form>
                {g.status === "PUBLISHED" && (
                  <form action={setGameStatus}><input type="hidden" name="gameId" value={g.id} /><input type="hidden" name="status" value="DRAFT" /><button className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Unpublish</button></form>
                )}
                {g.status !== "ARCHIVED" ? (
                  <form action={setGameStatus}><input type="hidden" name="gameId" value={g.id} /><input type="hidden" name="status" value="ARCHIVED" /><button className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-paper-2">Archive</button></form>
                ) : (
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-coral-dark hover:bg-coral-soft">Delete…</summary>
                    <form action={deleteGame} className="absolute right-0 z-10 mt-1 w-64 rounded-xl border border-line bg-card p-3 text-xs font-normal shadow-soft">
                      <input type="hidden" name="gameId" value={g.id} />
                      <p>This permanently deletes the game and its student results. Type <strong>DELETE</strong> to confirm.</p>
                      <input name="confirm" required pattern="DELETE" className="mt-2 w-full rounded-lg border border-line px-2 py-1" aria-label="Type DELETE" />
                      <button className="mt-2 rounded-full bg-coral px-3 py-1 font-bold text-white">Delete forever</button>
                    </form>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
