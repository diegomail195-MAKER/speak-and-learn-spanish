import Link from "next/link";
import { Art } from "@/components/ui/Art";
import { KIND_ORDER } from "@/lib/library/kindIcons";
import { EyeIcon } from "./LibraryBits";
import { FavoriteButton } from "./FavoriteButton";
import { TopicAccess, type AccessItem } from "./TopicAccess";

export type RowTopic = { id: string; titleEs: string; titleEn: string; description: string; color: string; art: string };
export type RowStep = { key: string; kind: string; title: string; href: string };

/**
 * A topic in the Library list: thumbnail, title, short description and one access per type of
 * resource, generated from the topic's saved resources (and the teacher's own activities).
 */
export function TopicRow({ topic, href, studentViewHref, steps, favorite, editHref }: { topic: RowTopic; href: string; studentViewHref: string; steps: RowStep[]; favorite: { on: boolean; refresh?: boolean }; editHref?: string }) {
  const groups = new Map<string, AccessItem[]>();
  for (const s of steps) groups.set(s.kind, [...(groups.get(s.kind) ?? []), { key: s.key, title: s.title, href: s.href }]);
  const rank = (k: string) => (KIND_ORDER.includes(k) ? KIND_ORDER.indexOf(k) : KIND_ORDER.length);
  const kinds = [...groups.keys()].sort((a, b) => rank(a) - rank(b));
  return (
    <article className="topic-row" data-testid="topic-row" aria-labelledby={`topic-${topic.id}`}>
      <Link href={href} className="topic-thumb" style={{ background: `color-mix(in srgb, ${topic.color} 22%, white)` }} tabIndex={-1} aria-hidden>
        <Art k={topic.art} className="h-[86%] w-[86%]" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h2 id={`topic-${topic.id}`} className="topic-title">
            <Link href={href} className="hover:underline">{topic.titleEs}</Link>
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
        {kinds.length ? (
          <ul className="topic-accesses" aria-label={`Resources: ${topic.titleEs}`}>
            {kinds.map((k) => (
              <li key={k}><TopicAccess kind={k} items={groups.get(k)!} topic={topic.titleEs} /></li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No resources yet.</p>
        )}
      </div>
    </article>
  );
}
