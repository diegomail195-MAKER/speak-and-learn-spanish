import { notFound } from "next/navigation";
import { MyActivitiesBoard, type BoardActivity, type BoardFolder, type BoardSort } from "@/components/teacher/MyActivitiesBoard";
import { UnsavedDrafts } from "@/components/teacher/UnsavedDrafts";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/games/templates";
import { mediaUrl } from "@/lib/media/save";

export const metadata = { title: "My Activities" };

type Search = { folder?: string; q?: string; sort?: string; dir?: string; view?: string; bin?: string };

export default async function MyActivitiesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { teacher } = await requireTeacherPage();
  const bin = sp.bin === "1";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const sort: BoardSort = {
    by: sp.sort === "name" || sp.sort === "played" ? sp.sort : "modified",
    dir: sp.dir === "asc" || sp.dir === "desc" ? sp.dir : sp.sort === "name" ? "asc" : "desc",
  };
  const view = sp.view === "small" ? "small" : "large";

  const allFolders = await db.activityFolder.findMany({ where: { teacherId: teacher.id }, orderBy: { name: "asc" } });
  const byId = new Map(allFolders.map((f) => [f.id, f]));
  const current = sp.folder && !bin && !q ? byId.get(sp.folder) : undefined;
  if (sp.folder && !bin && !q && !current) notFound();

  // Breadcrumb: My Activities › … › current folder
  const path: Array<{ id: string; name: string; color: string }> = [];
  for (let f = current; f && path.length < 50; f = f.parentId ? byId.get(f.parentId) : undefined) path.unshift({ id: f.id, name: f.name, color: f.color });

  const games = await db.game.findMany({
    where: {
      teacherId: teacher.id,
      ...(bin ? { status: "ARCHIVED" } : { status: { not: "ARCHIVED" } }),
      // Searching looks in every folder; otherwise show the current folder only.
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { topic: { contains: q, mode: "insensitive" as const } }] } : bin ? {} : { folderId: current?.id ?? null }),
    },
    include: {
      _count: { select: { items: true, assignments: true } },
      items: { where: { imageAssetId: { not: null } }, orderBy: { position: "asc" }, take: 1, select: { imageAssetId: true } },
    },
  });
  const played = games.length
    ? await db.studentAttempt.groupBy({ by: ["gameId"], where: { gameId: { in: games.map((g) => g.id) } }, _max: { startedAt: true } })
    : [];
  const lastPlayed = new Map(played.map((p) => [p.gameId, p._max.startedAt]));

  const activities: BoardActivity[] = games.map((g) => ({
    id: g.id,
    title: g.title,
    templateKey: g.templateKey,
    template: templateByKey(g.templateKey)?.name ?? g.templateKey,
    status: g.status,
    items: g._count.items,
    assignments: g._count.assignments,
    thumb: g.items[0]?.imageAssetId ? mediaUrl(g.items[0].imageAssetId) : null,
    updatedAt: g.updatedAt.toISOString(),
    lastPlayed: lastPlayed.get(g.id)?.toISOString() ?? null,
    folderName: q && g.folderId ? byId.get(g.folderId)?.name ?? null : null,
  }));
  const sign = sort.dir === "asc" ? 1 : -1;
  activities.sort((a, b) => {
    if (sort.by === "name") return sign * (a.title || "~").localeCompare(b.title || "~", "es", { sensitivity: "base" });
    if (sort.by === "played") return sign * ((a.lastPlayed ?? "").localeCompare(b.lastPlayed ?? "") || a.updatedAt.localeCompare(b.updatedAt));
    return sign * a.updatedAt.localeCompare(b.updatedAt);
  });

  const gameCounts = await db.game.groupBy({ by: ["folderId"], where: { teacherId: teacher.id, status: { not: "ARCHIVED" }, folderId: { not: null } }, _count: true });
  const countOf = new Map(gameCounts.map((c) => [c.folderId, c._count]));
  const folders: BoardFolder[] =
    bin || q
      ? []
      : allFolders
          .filter((f) => f.parentId === (current?.id ?? null))
          .map((f) => ({ id: f.id, name: f.name, color: f.color, count: countOf.get(f.id) ?? 0, subfolders: allFolders.filter((c) => c.parentId === f.id).length, updatedAt: f.updatedAt.toISOString() }))
          .sort((a, b) => (sort.by === "modified" ? sign * a.updatedAt.localeCompare(b.updatedAt) : (sort.by === "name" ? sign : 1) * a.name.localeCompare(b.name, "es", { sensitivity: "base" })));

  // Every folder, indented, for "Move to…" (works without drag and drop, e.g. on a tablet).
  const tree: Array<{ id: string; name: string; depth: number }> = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const f of allFolders.filter((x) => x.parentId === parentId)) {
      tree.push({ id: f.id, name: f.name, depth });
      if (depth < 20) walk(f.id, depth + 1);
    }
  };
  walk(null, 0);

  return (
    <>
      {!bin && <UnsavedDrafts />}
      <MyActivitiesBoard
        key={`${current?.id ?? "root"}-${bin}-${q}`}
        folder={current ? { id: current.id, name: current.name, color: current.color, parentId: current.parentId } : null}
        path={path}
        folders={folders}
        activities={activities}
        tree={tree}
        sort={sort}
        view={view}
        q={q}
        bin={bin}
      />
    </>
  );
}
