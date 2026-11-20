import Link from "next/link";
import { GradeForm } from "@/components/admin/GradeForm";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { LocalTime } from "@/components/dashboard/LocalTime";
import { getSettings } from "@/lib/settings";
import { Card, PageTitle } from "@/components/dashboard/DashBits";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { sttProvider } from "@/lib/stt";
import { ttsProvider } from "@/lib/tts";
import { LANGUAGE_LABEL, TOPIC_LANGUAGES } from "@/lib/library/topicMeta";

export const metadata = { title: "Settings" };

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <span className="font-semibold">{children}</span>
      <span className={`ws-pill ${ok ? "ws-pill-published" : "ws-pill-archived"}`}>{ok ? "Configured" : "Not configured"}</span>
    </li>
  );
}

// Platform Admin › Settings: general platform options (sign-up, notice, defaults), the classification teachers and admins use everywhere (grades,
// languages, categories) and the state of the platform services. Service keys live in the
// environment (Vercel), never in the database; this page only shows whether each one is set.
export default async function AdminSettings() {
  await requireAdminPage();
  const [grades, categories, langs, settings] = await Promise.all([
    db.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { topics: true } } } }),
    db.topic.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } }),
    db.topic.groupBy({ by: ["language"], _count: true }),
    getSettings(),
  ]);
  const tts = ttsProvider();
  const stt = sttProvider();
  return (
    <>
      <PageTitle title="Settings" subtitle="Platform options, the classification used by topics and the status of the platform services." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="General" className="xl:col-span-2" testId="settings-general">
          {settings.updatedAt && <p className="-mt-2 mb-4 text-sm text-[#5B6577]">Last changed <LocalTime iso={settings.updatedAt.toISOString()} />.</p>}
          <SettingsForm settings={settings} />
        </Card>
        <Card title="Grades" testId="settings-grades">
          <p className="-mt-2 mb-4 text-[15px] text-[#5B6577]">Grades added here appear in the Grade selector of every topic and in the Topics filters.</p>
          <GradeForm />
          <ul className="mt-4 divide-y divide-[#E2E6EC]" data-testid="grade-list">
            {grades.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-bold [overflow-wrap:anywhere]">{g.name}</span>
                <Link href={`/admin/topics?gradeId=${g.id}`} className="ws-link whitespace-nowrap">{g._count.topics} topic{g._count.topics === 1 ? "" : "s"}</Link>
              </li>
            ))}
            {grades.length === 0 && <li className="py-3 text-[#5B6577]">No grades yet. Add one, for example Kindergarten or 1st Grade.</li>}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card title="Languages">
            <ul className="divide-y divide-[#E2E6EC]">
              {TOPIC_LANGUAGES.map((l) => (
                <li key={l} className="flex items-center justify-between py-3">
                  <span className="font-bold">{LANGUAGE_LABEL[l]}</span>
                  <Link href={`/admin/topics?language=${l}`} className="ws-link">{langs.find((x) => x.language === l)?._count ?? 0} topics</Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Categories">
            <p className="-mt-2 mb-3 text-[15px] text-[#5B6577]">Categories come from the topics. Type a new one in a topic to add it.</p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.category}><Link href={`/admin/topics?category=${encodeURIComponent(c.category)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E2E6EC] px-4 font-semibold hover:border-[#2563EB]">{c.category} <span className="text-sm text-[#5B6577]">{c._count}</span></Link></li>
              ))}
            </ul>
          </Card>
        </div>
        <Card title="Platform services" className="xl:col-span-2">
          <ul className="divide-y divide-[#E2E6EC]">
            <Status ok={!!tts}>Natural voices (text-to-speech){tts ? ` · ${tts}` : ""}</Status>
            <Status ok={!!stt && stt !== "scripted-test"}>Speech recognition{stt ? ` · ${stt}` : " · browser recognizer"}</Status>
            <Status ok={!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM}>Email (verification, invitations, password reset)</Status>
            <Status ok={process.env.STORAGE_DRIVER === "supabase"}>Private file storage (Supabase)</Status>
            <Status ok={!!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID}>Payments (Stripe)</Status>
          </ul>
          <p className="mt-3 text-[15px] text-[#5B6577]">Keys are set in the hosting environment, not here. Administrator access is given from Users &amp; Schools (or <code>npm run admin:grant</code>), only to verified emails.</p>
        </Card>
      </div>
    </>
  );
}
