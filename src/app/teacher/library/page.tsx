import Link from "next/link";
import { GRADE_FILTERS, type GradeFilter } from "@/components/library/gradeFilters";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { KindBadge } from "@/components/library/LibraryBits";
import { TopicRow } from "@/components/library/TopicRow";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { libraryTopics } from "@/lib/library/service";
import { teacherTopicSteps } from "@/lib/library/steps";
import { ACTIVE_KINDS, KIND_LABEL, displayKind, type Grade, type Kind } from "@/lib/library/types";

export const metadata = { title: "Library" };

// The Library's content is tagged with two bands: Lower (K–2) and Upper (3–6), so 3–4 and 5–6
// both show Upper content. Old links (?grade=LOWER / UPPER) keep working.
const BAND: Record<GradeFilter, Grade | null> = { all: null, "k-2": "LOWER", "3-4": "UPPER", "5-6": "UPPER" };
const LEGACY: Record<string, GradeFilter> = { LOWER: "k-2", UPPER: "3-4" };

// Library: filter by grade, search a theme or an activity, or show My favorites. Published content only.
export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ grade?: string; type?: string; q?: string; fav?: string }> }) {
  const { user, teacher } = await requireTeacherPage();
  const sp = await searchParams;
  const grade: GradeFilter = GRADE_FILTERS.some((f) => f.id === sp.grade) ? (sp.grade as GradeFilter) : (LEGACY[sp.grade ?? ""] ?? "all");
  const band = BAND[grade];
  // Old links to Printables open Worksheet (the two were merged).
  const type = sp.type === "PRINTABLE" ? "WORKSHEET" : (ACTIVE_KINDS as readonly string[]).includes(sp.type ?? "") ? (sp.type as Kind) : null;
  const ofType = (k: string) => displayKind(k) === type;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const fav = sp.fav === "1";
  const [topics, favRows] = await Promise.all([
    libraryTopics({ grade: band ?? undefined, q: q || undefined, favoritesOf: fav ? teacher.id : undefined }),
    db.topicFavorite.findMany({ where: { teacherId: teacher.id }, select: { topicId: true } }),
  ]);
  const favorites = new Set(favRows.map((r) => r.topicId));
  // Each row's accesses come from the topic's saved resources, in this teacher's lesson order
  // (their own Speaking / flashcards activities included).
  const stepsByTopic = type
    ? new Map()
    : new Map(
        await Promise.all(
          topics.map(async (t) => {
            const { steps } = await teacherTopicSteps({ id: teacher.id, schoolId: user.schoolId }, t.id, band);
            return [t.id, steps.map((st) => ({ key: st.key, kind: st.kind, title: st.title, href: st.resourceId ? `/teacher/library/resources/${st.resourceId}` : `/play/preview/${st.gameId}` }))] as const;
          }),
        ),
      );
  const isAdmin = user.role === "ADMIN";
  const keep = (extra: string) => {
    const p = new URLSearchParams();
    if (grade !== "all") p.set("grade", grade);
    if (q) p.set("q", q);
    if (fav) p.set("fav", "1");
    if (extra) p.set("type", extra);
    return `/teacher/library${p.size ? `?${p}` : ""}`;
  };
  const gradeQs = band ? `?grade=${band}` : "";
  const tab = (active: boolean) => `rounded-full px-4 py-2.5 font-bold ${active ? "bg-ink text-white" : "bg-card text-ink-2 ring-1 ring-line hover:bg-paper-2"}`;

  return (
    <>
      <LibraryHeader grade={grade} q={q} fav={fav} />

      <nav aria-label="Browse by" className="mb-5 flex flex-wrap gap-2">
        <Link href={keep("")} className={tab(!type)}>Topics</Link>
        {ACTIVE_KINDS.map((k) => (
          <Link key={k} href={keep(k)} className={tab(type === k)}>{KIND_LABEL[k].plural}</Link>
        ))}
      </nav>
      {topics.length === 0 && (
        <p className="rounded-[22px] border-2 border-dashed border-line p-8 text-center font-bold text-ink-2" data-testid="library-empty">
          {fav ? "No favorites here yet. Tap the heart on a topic to save it." : q ? `No themes or activities match “${q}”.` : "No published content for this grade yet."}
        </p>
      )}
      {!type ? (
        <ul className="topic-list" data-testid="library-topics">
          {topics.map((t) => (
            <li key={t.id}>
              <TopicRow
                topic={t}
                href={`/teacher/library/topics/${t.slug}${gradeQs}`}
                previewHref={`/teacher/library/topics/${t.slug}/preview${gradeQs}`}
                studentViewHref={`/teacher/library/topics/${t.slug}/student-view${gradeQs}`}
                steps={stepsByTopic.get(t.id) ?? []}
                favorite={{ on: favorites.has(t.id), refresh: fav }}
                editHref={isAdmin ? `/admin/topics/${t.id}` : undefined}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-6">
          {topics.filter((t) => t.resources.some((r) => ofType(r.resource.kind))).map((t) => (
            <section key={t.id}>
              <h2 className="mb-2 font-display text-xl font-extrabold">{t.titleEs} <span className="text-base font-bold text-muted">· {t.titleEn}</span></h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {t.resources.filter((r) => ofType(r.resource.kind)).map((r) => (
                  <li key={r.resource.id}>
                    <Link href={`/teacher/library/resources/${r.resource.id}`} className="flex items-center justify-between gap-3 rounded-[20px] bg-card p-4 shadow-pop hover:-translate-y-0.5">
                      <span className="font-bold">{r.resource.title}</span>
                      <KindBadge kind={r.resource.kind as Kind} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
