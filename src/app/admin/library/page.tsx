import Link from "next/link";
import { Card, Kind3D, PageTitle } from "@/components/dashboard/DashBits";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { WsIcon } from "@/components/shell/WsIcons";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { KIND_ACCESS_LABEL } from "@/lib/library/kindIcons";
import { displayKind } from "@/lib/library/types";

export const metadata = { title: "Content Library" };

// The seven LextroSpeak categories. Speaking activities are voice games made in My Activities
// (teachers add them to their lesson order), so that card opens them there.
const CATEGORIES = [
  { kind: "VIDEO", blurb: "Short videos, uploaded or from YouTube." },
  { kind: "GAME", blurb: "Interactive games." },
  { kind: "FLASHCARDS", blurb: "Picture and word cards." },
  { kind: "SONG", blurb: "Music videos and songs." },
  { kind: "SPEAKING", blurb: "Voice activities students answer aloud." },
  { kind: "WORKSHEET", blurb: "Printable worksheets (PDF or built-in)." },
  { kind: "LISTENING", blurb: "Listening activities with audio." },
];

export default async function ContentLibrary() {
  const { teacher } = await requireAdminPage();
  const [byKind, speaking, recent] = await Promise.all([
    db.libraryResource.groupBy({ by: ["kind", "status"], _count: true }),
    db.game.count({ where: { teacherId: teacher.id, status: { not: "ARCHIVED" }, templateKey: { not: "FLASHCARDS" } } }),
    db.libraryResource.findMany({ orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, title: true, kind: true, status: true, updatedAt: true } }),
  ]);
  const count = (kind: string, status: string) => byKind.filter((r) => displayKind(r.kind) === kind && r.status === status).reduce((n, r) => n + r._count, 0);
  return (
    <>
      <PageTitle
        title="Content Library"
        subtitle="Every resource is uploaded once and can be used in many topics. Assignments keep the version they were given."
        action={<Link href="/admin/content/new" className="ws-btn ws-btn-primary ws-btn-lg"><WsIcon name="plus" /> Add content</Link>}
      />
      <ul className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="library-categories">
        {CATEGORIES.map((c) => {
          const href = c.kind === "SPEAKING" ? "/teacher/my-activities" : `/admin/content?kind=${c.kind}`;
          return (
            <li key={c.kind}>
              <Link href={href} className="ws-card flex h-full items-start gap-4 p-5 transition-colors hover:border-[#2563EB]" data-testid="library-category">
                <Kind3D kind={c.kind} className="h-14 w-14 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-display text-xl font-extrabold">{KIND_ACCESS_LABEL[c.kind] === "Music" ? "Music Videos" : KIND_ACCESS_LABEL[c.kind]}</span>
                  <span className="mt-0.5 block text-[15px] text-[#5B6577]">{c.blurb}</span>
                  <span className="mt-2 block text-[15px] font-bold text-[#3D4759]">
                    {c.kind === "SPEAKING" ? `${speaking} in My Activities` : `${count(c.kind, "PUBLISHED")} published · ${count(c.kind, "DRAFT")} drafts`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Card title="Recently edited" action={<Link href="/admin/content" className="ws-link inline-flex min-h-11 items-center gap-1">All resources <WsIcon name="arrowRight" className="h-5 w-5" /></Link>}>
        <ul className="divide-y divide-[#E2E6EC]">
          {recent.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
              <Kind3D kind={r.kind} className="h-8 w-8" />
              <Link href={`/admin/content/${r.id}`} className="min-w-0 flex-1 font-bold hover:underline [overflow-wrap:anywhere]">{r.title}</Link>
              <span className={`ws-pill ${r.status === "PUBLISHED" ? "ws-pill-published" : r.status === "DRAFT" ? "ws-pill-draft" : "ws-pill-archived"}`}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</span>
              <span className="text-sm text-[#5B6577]"><LocalTime iso={r.updatedAt.toISOString()} mode="day" /></span>
            </li>
          ))}
          {recent.length === 0 && <li className="py-3 text-[#5B6577]">No resources yet.</li>}
        </ul>
      </Card>
    </>
  );
}
