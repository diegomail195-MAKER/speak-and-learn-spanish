import Link from "next/link";
import { Art } from "@/components/ui/Art";
import { KIND_ACCESS_LABEL, KIND_ORDER } from "@/lib/library/kindIcons";
import { displayKind } from "@/lib/library/types";
import { EyeIcon } from "./LibraryBits";
import { FavoriteButton } from "./FavoriteButton";
import { KindPicture, TopicAccess, type AccessItem } from "./TopicAccess";

export type RowTopic = { id: string; titleEs: string; titleEn: string; description: string; color: string; art: string };
export type RowStep = { key: string; kind: string; title: string; href: string };

/** Steps grouped by shown category (old Printables under Worksheet), in the fixed category order. */
function groupSteps(steps: Array<{ key: string; kind: string; title: string; href?: string }>) {
  const groups = new Map<string, AccessItem[]>();
  for (const s of steps) {
    const k = displayKind(s.kind);
    groups.set(k, [...(groups.get(k) ?? []), { key: s.key, title: s.title, href: s.href ?? "" }]);
  }
  const rank = (k: string) => (KIND_ORDER.includes(k) ? KIND_ORDER.indexOf(k) : KIND_ORDER.length);
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b));
}

function Thumb({ topic }: { topic: RowTopic }) {
  return (
    <span className="topic-thumb" style={{ background: `color-mix(in srgb, ${topic.color} 22%, white)` }} aria-hidden>
      <Art k={topic.art} className="h-[86%] w-[86%]" />
    </span>
  );
}

/**
 * A topic in the teacher's Library: thumbnail, title, short description and one access per type
 * of resource, generated from the topic's resources in the teacher's order. The whole row opens
 * the topic; each access opens a preview of its resources (several of a type → a list of titles).
 */
export function TopicRow({ topic, href, studentViewHref, steps, favorite, editHref }: { topic: RowTopic; href: string; studentViewHref: string; steps: RowStep[]; favorite: { on: boolean; refresh?: boolean }; editHref?: string }) {
  const groups = groupSteps(steps);
  return (
    <article className="topic-row" data-testid="topic-row" aria-labelledby={`topic-${topic.id}`}>
      <Thumb topic={topic} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h2 id={`topic-${topic.id}`} className="topic-title">
            <Link href={href} className="topic-row-link" data-testid="topic-row-link">{topic.titleEs}</Link>
            <span className="topic-title-en">{topic.titleEn}</span>
          </h2>
          <div className="topic-row-tools">
            <FavoriteButton topicId={topic.id} title={topic.titleEs} initial={favorite.on} refresh={favorite.refresh} inline />
            <Link href={studentViewHref} className="topic-tool" data-testid="student-view" aria-label={`Student View: ${topic.titleEs}`}>
              <EyeIcon /> <span className="topic-tool-text">Student View</span>
            </Link>
            {editHref && (
              <Link href={editHref} className="topic-tool" data-testid="edit-topic" aria-label={`Edit topic: ${topic.titleEs}`}>
                ✎ <span className="topic-tool-text">Edit</span>
              </Link>
            )}
          </div>
        </div>
        {topic.description && <p className="topic-desc" data-testid="topic-description">{topic.description}</p>}
        {groups.length ? (
          <ul className="topic-accesses topic-accesses-interactive" aria-label={`Preview resources: ${topic.titleEs}`}>
            {groups.map(([k, items]) => (
              <li key={k}><TopicAccess kind={k} items={items} topic={topic.titleEs} /></li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No resources yet.</p>
        )}
      </div>
    </article>
  );
}

/**
 * A topic task for a student. The whole row is one link into the guided lesson, which starts at
 * the first step or resumes the saved progress. The icons only show what the topic contains: they
 * are not links and have no click handlers, so no step can be skipped.
 */
export function StudentTopicRow({ topic, href, kinds, done, total }: { topic: RowTopic; href: string; kinds: Array<{ key: string; kind: string; title: string }>; done: number; total: number }) {
  const groups = groupSteps(kinds);
  const labels = groups.map(([k]) => KIND_ACCESS_LABEL[k] ?? k);
  return (
    <Link href={href} className="topic-row" data-testid="student-task" aria-label={`${topic.titleEs}. ${done} of ${total} done.${labels.length ? ` Contains: ${labels.join(", ")}.` : ""}`}>
      <Thumb topic={topic} />
      <span className="block min-w-0 flex-1">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <span className="topic-title">
            {topic.titleEs}
            <span className="topic-title-en">{topic.titleEn}</span>
          </span>
          <span className="topic-progress" data-testid="task-progress">{done === total && total > 0 ? "✓ Done" : `${done}/${total} done`}</span>
        </span>
        {topic.description && <span className="topic-desc block">{topic.description}</span>}
        {groups.length > 0 && (
          <span className="topic-accesses" aria-hidden data-testid="topic-indicators">
            {groups.map(([k]) => (
              <span key={k} className="topic-access topic-indicator" data-testid="topic-indicator" data-kind={k}>
                <KindPicture kind={k} />
                <span className="topic-access-label">{KIND_ACCESS_LABEL[k] ?? k}</span>
              </span>
            ))}
          </span>
        )}
      </span>
    </Link>
  );
}
