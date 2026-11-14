import { KindBadge } from "@/components/library/LibraryBits";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { addResourcesToGame, removeFromGame } from "@/lib/actions/library";
import { db } from "@/lib/db";
import { pickableLibrary } from "@/lib/library/service";
import type { Kind } from "@/lib/library/types";
import { LibraryPicker } from "./LibraryPicker";

/** Administrator panel under the activity editor: library resources used by this activity. */
export async function GameLibraryPanel({ gameId }: { gameId: string }) {
  const [rows, library] = await Promise.all([
    db.gameResource.findMany({ where: { gameId }, orderBy: { position: "asc" }, include: { resource: { select: { id: true, title: true, kind: true, status: true } } } }),
    pickableLibrary(),
  ]);
  return (
    <Panel className="mx-auto mt-8 max-w-5xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Library resources</h2>
          <p className="text-sm text-muted">Students see these with the activity. Removing one here keeps it in the Library and in its topics.</p>
        </div>
        <LibraryPicker items={library} excludeIds={rows.map((r) => r.resourceId)} onAdd={addResourcesToGame.bind(null, gameId)} />
      </div>
      <ul className="divide-y divide-line" data-testid="activity-resources">
        {rows.map(({ resource: r }) => (
          <li key={r.id} data-testid="activity-resource" className="flex flex-wrap items-center gap-3 py-3">
            <KindBadge kind={r.kind as Kind} />
            <a href={`/admin/content/${r.id}/preview`} target="_blank" rel="noopener" className="flex-1 font-bold text-sky hover:underline">{r.title}</a>
            {r.status === "DRAFT" && <span className="text-xs font-bold text-[#8a5a00]">draft · students see it after you publish</span>}
            <form action={removeFromGame}>
              <input type="hidden" name="gameId" value={gameId} />
              <input type="hidden" name="resourceId" value={r.id} />
              <Button size="sm" variant="secondary">Remove from Activity</Button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-muted">No library resources yet.</li>}
      </ul>
    </Panel>
  );
}
