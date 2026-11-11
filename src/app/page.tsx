import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/shell/PublicHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user?.role === "STUDENT") redirect("/learn");
  if (user?.teacher) redirect("/teacher");

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-12">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-aqua px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-dark">
              <Icon name="mic" size={14} />
              Interactive Spanish Learning for Kids
            </p>
            <h1 className="font-display text-[3.4rem] font-bold leading-[0.95] tracking-[-0.03em] text-ink sm:text-7xl">
              Speak.
              <br />
              <span className="tilde-underline text-indigo">Play.</span>
              <br />
              Learn.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-2">
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

        <section className="border-y-2 border-ink bg-card">
          <ol className="mx-auto grid max-w-6xl px-5 md:grid-cols-[1fr_1.15fr_1fr]">
            {[
              ["1", "Create", "Choose a template, add a picture, type the question with the built-in ñ, á, ¿ and ¡ bar, and generate natural Latin American Spanish audio.", "bg-sun"],
              ["2", "Assign", "Send it to a whole class, a level like LE2, a group, or one student. Students find it in their own portal.", "bg-aqua"],
              ["3", "Speak", "Students answer by voice. Answers are scored as correct, try again, or “I didn’t hear you” — silence is never counted as a mistake.", "bg-coral-soft"],
            ].map(([n, title, body, chip], i) => (
              <li key={n} className={`flex gap-4 py-9 md:px-8 ${i > 0 ? "border-t border-line md:border-l md:border-t-0" : "md:pl-0"} ${i === 2 ? "md:pr-0" : ""}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-xl font-bold text-ink ${chip}`}>{n}</span>
                <div>
                  <h2 className="font-display text-2xl font-bold">{title}</h2>
                  <p className="mt-1.5 leading-relaxed text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.6fr]">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">
              Built for <span className="tilde-underline">classrooms</span>
            </h2>
            <p className="mt-3 text-muted">Designed with teachers of 6 to 12 year-olds, for real school devices.</p>
          </div>
          <ul className="grid gap-x-10 gap-y-6 text-ink-2 sm:grid-cols-2">
            {[
              ["Chromebook-first.", "Works in Chrome with large touch targets and a full-screen activity mode."],
              ["Respectful feedback.", "“¡Muy bien!”, “Escucha con atención” — never “Wrong!”."],
              ["Honest progress.", "Independent answers are kept apart from answers given after a hint or model."],
              ["Privacy by design.", "Students sign in with a class code and PIN. Voice recordings are not stored."],
            ].map(([t, b]) => (
              <li key={t} className="border-t-2 border-ink pt-3">
                <strong className="block font-display text-lg text-ink">{t}</strong> {b}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><LogoMark size={22} /> Speak &amp; Learn Spanish</span>
          <Link href="/privacy" className="font-semibold underline-offset-4 hover:text-ink hover:underline">Privacy &amp; student data</Link>
        </div>
      </footer>
    </div>
  );
}

function ActivityIllustration() {
  return (
    <figure aria-label="An example activity: a picture of a dog with the question ¿Qué animal es?" className="relative mx-auto w-full max-w-md pb-6">
      {/* A second card peeking out behind: the next question in the stack. */}
      <div aria-hidden="true" className="absolute inset-x-6 top-4 bottom-10 rotate-[4deg] rounded-2xl border-2 border-ink bg-aqua" />
      <div className="relative -rotate-1 rounded-2xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_var(--color-ink)]">
        <div className="flex items-center justify-between text-xs font-bold text-muted">
          <span className="uppercase tracking-[0.14em]">Los animales</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-6 rounded-full bg-indigo" />
            <span className="h-1.5 w-6 rounded-full bg-indigo" />
            <span className="h-1.5 w-6 rounded-full bg-line" />
            <span className="h-1.5 w-6 rounded-full bg-line" />
          </span>
        </div>
        <div className="mt-3 grid aspect-[4/3] place-items-center rounded-xl bg-sun-soft">
          <svg viewBox="0 0 200 150" className="h-4/5" aria-hidden="true">
            <g stroke="#24283b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M40 134c30-5 90-5 122 0" fill="none" />
              <path d="M60 128c-3-26 12-46 40-47 29 0 44 20 41 47z" fill="#e3a868" />
              <path d="M100 30c-20 0-33 15-33 33 0 19 15 31 33 31s33-12 33-31c0-18-13-33-33-33z" fill="#efbd83" />
              <path d="M72 40c-14 2-20 22-13 37 8-1 14-14 15-30zM128 40c14 2 20 22 13 37-8-1-14-14-15-30z" fill="#9b6436" />
              <path d="M93 76c4 5 10 5 14 0" fill="none" />
              <path d="M118 120c10-10 22-8 24-18" fill="none" />
            </g>
            <circle cx="89" cy="59" r="4" fill="#24283b" />
            <circle cx="111" cy="59" r="4" fill="#24283b" />
            <ellipse cx="100" cy="69" rx="7" ry="5" fill="#24283b" />
            <path d="M150 34l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#f3c55d" stroke="#24283b" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-4 text-center font-display text-3xl font-bold tracking-tight">¿Qué animal es?</p>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border-[1.5px] border-teal/40 bg-teal-soft py-2.5 text-sm font-bold text-teal-dark">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-50 motion-reduce:hidden" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
          </span>
          Te escucho…
        </div>
      </div>
      <div className="absolute -left-2 bottom-0 flex -rotate-3 items-center gap-2 rounded-xl border-2 border-ink bg-leaf px-4 py-2 font-display text-lg font-bold text-white shadow-[3px_3px_0_var(--color-ink)]">
        <Icon name="check" size={20} strokeWidth={3} />
        ¡Muy bien!
      </div>
    </figure>
  );
}
