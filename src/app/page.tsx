import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/shell/PublicHeader";
import { Art, Pinita } from "@/components/ui/Art";
import { ButtonLink } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user?.role === "STUDENT") redirect("/learn");
  if (user?.teacher) redirect("/teacher");
  const topics = await db.topic.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 6, select: { id: true, titleEn: true, titleEs: true, color: true, art: true } });

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-10">
          <div>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-teal">Spanish for kids · ages 6–12</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              Speak.
              <br />
              <span className="text-brand">Play.</span>
              <br />
              Learn.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
              LaxtroSpeak brings Spanish songs, videos, games, flashcards and printables to elementary classrooms. Teachers add their class, assign a topic in a few taps, and
              students open everything from their own portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Create a teacher account
              </ButtonLink>
              <ButtonLink href="/student" size="lg" variant="secondary">
                Student sign in
              </ButtonLink>
            </div>
          </div>
          <figure className="relative mx-auto w-full max-w-md">
            <div className="flex items-center gap-4 rounded-[28px] bg-card p-5 shadow-pop">
              <Pinita mood="cheer" className="h-28 w-28 shrink-0" />
              <p className="font-display text-2xl font-bold leading-tight">
                ¡Hola! Soy Piñita.
                <span className="mt-1 block text-base font-semibold text-ink-2">Hi! I’m Piñita. Let’s learn Spanish together!</span>
              </p>
            </div>
            {topics.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {topics.map((t) => (
                  <li key={t.id} className="flex flex-col items-center rounded-[22px] p-3 text-center shadow-pop" style={{ background: t.color }}>
                    <Art k={t.art} className="h-16 w-16" />
                    <span className="mt-1 font-display text-lg font-bold leading-none text-ink">{t.titleEs}</span>
                    <span className="text-xs font-bold text-ink/70">{t.titleEn}</span>
                  </li>
                ))}
              </ul>
            )}
          </figure>
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
            {[
              ["01", "Add your class", "Add students one by one or paste a list, make groups, and print sign-in cards. Students use a class code and a PIN or password."],
              ["02", "Assign a topic", "Pick a topic by grade, preview its song, video, games, flashcards and worksheets, and send the ones you want to a group or to individual students."],
              ["03", "Play and speak", "Students open their task, play, sing along and answer out loud in Spanish. You see who finished each activity."],
            ].map(([n, title, body]) => (
              <div key={n}>
                <p className="font-display text-sm font-semibold text-coral">{n}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="font-display text-2xl font-semibold">Built for classrooms</h2>
          <ul className="mt-6 grid gap-x-10 gap-y-4 text-ink-2 sm:grid-cols-2">
            <li><strong className="text-ink">Chromebook-first.</strong> Works in Chrome with large touch targets and a full-screen activity mode.</li>
            <li><strong className="text-ink">Respectful feedback.</strong> “¡Muy bien!”, “Escucha con atención” — never “Wrong!”.</li>
            <li><strong className="text-ink">Honest progress.</strong> Independent answers are kept apart from answers given after a hint or model.</li>
            <li><strong className="text-ink">Privacy by design.</strong> Students sign in with a class code and PIN. Voice recordings are not stored.</li>
          </ul>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <span>LaxtroSpeak · Speak &amp; Learn Spanish</span>
          <Link href="/privacy" className="font-semibold hover:text-ink">Privacy &amp; student data</Link>
        </div>
      </footer>
    </div>
  );
}
