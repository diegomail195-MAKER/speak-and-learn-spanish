"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Panel";
import { duplicateGame } from "@/lib/actions/games";
import { ALPHABET } from "@/lib/alphabet";
import { templateOptions, type OptionDef, type TemplateDef } from "@/lib/games/templates";
import { SPELL_TOKENS, type EditorGame, type EditorItem } from "@/lib/games/types";
import { LANGUAGES, type AppLanguage } from "@/lib/tts/voices";
import { AudioControl, type TtsConfig } from "./AudioControl";
import { DiagramPoints } from "./DiagramPoints";
import { ImagePicker } from "./ImagePicker";
import { SpanishCharBar, SpanishField, SpanishKeyboardProvider } from "./SpanishField";

type Category = { id: string; nameEn: string; nameEs: string };
type SaveState = "saved" | "dirty" | "saving" | "error";

const LANG_SHORT: Record<AppLanguage, string> = { "es-419": "Spanish", "en-US": "English", "fr-FR": "French" };

function blankItem(t: TemplateDef): EditorItem {
  const name = t.key === "SPELL_YOUR_NAME";
  return {
    imageAssetId: null,
    imageUrl: null,
    text: "",
    difficulty: 1,
    data: {},
    question: {
      prompt: name ? "¿Cómo deletreas tu nombre?" : "",
      promptAudioId: null,
      expectedAnswer: name ? SPELL_TOKENS.firstName : "",
      accepted: [],
      hint: "",
      supportText: name ? "How do you spell your name?" : "",
      supportLanguage: "en-US",
      supportAudioId: null,
      evaluationMode: t.defaults.evaluationMode,
      spellTarget: name ? "firstName" : "word",
      answerLanguage: null,
    },
  };
}

/** The Spanish alphabet as ready-made items for the templates where it makes sense. */
function alphabetItems(t: TemplateDef): EditorItem[] {
  return ALPHABET.map((L) => {
    const it = blankItem(t);
    if (t.key === "SPELL_THE_WORD") {
      // Spell a word that starts with each letter.
      it.question.expectedAnswer = L.examples[0];
      it.question.hint = `${L.upper} de ${L.examples[0]}`;
      return it;
    }
    it.text = `${L.upper} ${L.lower}`;
    it.question.evaluationMode = "LETTERS"; // accepts any common name of the letter ("be", "be larga"…)
    it.question.expectedAnswer = L.upper;
    it.question.prompt = t.key === "FLASHCARDS" ? "¿Cómo se llama esta letra?" : "";
    it.question.hint = `${L.upper} de ${L.examples[0]}`;
    it.question.answerLanguage = "es-419";
    if (t.key === "FLASHCARDS") it.data = { translation: [L.name, ...L.variants].join(" · "), translationLanguage: "es-419" };
    return it;
  });
}
const ALPHABET_TEMPLATES = ["FLASHCARDS", "LISTEN_AND_SPEAK", "SPELL_THE_WORD"];

export function GameEditor({ initial, template, categories }: { initial: EditorGame; template: TemplateDef; categories: Category[] }) {
  const router = useRouter();
  const [game, setGame] = useState<EditorGame>(() =>
    initial.items.length ? initial : { ...initial, items: Array.from({ length: template.minItems ?? 1 }, () => blankItem(template)) },
  );
  const [save, setSave] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [tts, setTts] = useState<TtsConfig | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "publish" | "assign" | "preview" | "duplicate">("");
  const [restore, setRestore] = useState<EditorGame | null>(null);
  const [activePoint, setActivePoint] = useState(0);
  const first = useRef(true);
  const dupForm = useRef<HTMLFormElement>(null);
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

  const persist = useCallback(
    async (g: EditorGame) => {
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
        setSavedAt(new Date());
        try {
          localStorage.removeItem(backupKey);
        } catch {}
        return true;
      } catch (e) {
        setSave("error");
        setSaveError((e as Error).message);
        return false;
      }
    },
    [backupKey],
  );

  // Autosave a few seconds after the last change, plus a local backup on this device
  // (recovered on the next visit if the save never reached the server).
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
  const setSettings = (patch: Partial<EditorGame["settings"]>) => setGame((g) => ({ ...g, settings: { ...g.settings, ...patch } }));
  const setItem = (i: number, fn: (it: EditorItem) => EditorItem) => setGame((g) => ({ ...g, items: g.items.map((it, k) => (k === i ? fn(it) : it)) }));
  const setQ = (i: number, patch: Partial<EditorItem["question"]>) => setItem(i, (it) => ({ ...it, question: { ...it.question, ...patch } }));
  const setData = (i: number, patch: Partial<EditorItem["data"]>) => setItem(i, (it) => ({ ...it, data: { ...it.data, ...patch } }));
  const move = (i: number, d: number) =>
    setGame((g) => {
      const items = [...g.items];
      const j = i + d;
      if (j < 0 || j >= items.length) return g;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...g, items };
    });

  const options = templateOptions(template, game.settings.options);
  const setOption = (k: string, v: string | number | boolean) => setSettings({ options: { ...options, [k]: v } });
  const voicesFor = (l: AppLanguage) => (tts?.voices ?? []).filter((v) => v.language === l);
  const otherVoices = game.settings.voices ?? {};
  // Voices for every language, so marked runs ("…en español, [en]love[/en]?") use the teacher's choice.
  const voiceMap: Partial<Record<AppLanguage, string>> = { ...otherVoices, ...(game.settings.voice ? { [game.language]: game.settings.voice } : {}) };
  const fields = template.fields;
  const noun = template.itemNoun;
  const typedSpelling = template.key === "SPELL_THE_WORD" && options.spellMode === "type";

  async function saveDraft() {
    await persist(game);
  }

  async function preview() {
    setBusy("preview");
    if (await persist(game)) router.push(`/teacher/games/${game.id}/preview`);
    else setBusy("");
  }

  async function publish(): Promise<boolean> {
    setProblems([]);
    if (!(await persist(game))) return false;
    const res = await fetch(`/api/games/${game.id}/publish`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setProblems(json.problems ?? [json.error ?? "Could not publish"]);
      return false;
    }
    first.current = true; // the status change is not an edit
    setGame((g) => ({ ...g, status: "PUBLISHED" }));
    router.refresh();
    return true;
  }

  async function doPublish() {
    setBusy("publish");
    await publish();
    setBusy("");
  }

  async function assign() {
    setBusy("assign");
    // Students can only be given published activities: publish (or update) first.
    if (await publish()) router.push(`/teacher/assignments/new?gameId=${game.id}`);
    else setBusy("");
  }

  async function duplicate() {
    setBusy("duplicate");
    if (await persist(game)) dupForm.current?.requestSubmit();
    else setBusy("");
  }

  function addAlphabet() {
    const empty = game.items.every((it) => !it.question.expectedAnswer.trim() && !it.text.trim() && !it.imageAssetId);
    if (!empty && !confirm(`Add 27 ${noun}s (A–Z with Ñ) after the ones you already have?`)) return;
    setGame((g) => ({ ...g, items: [...(empty ? [] : g.items), ...alphabetItems(template)] }));
  }

  return (
    <SpanishKeyboardProvider>
      <form ref={dupForm} action={duplicateGame} className="hidden">
        <input type="hidden" name="gameId" value={game.id} />
      </form>

      {restore && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 bg-sun-soft px-4 py-3 text-sm">
          <span className="flex-1">This device has unsaved changes to this activity from an earlier session.</span>
          <Button size="sm" variant="secondary" onClick={() => (setGame(restore), setRestore(null))}>Restore them</Button>
          <Button size="sm" variant="ghost" onClick={() => { try { localStorage.removeItem(backupKey); } catch {} setRestore(null); }}>Discard</Button>
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-5 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <Link href="/teacher/games" className="text-sm font-bold text-muted hover:text-ink">← Activities</Link>
        <span className="font-display text-lg font-semibold">{game.title || "Untitled activity"}</span>
        <Badge tone="sky">{template.name}</Badge>
        <Badge tone={game.status === "PUBLISHED" ? "leaf" : "neutral"}>{game.status === "PUBLISHED" ? "Published" : game.status === "ARCHIVED" ? "Archived" : "Draft"}</Badge>
        <span className="text-xs font-semibold text-muted" aria-live="polite">
          {save === "saved"
            ? savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "All changes saved"
            : save === "saving"
              ? "Saving…"
              : save === "dirty"
                ? "Unsaved changes"
                : `Not saved: ${saveError}`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={saveDraft} disabled={save === "saving"}>
            {save === "error" ? "Retry save" : "Save draft"}
          </Button>
          <Button size="sm" variant="ghost" onClick={duplicate} disabled={!!busy}>{busy === "duplicate" ? "Duplicating…" : "Duplicate"}</Button>
          <Button size="sm" variant="secondary" onClick={preview} disabled={!!busy}>Preview</Button>
          <Button size="sm" onClick={doPublish} disabled={!!busy}>
            {busy === "publish" ? "Publishing…" : game.status === "PUBLISHED" ? "Update published" : "Publish"}
          </Button>
          <Button size="sm" variant="voice" onClick={assign} disabled={!!busy}>{busy === "assign" ? "Publishing…" : "Assign"}</Button>
        </div>
        <div className="w-full">
          <SpanishCharBar french={game.language === "fr-FR"} />
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
          {template.activityImage && (
            <section className="rounded-xl2 border border-line bg-card p-5" aria-label="Picture to label">
              <h2 className="font-display text-lg font-semibold">Picture to label</h2>
              <p className="mb-3 text-sm text-muted">Upload one picture, then choose a {noun} below and click the picture to place it. Drag a number to move it.</p>
              {game.diagramImageUrl ? (
                <>
                  <DiagramPoints
                    imageUrl={game.diagramImageUrl}
                    points={game.items.map((it) => ({ x: it.data.x, y: it.data.y, label: it.text }))}
                    active={activePoint}
                    onSelect={setActivePoint}
                    onPlace={(i, x, y) => {
                      setData(i, { x, y });
                      const next = game.items.findIndex((it, k) => k > i && it.data.x == null);
                      if (next !== -1) setActivePoint(next);
                    }}
                  />
                  <button type="button" onClick={() => setGame((g) => ({ ...g, diagramImageUrl: null, settings: { ...g.settings, diagramImageId: null } }))} className="mt-2 text-xs font-bold text-muted hover:text-coral-dark">
                    Change picture
                  </button>
                </>
              ) : (
                <div className="max-w-sm">
                  <ImagePicker value={null} onChange={(a) => setGame((g) => ({ ...g, diagramImageUrl: a?.url ?? null, settings: { ...g.settings, diagramImageId: a?.id ?? null } }))} />
                </div>
              )}
            </section>
          )}

          {ALPHABET_TEMPLATES.includes(template.key) && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl2 bg-teal-soft px-4 py-3 text-sm">
              <span className="flex-1 text-teal-dark">
                {template.key === "SPELL_THE_WORD"
                  ? "Start from the alphabet: one word for each of the 27 letters (árbol, barco, casa…)."
                  : "Start from the Spanish alphabet: 27 letters with their names. Any common name counts (“be larga”, “i griega”…)."}
              </span>
              <Button size="sm" variant="secondary" onClick={addAlphabet}>Add the Spanish alphabet</Button>
            </div>
          )}

          {game.items.map((it, i) => (
            <section
              key={it.id ?? `new-${i}`}
              className={`rounded-xl2 border bg-card p-5 ${template.activityImage && i === activePoint ? "border-teal ring-2 ring-teal/20" : "border-line"}`}
              aria-label={`${noun[0].toUpperCase()}${noun.slice(1)} ${i + 1}`}
              onFocusCapture={() => template.activityImage && setActivePoint(i)}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white">{i + 1}</span>
                <span className="text-sm font-bold capitalize text-muted">{noun}</span>
                {fields.point && (
                  <button type="button" onClick={() => setActivePoint(i)} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${it.data.x == null ? "bg-coral-soft text-coral-dark" : "bg-leaf-soft text-leaf"}`}>
                    {it.data.x == null ? (i === activePoint ? "Click the picture to place it" : "Not placed — choose") : i === activePoint ? "Placing… click the picture to move" : "Placed ✓"}
                  </button>
                )}
                <div className="ml-auto flex gap-1 text-xs font-bold text-muted">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-full px-2 py-1 hover:bg-paper-2 disabled:opacity-30" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === game.items.length - 1} className="rounded-full px-2 py-1 hover:bg-paper-2 disabled:opacity-30" aria-label="Move down">↓</button>
                  <button
                    type="button"
                    onClick={() =>
                      setGame((g) => ({
                        ...g,
                        items: [...g.items.slice(0, i + 1), { ...structuredClone(it), id: undefined, data: { ...it.data, x: undefined, y: undefined }, question: { ...structuredClone(it.question), id: undefined } }, ...g.items.slice(i + 1)],
                      }))
                    }
                    className="rounded-full px-2 py-1 hover:bg-paper-2"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm(`Delete this ${noun}?`) && setGame((g) => ({ ...g, items: g.items.filter((_, k) => k !== i) }))}
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

                  {fields.itemText && (
                    <SpanishField
                      label={fields.itemText.label}
                      hint={fields.itemText.required ? undefined : "optional"}
                      value={it.text}
                      language={game.language}
                      onChange={(v) => setItem(i, (x) => ({ ...x, text: v }))}
                      placeholder={fields.itemText.placeholder}
                      maxLength={120}
                    />
                  )}

                  <div>
                    <SpanishField label="Support line (other language)" hint="optional, spoken first" value={it.question.supportText} language={it.question.supportLanguage} onChange={(v) => setQ(i, { supportText: v })} placeholder="How do you say it in Spanish?" tags />
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <select aria-label="Support line language" value={it.question.supportLanguage} onChange={(e) => setQ(i, { supportLanguage: e.target.value as AppLanguage, supportAudioId: null })} className="rounded-lg border border-line bg-card px-2 py-1 text-xs">
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                      <AudioControl text={it.question.supportText} language={it.question.supportLanguage} voice={voiceMap[it.question.supportLanguage]} voices={voiceMap} rate={game.settings.rate} tts={tts} audio={{ id: it.question.supportAudioId, text: it.question.supportAudioText, url: it.question.supportAudioUrl }} onAudio={(a) => setQ(i, { supportAudioId: a?.id ?? null, supportAudioText: a?.text, supportAudioUrl: a?.url })} />
                    </div>
                  </div>

                  {fields.prompt && (
                    <div>
                      <SpanishField label="Question (spoken)" value={it.question.prompt} language={game.language} onChange={(v) => setQ(i, { prompt: v })} placeholder={template.promptPlaceholder} tags />
                      <div className="mt-1.5">
                        <AudioControl text={it.question.prompt} language={game.language} voice={game.settings.voice} voices={voiceMap} rate={game.settings.rate} tts={tts} audio={{ id: it.question.promptAudioId, text: it.question.promptAudioText, url: it.question.promptAudioUrl }} onAudio={(a) => setQ(i, { promptAudioId: a?.id ?? null, promptAudioText: a?.text, promptAudioUrl: a?.url })} />
                      </div>
                    </div>
                  )}

                  {(template.key !== "SPELL_YOUR_NAME" || it.question.spellTarget === "word") && (
                    <div>
                      <SpanishField
                        label={
                          template.key === "LISTEN_AND_SPEAK"
                            ? "Word or phrase to repeat"
                            : template.key === "SPELL_YOUR_NAME" || template.key === "SPELL_THE_WORD"
                              ? "Word to spell"
                              : it.question.evaluationMode === "LETTERS"
                                ? "Letter(s) to say"
                                : "Correct answer"
                        }
                        value={it.question.expectedAnswer}
                        language={it.question.answerLanguage ?? game.language}
                        onChange={(v) => setQ(i, { expectedAnswer: v })}
                        placeholder={template.answerPlaceholder}
                      />
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-ink-2">
                          Answer language
                          <select
                            aria-label="Answer language"
                            value={it.question.answerLanguage ?? ""}
                            onChange={(e) => setQ(i, { answerLanguage: (e.target.value || null) as AppLanguage | null })}
                            className="rounded-lg border border-line bg-card px-2 py-1 text-xs font-normal"
                          >
                            <option value="">Same as activity ({LANG_SHORT[game.language]})</option>
                            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{LANG_SHORT[l.code]}</option>)}
                          </select>
                        </label>
                        <span className="text-xs text-muted">The microphone listens in this language for this {noun}. It never switches by itself.</span>
                        {template.key === "LISTEN_AND_SPEAK" && (
                          <AudioControl text={it.question.expectedAnswer} language={it.question.answerLanguage ?? game.language} voice={voiceMap[it.question.answerLanguage ?? game.language]} voices={voiceMap} rate={game.settings.rate} tts={tts} audio={{ id: null }} onAudio={() => undefined} />
                        )}
                      </div>
                    </div>
                  )}

                  {fields.translation && (
                    <div>
                      <SpanishField label="Back of the card" hint="optional — translation or note" value={it.data.translation ?? ""} language={it.data.translationLanguage ?? "en-US"} onChange={(v) => setData(i, { translation: v })} placeholder="the apple" maxLength={200} />
                      <select aria-label="Back of the card language" value={it.data.translationLanguage ?? "en-US"} onChange={(e) => setData(i, { translationLanguage: e.target.value as AppLanguage })} className="mt-1.5 rounded-lg border border-line bg-card px-2 py-1 text-xs">
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  )}

                  {it.question.evaluationMode === "PHRASE" && (
                    <SpanishField
                      label="Other accepted answers"
                      hint="one per line"
                      multiline
                      value={it.question.accepted.join("\n")}
                      language={it.question.answerLanguage ?? game.language}
                      onChange={(v) => setQ(i, { accepted: v.split("\n") })}
                      placeholder={"Un perro\nEl perro"}
                      checkable={false}
                    />
                  )}
                  {!typedSpelling && (
                    <SpanishField label="Hint" hint="shown and spoken after the first incorrect try" value={it.question.hint} language={game.language} onChange={(v) => setQ(i, { hint: v })} placeholder="Hace “guau, guau”." tags />
                  )}
                  {typedSpelling && (
                    <SpanishField label="Hint" hint="shown after the first incorrect try" value={it.question.hint} language={game.language} onChange={(v) => setQ(i, { hint: v })} placeholder="Empieza con M." />
                  )}
                </div>
              </div>
            </section>
          ))}
          <button type="button" onClick={() => setGame((g) => ({ ...g, items: [...g.items, blankItem(template)] }))} className="w-full rounded-xl2 border-2 border-dashed border-line py-4 font-bold text-ink-2 hover:border-coral hover:text-coral">
            + Add {noun}
          </button>
        </div>

        <aside className="space-y-4">
          <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <SpanishField label="Activity title" value={game.title} onChange={(v) => set("title", v)} placeholder="Los animales" maxLength={120} />
            <SpanishField label="Description" multiline value={game.description} onChange={(v) => set("description", v)} maxLength={1000} />
            <SpanishField label="Instructions for students" hint="spoken at the start" multiline value={game.instructions} language={game.language} onChange={(v) => set("instructions", v)} placeholder="Mira la imagen y responde." maxLength={1000} tags />
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

          {template.options.length > 0 && (
            <section className="space-y-4 rounded-xl2 border border-line bg-card p-5" aria-label={`${template.name} options`}>
              <h2 className="font-display text-lg font-semibold">{template.name} options</h2>
              {template.options.map((o) => (
                <OptionInput key={o.key} o={o} value={options[o.key]} onChange={(v) => setOption(o.key, v)} disabled={o.key === "seconds" && !options.timed} />
              ))}
            </section>
          )}

          <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Voice &amp; answers</h2>
            <div>
              <Label htmlFor="lang">Activity language</Label>
              <Select id="lang" value={game.language} onChange={(e) => setGame((g) => ({ ...g, language: e.target.value as AppLanguage, settings: { ...g.settings, voice: undefined } }))}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </Select>
            </div>
            {tts?.provider ? (
              <div className="space-y-3">
                {LANGUAGES.map((l) => {
                  const list = voicesFor(l.code);
                  const main = l.code === game.language;
                  const value = main ? game.settings.voice : otherVoices[l.code];
                  return (
                    <div key={l.code}>
                      <Label htmlFor={`voice-${l.code}`} hint={main ? "main voice" : "for words marked in this language"}>{LANG_SHORT[l.code]} voice</Label>
                      <Select
                        id={`voice-${l.code}`}
                        value={value ?? list[0]?.id ?? ""}
                        onChange={(e) => (main ? setSettings({ voice: e.target.value }) : setSettings({ voices: { ...otherVoices, [l.code]: e.target.value } }))}
                      >
                        {list.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                      </Select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-paper-2 p-3 text-xs text-ink-2">
                {tts
                  ? "No text-to-speech provider is configured. Students hear the device's own voices (each marked run in its own language, when the device has that voice). Add AZURE_SPEECH_KEY or GOOGLE_CLOUD_API_KEY for natural, saved audio."
                  : "Loading voices…"}
              </p>
            )}
            <div>
              <Label htmlFor="rate" hint={`${game.settings.rate.toFixed(2)}×`}>Speed</Label>
              <input id="rate" type="range" min={0.6} max={1.2} step={0.05} value={game.settings.rate} onChange={(e) => setSettings({ rate: Number(e.target.value) })} className="w-full accent-teal" />
            </div>
            {template.defaults.evaluationMode === "PHRASE" && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={game.settings.acceptShortAnswer} onChange={(e) => setSettings({ acceptShortAnswer: e.target.checked })} />
                <span>
                  <strong>Accept the key word alone</strong>
                  <span className="block text-xs text-muted">“perro” counts for “Es un perro”. Turn off to require the full sentence.</span>
                </span>
              </label>
            )}
            <div>
              <Label htmlFor="tries">Tries before showing the answer</Label>
              <Select id="tries" value={game.settings.maxTries} onChange={(e) => setSettings({ maxTries: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </section>
        </aside>
      </div>
    </SpanishKeyboardProvider>
  );
}

function OptionInput({ o, value, onChange, disabled }: { o: OptionDef; value: string | number | boolean; onChange: (v: string | number | boolean) => void; disabled?: boolean }) {
  const id = `opt-${o.key}`;
  if (o.type === "boolean") {
    return (
      <label className="flex items-start gap-2 text-sm">
        <input id={id} type="checkbox" className="mt-1" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span>
          <strong>{o.label}</strong>
          {o.help && <span className="block text-xs text-muted">{o.help}</span>}
        </span>
      </label>
    );
  }
  if (o.type === "choice") {
    return (
      <div>
        <Label htmlFor={id}>{o.label}</Label>
        <Select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {o.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        {o.help && <p className="mt-1 text-xs text-muted">{o.help}</p>}
      </div>
    );
  }
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <Label htmlFor={id}>{o.label}</Label>
      <Input id={id} type="number" min={o.min} max={o.max} disabled={disabled} value={Number(value)} onChange={(e) => onChange(Math.min(o.max, Math.max(o.min, Number(e.target.value) || o.min)))} />
      {o.help && <p className="mt-1 text-xs text-muted">{o.help}</p>}
    </div>
  );
}
