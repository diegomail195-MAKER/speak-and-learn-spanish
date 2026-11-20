"use client";

import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GamePlayer } from "@/components/player/GamePlayer";
import { Art } from "@/components/ui/Art";
import { LESSON, spokenTitle, stepLine, type Line } from "@/lib/library/lesson";
import type { LessonStep } from "@/lib/library/lessonData";
import type { PreviewOutlineStep, PreviewScope } from "@/lib/library/previewData";
import { KindIcon, LABEL, MediaThumb, PURPLE, useLessonVoice } from "./TopicLesson";
import { ResourcePlayer } from "./Players";

// Preview · Admin / Teacher: the whole topic with free navigation. Every resource in the saved
// order, Previous / Next at the sides of the panel (below it on phones), a list of the topic's
// resources to jump anywhere, and the real activity players. It is a test session: activities can
// be restarted and nothing is recorded (no attempts, scores, progress or completion). Each
// resource is loaded from the preview API, which checks access again; one that fails shows an
// error with "Retry" and the others keep working.

type Loaded = { status: "loading" } | { status: "ok"; step: LessonStep } | { status: "error"; message: string };
type View = { t: "list" } | { t: "step"; i: number; started: boolean };

export interface TopicPreviewProps {
  scope: PreviewScope;
  topicId: string;
  grade: "LOWER" | "UPPER" | null;
  title: string;
  topic: { art: string; color: string };
  steps: PreviewOutlineStep[];
  /** Index from ?step= (1-based on the URL, 0-based here). */
  initialIndex: number | null;
  exitHref: string;
  /** Shown under the header (e.g. how many resources are drafts). */
  note?: string;
}

/** Catches a player that crashes while rendering, so the rest of the preview keeps working. */
class PlayerBoundary extends Component<{ onRetry: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <LoadError
          message="This activity stopped working."
          onRetry={() => {
            this.setState({ failed: false });
            this.props.onRetry();
          }}
        />
      );
    return this.props.children;
  }
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-[22px] bg-white p-6 text-center" data-testid="preview-error">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <p className="font-display text-xl font-extrabold text-ink">No se pudo cargar este recurso · This resource couldn&apos;t load</p>
      <p className="text-sm font-semibold text-ink-2">{message} You can retry or keep inspecting the other resources.</p>
      <button type="button" onClick={onRetry} data-testid="preview-retry" className="inline-flex h-11 items-center rounded-full px-6 font-extrabold text-white" style={{ background: PURPLE }}>
        Reintentar · Retry
      </button>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth={3} aria-hidden>
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavButton({ dir, disabled, onClick, compact = false }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; compact?: boolean }) {
  const label = dir === "prev" ? "Anterior · Previous" : "Siguiente · Next";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`preview-${dir}${compact ? "-mobile" : ""}`}
      aria-label={dir === "prev" ? "Previous resource" : "Next resource"}
      className={`group flex items-center gap-2 font-display font-extrabold disabled:cursor-not-allowed disabled:opacity-35 ${compact ? "flex-1 justify-center rounded-full bg-white py-2 ring-2 ring-[#620D78]/20" : "flex-col"}`}
      style={{ color: PURPLE }}
    >
      <span className={`grid place-items-center rounded-full text-white shadow-[0_6px_14px_-6px_rgba(98,13,120,.7)] transition-transform group-enabled:group-hover:scale-105 group-enabled:group-active:scale-95 motion-reduce:transition-none ${compact ? "h-11 w-11" : "h-[72px] w-[72px]"}`} style={{ background: PURPLE }}>
        <Chevron dir={dir === "prev" ? "left" : "right"} />
      </span>
      <span className={compact ? "text-base" : "text-lg"}>{label}</span>
    </button>
  );
}

export function TopicPreview({ scope, topicId, grade, title, topic, steps, initialIndex, exitHref, note }: TopicPreviewProps) {
  const total = steps.length;
  const [view, setView] = useState<View>(() => (total === 0 ? { t: "list" } : { t: "step", i: initialIndex !== null && initialIndex >= 0 && initialIndex < total ? initialIndex : 0, started: false }));
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const [run, setRun] = useState(0);
  const [reached, setReached] = useState<Record<string, boolean>>({});
  const voice = useLessonVoice(title);
  const inflight = useRef(new Set<string>());

  const load = useCallback(
    async (key: string, force = false) => {
      if (inflight.current.has(key)) return;
      if (!force && loaded[key] && loaded[key].status !== "error") return;
      inflight.current.add(key);
      setLoaded((l) => ({ ...l, [key]: { status: "loading" } }));
      try {
        const qs = new URLSearchParams({ key, scope, ...(grade ? { grade } : {}) });
        const res = await fetch(`/api/topics/${topicId}/preview?${qs}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.step) throw new Error(json.error || `Error ${res.status}.`);
        setLoaded((l) => ({ ...l, [key]: { status: "ok", step: json.step as LessonStep } }));
      } catch (e) {
        setLoaded((l) => ({ ...l, [key]: { status: "error", message: e instanceof Error ? e.message : "Network error." } }));
      } finally {
        inflight.current.delete(key);
      }
    },
    [grade, loaded, scope, topicId],
  );

  const i = view.t === "step" ? view.i : -1;
  const current = i >= 0 ? steps[i] : null;
  // Stable, and a no-op once set: players call it from effects on every render.
  const currentKey = current?.key ?? "";
  const onReached = useCallback(() => setReached((r) => (r[currentKey] ? r : { ...r, [currentKey]: true })), [currentKey]);
  useEffect(() => {
    if (!current) return;
    void load(current.key);
    // Get the next resource ready too, so Next feels instant.
    if (i + 1 < total) void load(steps[i + 1].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key]);

  // The position stays on the URL (?step=3), so a reload or a shared link opens the same resource.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (i >= 0) url.searchParams.set("step", String(i + 1));
      else url.searchParams.delete("step");
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // ignore
    }
  }, [i]);

  const introLines = useCallback(
    (k: number): Line[] => {
      const kindLine = stepLine(steps[k].kind);
      if (k === 0) return kindLine === LESSON.next ? [LESSON.start(spokenTitle(title))] : [LESSON.start(spokenTitle(title)), kindLine];
      return [kindLine];
    },
    [steps, title],
  );
  const introKey = view.t === "step" && !view.started ? view.i : -1;
  useEffect(() => {
    if (!voice.ready) return;
    if (introKey >= 0) void voice.say(introLines(introKey));
    else voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introKey, voice.ready]);

  const go = (k: number) => {
    if (k < 0 || k >= total) return;
    voice.stop();
    setView({ t: "step", i: k, started: false });
    window.scrollTo({ top: 0 });
  };
  const start = () => {
    if (view.t !== "step") return;
    voice.stop();
    setRun((r) => r + 1);
    setView({ ...view, started: true });
  };
  const restart = () => {
    if (!current) return;
    setReached(({ [current.key]: _, ...rest }) => rest);
    setRun((r) => r + 1);
  };

  const strip = (
    <ol className="mt-1 flex flex-wrap items-center gap-1" aria-label="Topic resources">
      {steps.map((s, k) => {
        const cur = k === i;
        return (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => go(k)}
              aria-label={`${k + 1} of ${total}: ${s.title}`}
              aria-current={cur ? "step" : undefined}
              data-testid="preview-strip-item"
              className={`block h-2.5 rounded-full transition-all hover:opacity-80 motion-reduce:transition-none ${cur ? "w-8" : "w-2.5"}`}
              style={{ background: cur ? PURPLE : "rgba(98,13,120,.2)" }}
            />
          </li>
        );
      })}
    </ol>
  );

  const header = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3" data-testid="preview-header">
      <span className="flex min-w-0 items-center gap-3">
        <Art k={topic.art} className="h-12 w-12 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-display text-2xl font-extrabold leading-tight" data-testid="preview-title">{title}</span>
          {strip}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-11 items-center rounded-full border-2 bg-white px-4 font-display font-extrabold" style={{ borderColor: PURPLE, color: PURPLE }} data-testid="preview-badge">
          Preview · Admin / Teacher
        </span>
        <Link href={exitHref} onClick={voice.stop} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 font-display font-extrabold shadow-[0_4px_12px_-6px_rgba(23,32,51,.35)] hover:bg-[#F3E8F7]" style={{ color: PURPLE }} data-testid="preview-exit">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2.4} aria-hidden>
            <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8M10 12h11M17 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Salir · Exit
        </Link>
      </span>
    </div>
  );

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => { voice.stop(); setView({ t: "list" }); }} aria-pressed={view.t === "list"} data-testid="preview-list-button" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold ring-1 ring-[#620D78]/20 hover:bg-[#F3E8F7]" style={{ color: PURPLE }}>
        ☰ Recursos del Topic · Topic resources
      </button>
      {view.t === "step" && view.started && (
        <>
          <button type="button" onClick={() => setView({ ...view, started: false })} className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-extrabold ring-1 ring-[#620D78]/20 hover:bg-[#F3E8F7]" style={{ color: PURPLE }} data-testid="preview-back-intro">
            ‹ Presentación · Intro
          </button>
          <button type="button" onClick={restart} className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-extrabold ring-1 ring-[#620D78]/20 hover:bg-[#F3E8F7]" style={{ color: PURPLE }} data-testid="preview-restart">
            ↺ Reiniciar · Restart
          </button>
        </>
      )}
    </div>
  );

  let panel: ReactNode;
  if (view.t === "list" || !current) {
    panel = (
      <section className="rounded-[32px] p-5 shadow-pop sm:p-8" style={{ background: topic.color || "#FFC928" }} data-testid="preview-list">
        <h1 className="mb-1 text-center font-display text-3xl font-extrabold text-ink">Recursos del Topic · Topic resources</h1>
        <p className="mb-5 text-center font-semibold text-ink-2">{total === 0 ? "This topic has no resources yet." : `${total} resource${total === 1 ? "" : "s"} in the configured order. Choose one to open it.`}</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {steps.map((s, k) => {
            const label = LABEL[s.kind] ?? { es: s.kind, en: s.kind };
            return (
              <li key={s.key}>
                <button type="button" onClick={() => go(k)} data-testid="preview-list-item" className="flex w-full items-center gap-3 rounded-2xl bg-white/90 p-3 text-left ring-2 ring-transparent hover:ring-[#620D78] focus-visible:outline-none focus-visible:ring-[#620D78]">
                  <KindIcon kind={s.kind} size="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-ink-2">{k + 1} of {total} · {label.en}</span>
                    <span className="block truncate font-display text-lg font-extrabold text-ink">{s.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    );
  } else {
    const state = loaded[current.key] ?? { status: "loading" as const };
    const label = LABEL[current.kind] ?? { es: current.kind, en: current.kind };
    const kindLabel = label.es === label.en ? label.es : `${label.es} · ${label.en}`;
    const count = (
      <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold" style={{ color: PURPLE }} data-testid="preview-step-count">
        Paso {i + 1} de {total} · Step {i + 1} of {total}
      </span>
    );
    if (view.t === "step" && !view.started) {
      const lines = introLines(i);
      const step = state.status === "ok" ? state.step : ({ id: current.key, kind: current.kind, title: current.title, content: null, game: null, done: false } as LessonStep);
      panel = (
        <section className="flex flex-col items-center gap-4 rounded-[32px] p-6 text-center shadow-pop sm:p-10" style={{ background: topic.color || "#FFC928" }} data-testid="preview-intro" data-step={i}>
          {count}
          {current.kind === "VIDEO" || current.kind === "SONG" ? (
            <MediaThumb step={step} kindLabel={kindLabel} onPlay={start} />
          ) : (
            <>
              <KindIcon kind={current.kind} />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-ink/70">{kindLabel}</span>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl" data-testid="lesson-step-title">{current.title}</h1>
            </>
          )}
          <div className="w-full rounded-2xl bg-white/85 px-5 py-4">
            {lines.map((l) => (
              <p key={l.es} className="mb-1 last:mb-0">
                <span className="block font-display text-xl font-extrabold text-ink" lang="es">{l.es}</span>
                <span className="block text-base font-semibold text-ink-2" lang="en">{l.en}</span>
              </p>
            ))}
          </div>
          <span className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => void voice.say(lines, true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 font-bold ring-2 ring-[#620D78]/20 hover:bg-[#F3E8F7]" style={{ color: PURPLE }}>
              <span aria-hidden>🔊</span> Escuchar otra vez · Listen again
            </button>
            <button type="button" onClick={voice.toggleMute} aria-pressed={voice.muted} className="inline-flex h-11 items-center rounded-full px-3 text-sm font-bold text-ink-2 hover:bg-white/60">
              {voice.muted ? "🔇 Voz apagada · Voice off" : "🔈 Voz encendida · Voice on"}
            </button>
          </span>
          {state.status === "error" && <LoadError message={state.message} onRetry={() => void load(current.key, true)} />}
          <button type="button" onClick={start} disabled={state.status === "error"} data-testid="preview-start" className="mt-1 inline-flex h-14 items-center rounded-full px-10 text-xl font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,.25)] active:translate-y-0.5 disabled:opacity-40" style={{ background: PURPLE }}>
            Iniciar · Start
          </button>
        </section>
      );
    } else {
      let player: ReactNode;
      if (state.status === "loading") player = <p className="grid h-48 place-items-center rounded-[22px] bg-white font-bold text-ink-2" role="status" data-testid="preview-loading">Cargando… · Loading…</p>;
      else if (state.status === "error") player = <LoadError message={state.message} onRetry={() => void load(current.key, true)} />;
      else {
        const s = state.step;
        player = s.game ? (
          <GamePlayer key={`${current.key}-${run}`} game={s.game} mode="preview" previewNote={null} onFinish={onReached} exitHref={exitHref} />
        ) : s.content ? (
          <ResourcePlayer key={`${current.key}-${run}`} kind={s.kind as never} content={s.content} title={s.title} onDone={onReached} focus={false} autoPlay />
        ) : (
          <LoadError message="This resource has no content yet." onRetry={() => void load(current.key, true)} />
        );
      }
      panel = (
        <section className="rounded-[32px] p-4 shadow-pop sm:p-6" style={{ background: topic.color || "#FFC928" }} data-testid="preview-activity" data-step={i}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {count}
            {reached[current.key] && (
              <span className="rounded-full bg-[#E8F7EA] px-3 py-1 text-sm font-extrabold text-[#1E7B34]" role="status" data-testid="preview-reached">
                ✓ Criterio de finalización cumplido · Completion reached (not saved)
              </span>
            )}
          </div>
          <h1 className="mb-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">{current.title}</h1>
          <div className="rounded-[22px] bg-paper p-3 sm:p-4">
            <PlayerBoundary key={`${current.key}-${run}`} onRetry={() => setRun((r) => r + 1)}>{player}</PlayerBoundary>
          </div>
        </section>
      );
    }
  }

  const atFirst = i <= 0;
  const atLast = i < 0 || i >= total - 1;
  const showNav = view.t === "step" && total > 0;
  return (
    <div data-testid="preview-view" data-scope={scope}>
      {header}
      {note && <p className="mb-3 text-center text-sm font-semibold text-ink-2" data-testid="preview-note">{note}</p>}
      {toolbar}
      <div className="lg:grid lg:grid-cols-[minmax(9rem,1fr)_minmax(0,54rem)_minmax(9rem,1fr)] lg:items-start lg:gap-6">
        <div className="hidden lg:sticky lg:top-[38vh] lg:flex lg:justify-center">{showNav && <NavButton dir="prev" disabled={atFirst} onClick={() => go(i - 1)} />}</div>
        <div className="min-w-0">{panel}</div>
        <div className="hidden lg:sticky lg:top-[38vh] lg:flex lg:justify-center">{showNav && <NavButton dir="next" disabled={atLast} onClick={() => go(i + 1)} />}</div>
      </div>
      {showNav && (
        <div className="mt-4 flex gap-3 lg:hidden" data-testid="preview-nav-mobile">
          <NavButton dir="prev" compact disabled={atFirst} onClick={() => go(i - 1)} />
          <NavButton dir="next" compact disabled={atLast} onClick={() => go(i + 1)} />
        </div>
      )}
    </div>
  );
}
