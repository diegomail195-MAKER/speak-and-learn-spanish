"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontPreview } from "@/components/editor/FontPreview";
import { OptionInput } from "@/components/editor/OptionInput";
import { Input, Label, Select } from "@/components/ui/Field";
import { saveAcceptedAnswers, saveActivitySettings } from "@/lib/actions/games";
import { practiceCards } from "@/lib/games/practice";
import { templateByKey, templateOptions } from "@/lib/games/templates";
import type { GameSettings, PlayGame } from "@/lib/games/types";
import { plainText } from "@/lib/text/segments";
import { LANGUAGES, type AppLanguage } from "@/lib/tts/voices";

/** What Activity settings edits: the activity's information and its settings. */
export interface SettingsValues {
  description: string;
  categoryId: string | null;
  topic: string;
  level: string;
  objective: string;
  difficulty: number;
  estimatedMinutes: number | null;
  language: AppLanguage;
  settings: Pick<GameSettings, "acceptShortAnswer" | "voice" | "voices" | "rate" | "maxTries" | "options">;
}
export interface SettingsData {
  templateKey: string;
  values: SettingsValues;
  categories: Array<{ id: string; nameEn: string; nameEs: string }>;
}

type Voice = { id: string; label: string; language: string; recommended: boolean; description: string };
type Section = "look" | "options" | "voice" | "about";
const LOOK_KEYS = new Set(["font"]);
const VOICE_KEYS = new Set(["speakingMode", "letsPractice"]);
const SHORT: Record<string, string> = { "es-419": "Spanish", "en-US": "English", "fr-FR": "French" };

/**
 * Activity settings, right under Edit Content / Print Worksheet / Set Assignment: four short
 * sections (Font, the activity's options, Voice & answers, About). Every change saves by itself.
 */
export function ActivitySettings({ game, data }: { game: PlayGame; data: SettingsData }) {
  const router = useRouter();
  const template = templateByKey(data.templateKey);
  const [v, setV] = useState<SettingsValues>(data.values);
  const [section, setSection] = useState<Section>("look");
  const [status, setStatus] = useState("");
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const options = template ? templateOptions(template, v.settings.options) : {};
  const all = template?.options ?? [];
  const look = all.filter((o) => LOOK_KEYS.has(o.key));
  const own = all.filter((o) => !LOOK_KEYS.has(o.key) && !VOICE_KEYS.has(o.key) && o.key !== "sides");
  const speech = all.filter((o) => VOICE_KEYS.has(o.key));
  const phrase = template?.defaults.evaluationMode === "PHRASE";

  useEffect(() => {
    fetch("/api/tts")
      .then((r) => (r.ok ? r.json() : { provider: null, voices: [] }))
      .then((j) => {
        setVoices(j.voices ?? []);
        setProvider(j.provider ?? null);
      })
      .catch(() => setVoices([]));
  }, []);

  function flush(refresh: boolean) {
    const body = pending.current;
    pending.current = {};
    setStatus("Saving…");
    saveActivitySettings(game.gameId, body)
      .then((r) => {
        setStatus(r.ok ? "Saved" : r.error);
        if (r.ok && refresh) router.refresh();
      })
      .catch(() => setStatus("Couldn't save. Try again."));
  }
  /** Changes the screen at once and saves shortly after (text) or right away (choices). */
  function update(patch: Partial<Omit<SettingsValues, "settings">> & { settings?: Partial<SettingsValues["settings"]> }, opts: { now?: boolean; refresh?: boolean } = {}) {
    setV((cur) => ({ ...cur, ...patch, settings: { ...cur.settings, ...(patch.settings ?? {}) } }));
    const prev = pending.current as { settings?: Record<string, unknown> };
    pending.current = { ...prev, ...patch, ...(patch.settings || prev.settings ? { settings: { ...(prev.settings ?? {}), ...(patch.settings ?? {}) } } : {}) };
    if (timer.current) clearTimeout(timer.current);
    setStatus("Unsaved changes");
    timer.current = setTimeout(() => flush(!!opts.refresh), opts.now ? 0 : 700);
  }
  const setOption = (k: string, val: string | number | boolean) => update({ settings: { options: { ...(v.settings.options ?? {}), [k]: val } } }, { now: true, refresh: true });

  const nav: Array<{ k: Section; label: string }> = [
    { k: "look", label: "Font" },
    ...(own.length ? [{ k: "options" as const, label: `${template?.name ?? "Activity"} options` }] : []),
    { k: "voice", label: "Voice & answers" },
    { k: "about", label: "About" },
  ];

  return (
    <div className="py-3" data-testid="activity-settings">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Activity settings sections" className="flex flex-wrap gap-1 rounded-full bg-paper-2 p-1">
          {nav.map((n) => (
            <button
              key={n.k}
              type="button"
              aria-pressed={section === n.k}
              onClick={() => setSection(n.k)}
              data-testid={`settings-${n.k}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${section === n.k ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <span className="ml-auto text-xs font-bold text-muted" aria-live="polite" data-testid="settings-status">
          {status === "Saved" ? "✓ Saved" : status}
        </span>
      </div>

      {section === "look" && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-3">
            {look.map((o) => (
              <OptionInput key={o.key} o={o} value={options[o.key]} onChange={(val) => setOption(o.key, val)} />
            ))}
            <p className="text-xs text-muted">The font is used in the game and in the printable worksheets.</p>
          </div>
          <FontPreview font={String(options.font ?? "default")} />
        </div>
      )}

      {section === "options" && (
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {own.map((o) => (
            <OptionInput key={o.key} o={o} value={options[o.key]} onChange={(val) => setOption(o.key, val)} disabled={o.key === "seconds" && !options.timed} />
          ))}
        </div>
      )}

      {section === "voice" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold">Voice</h3>
            <div>
              <Label htmlFor="set-lang">Activity language</Label>
              <Select id="set-lang" value={v.language} onChange={(e) => update({ language: e.target.value as AppLanguage, settings: { voice: undefined } }, { now: true, refresh: true })}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </Select>
            </div>
            {provider && voices ? (
              LANGUAGES.map((l) => {
                const list = voices.filter((x) => x.language === l.code);
                if (!list.length) return null;
                const main = l.code === v.language;
                const value = (main ? v.settings.voice : v.settings.voices?.[l.code]) ?? (list.find((x) => x.recommended) ?? list[0]).id;
                return (
                  <div key={l.code}>
                    <Label htmlFor={`set-voice-${l.code}`} hint={main ? "main voice" : "for words marked in this language"}>{SHORT[l.code] ?? l.label} voice</Label>
                    <Select id={`set-voice-${l.code}`} value={value} onChange={(e) => (main ? update({ settings: { voice: e.target.value } }, { now: true }) : update({ settings: { voices: { ...(v.settings.voices ?? {}), [l.code]: e.target.value } } }, { now: true }))}>
                      {list.map((x) => (
                        <option key={x.id} value={x.id}>{x.description ? `${x.label} — ${x.description}` : x.label}</option>
                      ))}
                    </Select>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl bg-paper-2 p-3 text-xs text-ink-2">{voices ? "Students hear the device's own voices (no voice service is configured)." : "Loading voices…"}</p>
            )}
            <div>
              <Label htmlFor="set-rate" hint={`${v.settings.rate.toFixed(2)}×`}>Speed</Label>
              <input id="set-rate" type="range" min={0.6} max={1.2} step={0.05} value={v.settings.rate} onChange={(e) => update({ settings: { rate: Number(e.target.value) } })} className="w-full accent-teal" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold">Answers</h3>
            {speech.map((o) => (
              <OptionInput key={o.key} o={o} value={options[o.key]} onChange={(val) => setOption(o.key, val)} />
            ))}
            {phrase && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={v.settings.acceptShortAnswer} onChange={(e) => update({ settings: { acceptShortAnswer: e.target.checked } }, { now: true })} />
                <span>
                  <strong>Accept the key word alone</strong>
                  <span className="block text-xs text-muted">“perro” counts for “Es un perro”. Turn off to require the full sentence.</span>
                </span>
              </label>
            )}
            <div className="max-w-xs">
              <Label htmlFor="set-tries">Tries before showing the answer</Label>
              <Select id="set-tries" value={v.settings.maxTries} onChange={(e) => update({ settings: { maxTries: Number(e.target.value) } }, { now: true })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="lg:col-span-2">
            <PossibleAnswers game={game} />
          </div>
        </div>
      )}

      {section === "about" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="set-desc">Description</Label>
            <textarea id="set-desc" value={v.description} maxLength={1000} rows={2} onChange={(e) => update({ description: e.target.value })} className="w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </div>
          <div>
            <Label htmlFor="set-cat">Category</Label>
            <Select id="set-cat" value={v.categoryId ?? ""} onChange={(e) => update({ categoryId: e.target.value || null }, { now: true })}>
              <option value="">—</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn} / {c.nameEs}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="set-topic">Topic</Label>
              <Input id="set-topic" value={v.topic} maxLength={120} onChange={(e) => update({ topic: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="set-level">Level</Label>
              <Input id="set-level" value={v.level} maxLength={60} placeholder="LE2" onChange={(e) => update({ level: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="set-obj">Learning objective</Label>
            <Input id="set-obj" value={v.objective} maxLength={500} placeholder="Name 6 farm animals" onChange={(e) => update({ objective: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="set-diff">Difficulty</Label>
              <Select id="set-diff" value={v.difficulty} onChange={(e) => update({ difficulty: Number(e.target.value) }, { now: true })}>
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="set-mins">Minutes</Label>
              <Input id="set-mins" type="number" min={1} max={120} value={v.estimatedMinutes ?? ""} onChange={(e) => update({ estimatedMinutes: e.target.value ? Math.min(120, Math.max(1, Number(e.target.value))) : null })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Each card's answer and the other answers that also count ("púrpura" for "morado"). */
export function PossibleAnswers({ game, title = "Possible answers" }: { game: PlayGame; title?: string }) {
  const rows = useMemo(() => {
    if (game.board === "flashcards") return practiceCards(game).map((c) => ({ id: c.q.id, label: plainText(c.q.displayText || c.q.back?.text || ""), expected: plainText(c.q.expected), accepted: c.q.accepted ?? [], image: c.show.imageUrl ?? c.q.imageUrl }));
    return game.questions.filter((q) => q.mode === "PHRASE" && plainText(q.expected)).map((q) => ({ id: q.id, label: plainText(q.prompt || q.displayText || ""), expected: plainText(q.expected), accepted: q.accepted ?? [], image: q.imageUrl }));
  }, [game]);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="possible-answers" className="rounded-xl2 border border-line bg-paper p-4" data-testid="possible-answers">
      <h3 id="possible-answers" className="font-display text-base font-bold">{title}</h3>
      <p className="mb-3 text-xs text-muted">Write other words that also count, separated by commas. For example, «púrpura, violeta» for «morado».</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <AnswerRow key={r.id} gameId={game.gameId} row={r} />
        ))}
      </ul>
    </section>
  );
}

function AnswerRow({ gameId, row }: { gameId: string; row: { id: string; label: string; expected: string; accepted: string[]; image: string | null | undefined } }) {
  const [text, setText] = useState(row.accepted.join(", "));
  const [saved, setSaved] = useState(row.accepted.join(", "));
  const [status, setStatus] = useState("");
  async function save() {
    if (text.trim() === saved.trim()) return;
    setStatus("Saving…");
    const r = await saveAcceptedAnswers(gameId, row.id, text.split(/[,\n]/)).catch(() => ({ ok: false as const, error: "Couldn't save." }));
    if (!r.ok) return setStatus(r.error);
    const joined = r.answers.join(", ");
    setText(joined);
    setSaved(joined);
    setStatus("✓");
  }
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-card px-3 py-2" data-testid="answer-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {row.image ? <img src={row.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : null}
      <span className="min-w-[8rem] font-bold">
        {row.expected}
        {row.label && row.label !== row.expected && <span className="block text-xs font-semibold text-muted">{row.label}</span>}
      </span>
      <label className="flex min-w-[12rem] flex-1 items-center gap-2 text-sm">
        <span className="sr-only">Other answers for {row.expected}</span>
        <input value={text} onChange={(e) => setText(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), save())} placeholder="Other answers, separated by commas" className="h-10 w-full rounded-xl border border-line bg-paper px-3" data-testid="answer-input" lang="es" />
      </label>
      <span className="w-14 text-xs font-bold text-muted" aria-live="polite">{status}</span>
    </li>
  );
}
