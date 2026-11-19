import Link from "next/link";
import { Kind3D, TopicThumb, orderedKinds } from "@/components/dashboard/DashBits";
import { displayKind } from "@/lib/library/types";

// Teacher Dashboard › Explore the library: one topic with a large picture, its description and a
// big icon per kind of resource (Watch, Play, Study, Listen, Speak) that opens the first one.

const VERB: Record<string, string> = { VIDEO: "Watch", GAME: "Play", FLASHCARDS: "Study", SONG: "Listen", SPEAKING: "Speak", WORKSHEET: "Print", LISTENING: "Hear" };

export type PickTopic = { id: string; titleEs: string; description: string; color: string; art: string };
export type PickStep = { key: string; kind: string; title: string; href: string };

export function LibraryPick({ topic, href, steps }: { topic: PickTopic; href: string; steps: PickStep[] }) {
  const kinds = orderedKinds(steps.map((s) => s.kind));
  return (
    <li className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)_auto] lg:items-center" data-testid="library-pick">
      <Link href={href} className="block rounded-xl focus-visible:outline-offset-2" aria-label={`Open ${topic.titleEs}`} tabIndex={-1}>
        <TopicThumb topic={topic} size="wide" />
      </Link>
      <div className="min-w-0 lg:border-r lg:border-[#E2E6EC] lg:pr-6">
        <Link href={href} className="font-display text-[22px] font-extrabold leading-tight text-[#172033] hover:underline [overflow-wrap:anywhere]">{topic.titleEs}</Link>
        {topic.description && <p className="mt-1.5 line-clamp-3 max-w-[46ch] text-[16px] leading-snug text-[#3D4759]">{topic.description}</p>}
      </div>
      {kinds.length > 0 && (
        <ul className="flex flex-wrap gap-x-1 gap-y-3 sm:gap-x-2 sm:col-span-2 lg:col-span-1 lg:flex-nowrap lg:pl-2" aria-label={`Open a resource of ${topic.titleEs}`}>
          {kinds.map((k) => {
            const first = steps.find((s) => displayKind(s.kind) === k)!;
            const verb = VERB[k] ?? k;
            return (
              <li key={k}>
                <Link href={first.href} className="flex min-h-11 w-[68px] flex-col sm:w-[84px] items-center gap-1.5 rounded-xl px-1 py-1.5 text-[16px] font-semibold text-[#172033] hover:bg-[#F1F4F8]" aria-label={`${verb}: ${first.title}`} data-testid="pick-kind">
                  <Kind3D kind={k} className="h-12 w-12 sm:h-14 sm:w-14" />
                  {verb}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
