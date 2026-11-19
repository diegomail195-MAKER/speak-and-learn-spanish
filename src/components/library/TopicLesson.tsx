"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GamePlayer } from "@/components/player/GamePlayer";
import { StudentPlay } from "@/components/player/StudentPlay";
import { Art, Pinita } from "@/components/ui/Art";
import { recordActivityProgress } from "@/lib/actions/tasks";
import { libraryFileUrl, youtubeIdFrom } from "@/lib/library/types";
import { LESSON, lessonClipKey, spokenTitle, stepLine, type Line } from "@/lib/library/lesson";
import type { LessonStep } from "@/lib/library/lessonData";
import { ResourcePlayer, speak } from "./Players";
import { KIND_ICON_3D } from "@/lib/library/kindIcons";

// The guided Topic lesson: each step is presented (Spanish, then English, with the natural voices
// and on screen), the student presses Start, plays the real activity, and Next Activity unlocks
// only when it is finished. The last step leads to the final screen (practice again, next
// assignment, My Assignments). Student View runs the same lesson and records nothing.

const ICON = KIND_ICON_3D;
const LABEL: Record<string, { es: string; en: string }> = {
  VIDEO: { es: "Video", en: "Video" },
  SONG: { es: "Video musical", en: "Music video" },
  GAME: { es: "Juego", en: "Game" },
  FLASHCARDS: { es: "Tarjetas", en: "Flashcards" },
  SPEAKING: { es: "Hablar", en: "Speaking" },
  PRINTABLE: { es: "Hoja de trabajo", en: "Worksheet" },
  WORKSHEET: { es: "Hoja de trabajo", en: "Worksheet" },
  LISTENING: { es: "Escuchar", en: "Listening" },
};
const PURPLE = "#620D78";
const VOICE_PREF = "lextro-lesson-voice";

type Phase = { t: "intro"; i: number } | { t: "play"; i: number; practice: boolean } | { t: "final" } | { t: "menu" };

export interface TopicLessonProps {
  mode: "student" | "preview";
  /** The lesson's real title, as the teacher wrote it. */
  title: string;
  topic: { art: string; color: string };
  steps: LessonStep[];
  assignmentId?: string;
  /** Where the page itself lives (the game's "Done" button comes back here). */
  lessonHref: string;
  /** Student: the next assignment, or null when there is none. */
  nextHref: string | null;
  /** My Assignments (student) or the Library (Student View). */
  exitHref: string;
}

function KindIcon({ kind, size = "h-24 w-24" }: { kind: string; size?: string }) {
  return ICON[kind] ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ICON[kind]} alt="" width={160} height={160} className={`${size} object-contain`} />
  ) : (
    <span className={`grid ${size} place-items-center rounded-3xl bg-[#FFF3CC] text-5xl`} aria-hidden>🖨️</span>
  );
}

/** Videos and music videos: the video's picture (YouTube thumbnail or a frame of the file) and its title, as on the Topic page. */
function MediaThumb({ step, kindLabel }: { step: LessonStep; kindLabel: string }) {
  const c = (step.content ?? {}) as { file?: { fileId?: string; mime?: string } | null; youtubeId?: string | null; link?: { url?: string } | null };
  const yt = c.youtubeId || (c.link?.url ? youtubeIdFrom(c.link.url) : null);
  const file = step.kind === "VIDEO" && c.file?.fileId ? libraryFileUrl(c.file.fileId) : null;
  return (
    <figure className="w-full max-w-md overflow-hidden rounded-[22px] border-[6px] shadow-[0_14px_30px_-16px_rgba(98,13,120,.7)]" style={{ borderColor: PURPLE, background: PURPLE }} data-testid="lesson-thumb">
      <div className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-[#FFF3CC]">
        {yt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : file ? (
          <video src={`${file}#t=1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full bg-[#2a0634] object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            <KindIcon kind={step.kind} size="h-28 w-28" />
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-white text-white shadow-lg" style={{ background: PURPLE }}>
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
      </div>
      <figcaption className="px-4 pb-2 pt-3 text-center text-white">
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="lesson-step-title">{step.title}</h1>
        <span className="text-sm font-semibold text-white/80">{kindLabel}</span>
      </figcaption>
    </figure>
  );
}

/** The lesson voice: natural clips (Spanish voice, then English), the device voice if a clip is missing. */
function useLessonVoice(title: string) {
  const [clips, setClips] = useState<Record<string, string> | null>(null);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const token = useRef(0);

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(VOICE_PREF) === "off");
    } catch {
      // private mode: the voice stays on
    }
    let live = true;
    fetch("/api/lessons/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: spokenTitle(title).slice(0, 120) }) })
      .then((r) => (r.ok ? r.json() : { clips: {} }))
      .then((j) => live && setClips(j.clips ?? {}))
      .catch(() => live && setClips({}));
    return () => {
      live = false;
    };
  }, [title]);

  const stop = useCallback(() => {
    token.current++;
    audio.current?.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const playOne = useCallback(
    (text: string, language: "es-419" | "en-US", t: number) =>
      new Promise<void>((resolve) => {
        if (t !== token.current) return resolve();
        const url = clips?.[lessonClipKey(language, text)];
        if (!url) return speak(text, language === "es-419" ? "es-MX" : "en-US", () => resolve());
        const a = audio.current ?? (audio.current = new Audio());
        a.src = url;
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch((e: unknown) => {
          if ((e as { name?: string })?.name === "NotAllowedError") setBlocked(true);
          resolve();
        });
      }),
    [clips],
  );

  const say = useCallback(
    async (lines: Line[], force = false) => {
      stop();
      if (muted && !force) return;
      const t = token.current;
      setBlocked(false);
      setSpeaking(true);
      for (const l of lines) {
        await playOne(l.es, "es-419", t);
        if (t !== token.current) return;
        await playOne(l.en, "en-US", t);
        if (t !== token.current) return;
      }
      setSpeaking(false);
    },
    [muted, playOne, stop],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      try {
        localStorage.setItem(VOICE_PREF, m ? "on" : "off");
      } catch {
        // ignore
      }
      return !m;
    });
    stop();
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { ready: clips !== null, say, stop, muted, toggleMute, blocked, speaking };
}

export function TopicLesson({ mode, title, topic, steps, assignmentId, lessonHref, nextHref, exitHref }: TopicLessonProps) {
  const storageKey = `lesson:${mode}:${assignmentId ?? lessonHref}`;
  const firstUndone = steps.findIndex((s) => !s.done);
  const [phase, setPhase] = useState<Phase>(() => (steps.length === 0 ? { t: "final" } : firstUndone < 0 ? { t: "final" } : { t: "intro", i: firstUndone }));
  const [completed, setCompleted] = useState<Set<number>>(() => new Set(steps.flatMap((s, i) => (s.done ? [i] : []))));
  const [run, setRun] = useState(0);
  const [note, setNote] = useState("");
  const sent = useRef(new Set<string>());
  const voice = useLessonVoice(title);
  const total = steps.length;

  // Student View resumes where the teacher was (nothing is saved on the server).
  useEffect(() => {
    if (mode !== "preview") return;
    try {
      const i = Number(sessionStorage.getItem(storageKey));
      if (Number.isInteger(i) && i > 0 && i < total) {
        setPhase({ t: "intro", i });
        setCompleted(new Set(Array.from({ length: i }, (_, k) => k)));
      }
    } catch {
      // ignore
    }
  }, [mode, storageKey, total]);
  useEffect(() => {
    if (mode !== "preview") return;
    try {
      if (phase.t === "intro") sessionStorage.setItem(storageKey, String(phase.i));
      if (phase.t === "final") sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [mode, phase, storageKey]);

  const introLines = useCallback(
    (i: number): Line[] => {
      const kindLine = stepLine(steps[i].kind);
      if (i === 0) return kindLine === LESSON.next ? [LESSON.start(spokenTitle(title))] : [LESSON.start(spokenTitle(title)), kindLine];
      return [kindLine];
    },
    [steps, title],
  );
  const finalLine = nextHref || mode === "preview" ? LESSON.final : LESSON.finalLast;

  // Each presentation speaks once, when it appears (and again with "Listen again").
  const phaseKey = phase.t === "intro" ? `intro-${phase.i}` : phase.t;
  useEffect(() => {
    if (!voice.ready) return;
    if (phase.t === "intro") void voice.say(introLines(phase.i));
    else if (phase.t === "final") void voice.say([finalLine]);
    else voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, voice.ready]);

  // Student: a finished step is saved before Next unlocks (the server only opens the next step
  // once this one is recorded). Up to 3 tries, then "Retry".
  const [saveState, setSaveState] = useState<Record<number, "saving" | "error">>({});
  const save = useCallback(
    async (i: number, score: number, max: number) => {
      const step = steps[i];
      setSaveState((s) => ({ ...s, [i]: "saving" }));
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await recordActivityProgress({ assignmentId: assignmentId!, activityId: step.id, score: Math.min(score, 1000), total: Math.min(max, 1000) });
          setSaveState(({ [i]: _, ...rest }) => rest);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      sent.current.delete(step.id);
      setSaveState((s) => ({ ...s, [i]: "error" }));
    },
    [assignmentId, steps],
  );
  const lastScore = useRef<Record<number, [number, number]>>({});
  const complete = useCallback(
    (i: number, score = 1, max = 1, practice = false) => {
      setCompleted((c) => (c.has(i) ? c : new Set(c).add(i)));
      const step = steps[i];
      if (mode !== "student" || practice || !assignmentId || sent.current.has(step.id) || step.done) return;
      sent.current.add(step.id);
      lastScore.current[i] = [score, max];
      void save(i, score, max);
    },
    [assignmentId, mode, steps, save],
  );
  const retrySave = (i: number) => {
    const [score, max] = lastScore.current[i] ?? [1, 1];
    sent.current.add(steps[i].id);
    void save(i, score, max);
  };

  const start = (i: number, practice = false) => {
    voice.stop(); // the voice never plays over the video or the microphone
    setRun((r) => r + 1);
    setPhase({ t: "play", i, practice });
  };
  const next = (i: number) => {
    voice.stop();
    setPhase(i + 1 < total ? { t: "intro", i: i + 1 } : { t: "final" });
    window.scrollTo({ top: 0 });
  };
  const previewOnly = (what: string) => setNote(`Student View: here the student would go to ${what}.`);

  const progress = (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Lesson steps">
      {steps.map((s, i) => {
        const cur = (phase.t === "intro" || phase.t === "play") && phase.i === i;
        return (
          <li key={s.id} className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${cur ? "w-8" : "w-2.5"}`} style={{ background: completed.has(i) ? "#4CAF50" : cur ? PURPLE : "rgba(98,13,120,.2)" }} aria-label={`${i + 1}. ${s.title}${completed.has(i) ? " ✓" : ""}`} aria-current={cur ? "step" : undefined} />
        );
      })}
    </ol>
  );

  const voiceButtons = (lines: Line[]) => (
    <span className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => void voice.say(lines, true)} data-testid="lesson-replay" className={`inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 font-bold text-[#620D78] ring-2 ${voice.blocked ? "animate-pulse ring-[#FF5148]" : "ring-[#620D78]/20"} hover:bg-[#F3E8F7]`}>
        <span aria-hidden>🔊</span> Escuchar otra vez · Listen again
      </button>
      <button type="button" onClick={voice.toggleMute} aria-pressed={voice.muted} data-testid="lesson-mute" className="inline-flex h-11 items-center rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-white/60">
        {voice.muted ? "🔇 Voz apagada · Voice off" : "🔈 Voz encendida · Voice on"}
      </button>
    </span>
  );

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <Art k={topic.art} className="h-12 w-12 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-display text-2xl font-extrabold leading-tight" data-testid="lesson-title">{title}</span>
          {progress}
        </span>
      </span>
      {mode === "student" && (
        <Link href={exitHref} onClick={voice.stop} className="rounded-full px-3 py-2 text-sm font-bold text-sky hover:underline" data-testid="lesson-exit">
          ‹ Mis tareas · My Assignments
        </Link>
      )}
    </div>
  );

  if (phase.t === "intro") {
    const s = steps[phase.i];
    const lines = introLines(phase.i);
    const label = LABEL[s.kind] ?? { es: s.kind, en: s.kind };
    return (
      <div data-testid="topic-lesson" data-phase="intro" data-step={phase.i}>
        {header}
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-[32px] p-6 text-center shadow-pop sm:p-10" style={{ background: topic.color || "#FFC928" }} data-testid="lesson-intro">
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold" style={{ color: PURPLE }} data-testid="lesson-step-count">
            Paso {phase.i + 1} de {total} · Step {phase.i + 1} of {total}
          </span>
          {s.kind === "VIDEO" || s.kind === "SONG" ? (
            <MediaThumb step={s} kindLabel={label.es === label.en ? label.es : `${label.es} · ${label.en}`} />
          ) : (
            <>
              <KindIcon kind={s.kind} />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-ink/70">{label.es === label.en ? label.es : `${label.es} · ${label.en}`}</span>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl" data-testid="lesson-step-title">{s.title}</h1>
            </>
          )}
          <div className="w-full rounded-2xl bg-white/85 px-5 py-4" data-testid="lesson-line" aria-live="polite">
            {lines.map((l) => (
              <p key={l.es} className="mb-1 last:mb-0">
                <span className="block font-display text-xl font-extrabold text-ink" lang="es">{l.es}</span>
                <span className="block text-base font-semibold text-ink-2" lang="en">{l.en}</span>
              </p>
            ))}
          </div>
          {voiceButtons(lines)}
          <button type="button" onClick={() => start(phase.i)} data-testid="lesson-start" className="mt-2 inline-flex h-14 items-center rounded-full px-10 text-xl font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.25)] active:translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF5148]" style={{ background: PURPLE }}>
            Iniciar · Start
          </button>
        </section>
      </div>
    );
  }

  if (phase.t === "play") {
    const { i, practice } = phase;
    const s = steps[i];
    const saving = !practice && saveState[i];
    const ready = practice || (completed.has(i) && !saving);
    const onDone = (score: number, max: number) => complete(i, score, max, practice);
    let player;
    if (s.game) {
      player =
        mode === "student" && !practice && assignmentId ? (
          <StudentPlay key={`${i}-${run}`} game={s.game} assignmentId={assignmentId} videoId={null} activityId={s.id} done={s.doneQuestions ?? {}} exitHref={lessonHref} onComplete={() => complete(i)} />
        ) : (
          <GamePlayer key={`${i}-${run}`} game={s.game} mode="preview" previewNote={null} onFinish={() => complete(i, 1, 1, practice)} exitHref={lessonHref} />
        );
    } else if (s.content) {
      player = <ResourcePlayer key={`${i}-${run}`} kind={s.kind as never} content={s.content} title={s.title} onDone={onDone} focus />;
    }
    return (
      <div data-testid="topic-lesson" data-phase="play" data-step={i}>
        {header}
        <p className="mb-2 text-sm font-extrabold" style={{ color: PURPLE }}>
          {practice ? "Practicar otra vez · Practice again" : `Paso ${i + 1} de ${total} · Step ${i + 1} of ${total}`}
        </p>
        <h1 className="mb-4 font-display text-3xl font-extrabold">{s.title}</h1>
        <div data-testid="lesson-activity">{player}</div>
        <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-white/90 p-2 text-center shadow-pop backdrop-blur">
          {practice ? (
            <button type="button" onClick={() => setPhase({ t: "menu" })} data-testid="lesson-back-menu" className="inline-flex h-12 items-center rounded-full px-6 font-extrabold text-white" style={{ background: PURPLE }}>
              ‹ Volver al menú · Back to menu
            </button>
          ) : (
            <>
              {saving === "saving" && <span role="status" className="px-3 text-sm font-bold text-ink-2" data-testid="lesson-saving">Guardando… · Saving…</span>}
              {saving === "error" && (
                <span role="alert" className="flex items-center gap-2 px-3 text-sm font-bold text-[#B42318]" data-testid="lesson-save-error">
                  No se pudo guardar · Couldn&apos;t save
                  <button type="button" onClick={() => retrySave(i)} className="inline-flex h-11 items-center rounded-full px-4 font-bold text-white" style={{ background: PURPLE }} data-testid="lesson-save-retry">Reintentar · Retry</button>
                </span>
              )}
              {!ready && !saving && <span className="px-3 text-sm font-bold text-ink-2" data-testid="lesson-next-hint">Termina la actividad para seguir · Finish the activity to continue</span>}
              <button type="button" onClick={() => next(i)} disabled={!ready} data-testid="lesson-next" className="inline-flex h-12 items-center rounded-full px-6 font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40" style={{ background: ready ? "#FF5148" : PURPLE }}>
                {i + 1 < total ? "Siguiente actividad · Next Activity →" : "Terminar · Finish →"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase.t === "menu") {
    return (
      <div data-testid="topic-lesson" data-phase="menu">
        {header}
        <section className="mx-auto max-w-2xl rounded-[32px] bg-card p-6 shadow-pop">
          <h1 className="font-display text-3xl font-extrabold">Practicar otra vez · Practice again</h1>
          <p className="mb-4 text-ink-2">Elige una actividad. · Choose an activity. Your lesson stays completed.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {steps.map((s, i) =>
              completed.has(i) ? (
                <li key={s.id}>
                  <button type="button" onClick={() => start(i, true)} data-testid="practice-item" className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#620D78]/10 bg-white p-3 text-left hover:border-[#620D78]">
                    <KindIcon kind={s.kind} size="h-12 w-12" />
                    <span className="min-w-0 flex-1 font-display font-extrabold">{s.title}</span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPhase({ t: "final" })} className="inline-flex h-11 items-center rounded-full px-5 font-bold ring-1 ring-line hover:bg-paper-2">‹ Volver · Back</button>
            <MyAssignments mode={mode} exitHref={exitHref} onPreview={previewOnly} primary={false} />
          </div>
          {note && <p className="mt-3 text-sm font-bold text-sky" role="status">{note}</p>}
        </section>
      </div>
    );
  }

  // Final screen.
  return (
    <div data-testid="topic-lesson" data-phase="final">
      {header}
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-[32px] p-6 text-center shadow-pop sm:p-10" style={{ background: topic.color || "#FFC928" }} data-testid="lesson-final">
        <Pinita mood="happy" className="h-24 w-24" />
        <h1 className="font-display text-3xl font-extrabold">¡Terminaste la lección! · You finished the lesson!</h1>
        <div className="w-full rounded-2xl bg-white/85 px-5 py-4" data-testid="lesson-line">
          <span className="block font-display text-xl font-extrabold" lang="es">{finalLine.es}</span>
          <span className="block font-semibold text-ink-2" lang="en">{finalLine.en}</span>
        </div>
        {voiceButtons([finalLine])}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setPhase({ t: "menu" })} data-testid="lesson-practice" className="inline-flex h-12 items-center rounded-full bg-white px-6 font-extrabold ring-2 ring-[#620D78]/30" style={{ color: PURPLE }}>
            Practicar otra vez · Practice Again
          </button>
          {mode === "preview" ? (
            <button type="button" onClick={() => previewOnly("their next assignment")} data-testid="lesson-next-assignment" className="inline-flex h-12 items-center rounded-full px-6 font-extrabold text-white" style={{ background: PURPLE }}>
              Siguiente tarea · Next Assignment
            </button>
          ) : (
            nextHref && (
              <Link href={nextHref} onClick={voice.stop} data-testid="lesson-next-assignment" className="inline-flex h-12 items-center rounded-full px-6 font-extrabold text-white" style={{ background: PURPLE }}>
                Siguiente tarea · Next Assignment
              </Link>
            )
          )}
          <MyAssignments mode={mode} exitHref={exitHref} onPreview={previewOnly} primary={mode === "student" && !nextHref} />
        </div>
        {note && <p className="text-sm font-bold text-ink" role="status" data-testid="lesson-preview-note">{note}</p>}
      </section>
    </div>
  );
}

function MyAssignments({ mode, exitHref, onPreview, primary }: { mode: "student" | "preview"; exitHref: string; onPreview: (what: string) => void; primary: boolean }) {
  const cls = `inline-flex h-12 items-center rounded-full px-6 font-extrabold ${primary ? "text-white" : "bg-white ring-1 ring-line text-ink"}`;
  const style = primary ? { background: PURPLE } : undefined;
  if (mode === "preview")
    return (
      <button type="button" onClick={() => onPreview("My Assignments")} data-testid="lesson-my-assignments" className={cls} style={style}>
        Mis tareas · My Assignments
      </button>
    );
  return (
    <Link href={exitHref} data-testid="lesson-my-assignments" className={cls} style={style}>
      Mis tareas · My Assignments
    </Link>
  );
}
