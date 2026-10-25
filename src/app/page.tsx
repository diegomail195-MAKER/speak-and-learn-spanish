import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/shell/PublicHeader";
import { ButtonLink } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user?.role === "STUDENT") redirect("/learn");
  if (user?.teacher) redirect("/teacher");

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-12">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-teal">Interactive Spanish Learning for Kids</p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              Speak.
              <br />
              <span className="text-coral">Play.</span>
              <br />
              Learn.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
              Speak &amp; Learn Spanish lets elementary teachers build voice-first games in minutes. Students see a picture, hear a question and
              answer out loud in Spanish — the microphone stays ready, so they never have to click to talk.
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
          <ActivityIllustration />
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
            {[
              ["01", "Create", "Choose a template, add a picture, type the question with the built-in ñ, á, ¿ and ¡ bar, and generate natural Latin American Spanish audio."],
              ["02", "Assign", "Send it to a whole class, a level like LE2, a group, or one student. Students find it in their own portal."],
              ["03", "Speak", "Students answer by voice. Answers are scored as correct, try again, or “I didn’t hear you” — silence is never counted as a mistake."],
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
          <span>Speak &amp; Learn Spanish</span>
          <Link href="/privacy" className="font-semibold hover:text-ink">Privacy &amp; student data</Link>
        </div>
      </footer>
    </div>
  );
}

function ActivityIllustration() {
  return (
    <figure aria-label="An example activity: a picture of a dog with the question ¿Qué animal es?" className="relative mx-auto w-full max-w-md">
      <div className="rotate-[1.5deg] rounded-[2rem] border border-line bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between text-xs font-bold text-muted">
          <span>Los animales</span>
          <span>2 / 6</span>
        </div>
        <div className="mt-3 grid aspect-[4/3] place-items-center rounded-2xl bg-sun-soft">
          <svg viewBox="0 0 200 150" className="h-4/5" aria-hidden="true">
            <ellipse cx="100" cy="132" rx="60" ry="8" fill="#e9d9b3" />
            <path d="M58 98c0-22 18-38 42-38s42 16 42 38v20c0 6-5 10-10 10H68c-5 0-10-4-10-10z" fill="#c98b4a" />
            <circle cx="100" cy="62" r="30" fill="#d9a066" />
            <path d="M72 44c-12 4-16 22-10 34 6-2 12-14 14-28zM128 44c12 4 16 22 10 34-6-2-12-14-14-28z" fill="#8a5a2b" />
            <circle cx="90" cy="60" r="4" fill="#1e2340" />
            <circle cx="110" cy="60" r="4" fill="#1e2340" />
            <ellipse cx="100" cy="72" rx="7" ry="5" fill="#1e2340" />
            <path d="M94 80c3 4 9 4 12 0" stroke="#1e2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-center font-display text-2xl font-semibold">¿Qué animal es?</p>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-full bg-teal-soft py-2.5 text-sm font-bold text-teal-dark">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
          </span>
          Te escucho…
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 -rotate-3 rounded-2xl bg-leaf px-4 py-2 font-display text-lg font-semibold text-white shadow-soft">
        ¡Muy bien!
      </div>
    </figure>
  );
}
