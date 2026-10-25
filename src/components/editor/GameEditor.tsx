"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Panel";
import type { TemplateDef } from "@/lib/games/templates";
import { SPELL_TOKENS, type EditorGame, type EditorItem } from "@/lib/games/types";
import { LANGUAGES, type AppLanguage } from "@/lib/tts/voices";
import { AudioControl, type TtsConfig } from "./AudioControl";
import { ImagePicker } from "./ImagePicker";
import { SpanishCharBar, SpanishField, SpanishKeyboardProvider } from "./SpanishField";

type Category = { id: string; nameEn: string; nameEs: string };
type SaveState = "saved" | "dirty" | "saving" | "error";

function blankItem(t: TemplateDef): EditorItem {
  return {
    imageAssetId: null,
    imageUrl: null,
    text: "",
    difficulty: 1,
    question: {
      prompt: t.key === "SPELL_YOUR_NAME" ? "¿Cómo deletreas tu nombre?" : "",
      promptAudioId: null,
      expectedAnswer: t.key === "SPELL_YOUR_NAME" ? SPELL_TOKENS.firstName : "",
      accepted: [],
      hint: "",
      supportText: t.key === "SPELL_YOUR_NAME" ? "How do you spell your name?" : "",
      supportLanguage: "en-US",
      supportAudioId: null,
      evaluationMode: t.defaults.evaluationMode,
      spellTarget: t.key === "SPELL_YOUR_NAME" ? "firstName" : "word",
    },
  };
}

export function GameEditor({ initial, template, categories }: { initial: EditorGame; template: TemplateDef; categories: Category[] }) {
  const router = useRouter();
  const [game, setGame] = useState<EditorGame>(() => (initial.items.length ? initial : { ...initial, items: [blankItem(template)] }));
  const [save, setSave] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const [tts, setTts] = useState<TtsConfig | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [restore, setRestore] = useState<EditorGame | null>(null);
  const first = useRef(true);
  const backupKey = `sls-editor-${initial.id}`;

  useEffect(() => {
    fetch("/api/tts").then((r) => r.json()).then(setTts).catch(() => setTts({ provider: null, voices: [] }));
    try {
      const raw = localStorage.getItem(backupKey);
      if (raw) {
        const b = JSON.parse(raw) as EditorGame;
        if (JSON.stringify(b.items) !== JSON.stringify(initial.items) || b.title !== initial.title) setRestore(b);
        else localStorage.removeItem(backupKey);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(async (g: EditorGame) => {
    setSave("saving");
    try {
      const res = await fetch(`/api/games/${g.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...g,
          items: g.items.map((it) => ({ ...it, question: { ...it.question, accepted: it.question.accepted.filter((a) => a.trim()) } })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Save failed (${res.status})`);
      setSave("saved");
      setSaveError("");
      try {
        localStorage.removeItem(backupKey);
      } catch {}
      return true;
    } catch (e) {
      setSave("error");
      setSaveError((e as Error).message);
      return false;
    }
  }, [backupKey]);

  // Autosave a few seconds after the last change, plus a local backup on this device.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave("dirty");
    try {
      localStorage.setItem(backupKey, JSON.stringify(game));
    } catch {}
    const t = setTimeout(() => persist(game), 2500);
    return () => clearTimeout(t);
  }, [game, persist, backupKey]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save === "dirty" || save === "saving" || save === "error") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  const set = <K extends keyof EditorGame>(k: K, v: EditorGame[K]) => setGame((g) => ({ ...g, [k]: v }));
  const setItem = (i: number, fn: (it: EditorItem) => EditorItem) => setGame((g) => ({ ...g, items: g.items.map((it, k) => (k === i ? fn(it) : it)) }));
  const setQ = (i: number, patch: Partial<EditorItem["question"]>) => setItem(i, (it) => ({ ...it, question: { ...it.question, ...patch } }));
  const move = (i: number, d: number) =>
    setGame((g) => {
      const items = [...g.items];
      const j = i + d;
      if (j < 0 || j >= items.length) return g;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...g, items };
    });

  const voices = (tts?.voices ?? []).filter((v) => v.language === game.language);
  const fields = template.fields;

  async function preview() {
    if (await persist(game)) router.push(`/teacher/games/${game.id}/preview`);
  }

  async function publish() {
    setPublishing(true);
    setProblems([]);
    if (!(await persist(game))) return setPublishing(false);
    const res = await fetch(`/api/games/${game.id}/publish`, { method: "POST" });
    const json = await res.json();
    setPublishing(false);
    if (!res.ok || !json.ok) return setProblems(json.problems ?? [json.error ?? "Could not publish"]);
    first.current = true; // status change is not an edit
    setGame((g) => ({ ...g, status: "PUBLISHED" }));
    router.refresh();
  }

  return (
    <SpanishKeyboardProvider>
      {restore && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 bg-sun-soft px-4 py-3 text-sm">
          <span className="flex-1">This device has unsaved changes to this game from an earlier session.</span>
          <Button size="sm" variant="secondary" onClick={() => (setGame(restore), setRestore(null))}>Restore them</Button>
          <Button size="sm" variant="ghost" onClick={() => { localStorage.removeItem(backupKey); setRestore(null); }}>Discard</Button>
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-5 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <Link href="/teacher/games" className="text-sm font-bold text-muted hover:text-ink">← Games</Link>
        <span className="font-display text-lg font-semibold">{game.title || "Untitled game"}</span>
        <Badge tone="sky">{template.name}</Badge>
        <Badge tone={game.status === "PUBLISHED" ? "leaf" : "neutral"}>{game.status === "PUBLISHED" ? "Published" : game.status === "ARCHIVED" ? "Archived" : "Draft"}</Badge>
        <span className="text-xs font-semibold text-muted" aria-live="polite">
          {save === "saved" ? "All changes saved" : save === "saving" ? "Saving…" : save === "dirty" ? "Unsaved changes" : `Not saved: ${saveError}`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {save === "error" && <Button size="sm" variant="secondary" onClick={() => persist(game)}>Retry save</Button>}
          <Button size="sm" variant="secondary" onClick={preview}>Save &amp; Preview</Button>
          <Button size="sm" onClick={publish} disabled={publishing}>
            {publishing ? "Publishing…" : game.status === "PUBLISHED" ? "Update published game" : "Publish"}
          </Button>
          {game.status === "PUBLISHED" && <ButtonLink size="sm" variant="voice" href={`/teacher/assignments/new?gameId=${game.id}`}>Assign</ButtonLink>}
        </div>
        <div className="w-full">
          <SpanishCharBar />
        </div>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="mb-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">
          <p className="font-bold">Before publishing:</p>
          <ul className="mt-1 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {game.items.map((it, i) => (
            <section key={it.id ?? `new-${i}`} className="rounded-xl2 border border-line bg-card p-5" aria-label={`Question ${i + 1}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white">{i + 1}</span>
                <div className="ml-auto flex gap-1 text-xs font-bold text-muted">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-full px-2 py-1 hover:bg-paper-2 disabled:opacity-30" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === game.items.length - 1} className="rounded-full px-2 py-1 hover:bg-paper-2 disabled:opacity-30" aria-label="Move down">↓</button>
                  <button type="button" onClick={() => setGame((g) => ({ ...g, items: [...g.items.slice(0, i + 1), { ...structuredClone(it), id: undefined, question: { ...structuredClone(it.question), id: undefined } }, ...g.items.slice(i + 1)] }))} className="rounded-full px-2 py-1 hover:bg-paper-2">Duplicate</button>
                  <button
                    type="button"
                    onClick={() => confirm("Delete this question?") && setGame((g) => ({ ...g, items: g.items.filter((_, k) => k !== i) }))}
                    className="rounded-full px-2 py-1 hover:bg-coral-soft hover:text-coral-dark"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={`grid gap-5 ${fields.image !== "none" ? "md:grid-cols-[220px_minmax(0,1fr)]" : ""}`}>
                {fields.image !== "none" && (
                  <div>
                    <Label>Image {fields.image === "optional" && <span className="font-normal text-muted">(optional)</span>}</Label>
                    <ImagePicker value={it.imageAssetId} url={it.imageUrl} onChange={(a) => setItem(i, (x) => ({ ...x, imageAssetId: a?.id ?? null, imageUrl: a?.url ?? null }))} />
                  </div>
                )}
                <div className="space-y-4">
                  {template.key === "SPELL_YOUR_NAME" && (
                    <div>
                      <Label>What to spell</Label>
                      <Select
                        value={it.question.spellTarget ?? "word"}
                        onChange={(e) => {
                          const v = e.target.value as "firstName" | "lastName" | "word";
                          setQ(i, { spellTarget: v, expectedAnswer: v === "word" ? "" : SPELL_TOKENS[v] });
                        }}
                      >
                        <option value="firstName">The student&apos;s first name</option>
                        <option value="lastName">The student&apos;s last name</option>
                        <option value="word">A word I choose</option>
                      </Select>
                      <p className="mt-1 text-xs text-muted">Names come from each student&apos;s profile (“Full name for spelling”).</p>
                    </div>
                  )}
                  <div>
                    <SpanishField label="Support line (other language)" hint="optional, spoken first" value={it.question.supportText} language={it.question.supportLanguage} onChange={(v) => setQ(i, { supportText: v })} placeholder="How do you spell your name?" />
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <select aria-label="Support line language" value={it.question.supportLanguage} onChange={(e) => setQ(i, { supportLanguage: e.target.value as AppLanguage, supportAudioId: null })} className="rounded-lg border border-line bg-card px-2 py-1 text-xs">
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                      <AudioControl text={it.question.supportText} language={it.question.supportLanguage} rate={game.settings.rate} tts={tts} audio={{ id: it.question.supportAudioId, text: it.question.supportAudioText, url: it.question.supportAudioUrl }} onAudio={(a) => setQ(i, { supportAudioId: a?.id ?? null, supportAudioText: a?.text, supportAudioUrl: a?.url })} />
                    </div>
                  </div>
                  {fields.prompt && (
                    <div>
                      <SpanishField label="Question" value={it.question.prompt} language={game.language} onChange={(v) => setQ(i, { prompt: v })} placeholder={template.promptPlaceholder} />
                      <div className="mt-1.5">
                        <AudioControl text={it.question.prompt} language={game.language} voice={game.settings.voice} rate={game.settings.rate} tts={tts} audio={{ id: it.question.promptAudioId, text: it.question.promptAudioText, url: it.question.promptAudioUrl }} onAudio={(a) => setQ(i, { promptAudioId: a?.id ?? null, promptAudioText: a?.text, promptAudioUrl: a?.url })} />
                      </div>
                    </div>
                  )}
                  {(template.key !== "SPELL_YOUR_NAME" || it.question.spellTarget === "word") && (
                    <div>
                      <SpanishField
                        label={template.key === "LISTEN_AND_SPEAK" ? "Word or phrase to repeat" : template.key === "SPELL_YOUR_NAME" ? "Word to spell" : "Correct answer"}
                        value={it.question.expectedAnswer}
                        language={game.language}
                        onChange={(v) => setQ(i, { expectedAnswer: v })}
                        placeholder={template.answerPlaceholder}
                      />
                      {template.key === "LISTEN_AND_SPEAK" && (
                        <div className="mt-1.5">
                          <AudioControl text={it.question.expectedAnswer} language={game.language} voice={game.settings.voice} rate={game.settings.rate} tts={tts} audio={{ id: null }} onAudio={() => undefined} />
                        </div>
                      )}
                    </div>
                  )}
                  {it.question.evaluationMode === "PHRASE" && (
                    <SpanishField
                      label="Other accepted answers"
                      hint="one per line"
                      multiline
                      value={it.question.accepted.join("\n")}
                      language={game.language}
                      onChange={(v) => setQ(i, { accepted: v.split("\n") })}
                      placeholder={"Un perro\nEl perro"}
                      checkable={false}
                    />
                  )}
                  <SpanishField label="Hint" hint="shown after the first incorrect try" value={it.question.hint} language={game.language} onChange={(v) => setQ(i, { hint: v })} placeholder="Hace “guau, guau”." />
                </div>
              </div>
            </section>
          ))}
          <button type="button" onClick={() => setGame((g) => ({ ...g, items: [...g.items, blankItem(template)] }))} className="w-full rounded-xl2 border-2 border-dashed border-line py-4 font-bold text-ink-2 hover:border-coral hover:text-coral">
            + Add question
          </button>
        </div>

        <aside className="space-y-4">
          <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <SpanishField label="Activity title" value={game.title} onChange={(v) => set("title", v)} placeholder="Los animales" maxLength={120} />
            <SpanishField label="Description" multiline value={game.description} onChange={(v) => set("description", v)} maxLength={1000} />
            <SpanishField label="Instructions for students" multiline value={game.instructions} onChange={(v) => set("instructions", v)} placeholder="Mira la imagen y responde." maxLength={1000} />
            <div>
              <Label htmlFor="cat">Category</Label>
              <Select id="cat" value={game.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn} / {c.nameEs}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" value={game.topic} onChange={(e) => set("topic", e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Input id="level" value={game.level} onChange={(e) => set("level", e.target.value)} placeholder="LE2" maxLength={60} />
              </div>
            </div>
            <div>
              <Label htmlFor="obj">Learning objective</Label>
              <Input id="obj" value={game.objective} onChange={(e) => set("objective", e.target.value)} maxLength={500} placeholder="Name 6 farm animals" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="diff">Difficulty</Label>
                <Select id="diff" value={game.difficulty} onChange={(e) => set("difficulty", Number(e.target.value))}>
                  <option value={1}>Easy</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Hard</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="mins">Minutes</Label>
                <Input id="mins" type="number" min={1} max={120} value={game.estimatedMinutes ?? ""} onChange={(e) => set("estimatedMinutes", e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Voice &amp; answers</h2>
            <div>
              <Label htmlFor="lang">Language</Label>
              <Select id="lang" value={game.language} onChange={(e) => setGame((g) => ({ ...g, language: e.target.value as AppLanguage, settings: { ...g.settings, voice: undefined } }))}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="voice">Voice</Label>
              {tts?.provider ? (
                <Select id="voice" value={game.settings.voice ?? voices[0]?.id ?? ""} onChange={(e) => set("settings", { ...game.settings, voice: e.target.value })}>
                  {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </Select>
              ) : (
                <p className="rounded-xl bg-paper-2 p-3 text-xs text-ink-2">
                  {tts ? "No text-to-speech provider is configured. Students will hear the device's own Spanish voice when one exists. Add AZURE_SPEECH_KEY or GOOGLE_CLOUD_API_KEY for natural, saved audio." : "Loading voices…"}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="rate" hint={`${game.settings.rate.toFixed(2)}×`}>Speed</Label>
              <input id="rate" type="range" min={0.6} max={1.2} step={0.05} value={game.settings.rate} onChange={(e) => set("settings", { ...game.settings, rate: Number(e.target.value) })} className="w-full accent-teal" />
            </div>
            {template.defaults.evaluationMode === "PHRASE" && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={game.settings.acceptShortAnswer} onChange={(e) => set("settings", { ...game.settings, acceptShortAnswer: e.target.checked })} />
                <span>
                  <strong>Accept the key word alone</strong>
                  <span className="block text-xs text-muted">“perro” counts for “Es un perro”. Turn off to require the full sentence.</span>
                </span>
              </label>
            )}
            <div>
              <Label htmlFor="tries">Tries before showing the answer</Label>
              <Select id="tries" value={game.settings.maxTries} onChange={(e) => set("settings", { ...game.settings, maxTries: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </section>
        </aside>
      </div>
    </SpanishKeyboardProvider>
  );
}
