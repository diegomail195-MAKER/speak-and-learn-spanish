"use client";

import { FontPreview } from "./FontPreview";
import { OptionInput } from "./OptionInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Panel";
import { duplicateGame } from "@/lib/actions/games";
import { maxItemsFor, templateOptions, type OptionDef, type TemplateDef } from "@/lib/games/templates";
import { SPELL_TOKENS, type EditorGame, type EditorItem } from "@/lib/games/types";
import { LANGUAGES, type AppLanguage } from "@/lib/tts/voices";
import { AudioControl, type TtsConfig } from "./AudioControl";
import { AudioDefaultsContext, AudioField, type AudioDefaults } from "./AudioField";
import { DiagramPoints } from "./DiagramPoints";
import { FaceEditor, FlashcardPreview, RowControls, swapItem } from "./FlashcardParts";
import { UiLangProvider, useUi } from "./i18n";
import { ImageField, mediaSrc } from "./ImageField";
import { SpanishField } from "./SpanishField";
import { CorrectionNote, useAutocorrect } from "./useAutocorrect";

type Category = { id: string; nameEn: string; nameEs: string };
type SaveState = "saved" | "dirty" | "saving" | "error";

const LANG_SHORT: Record<AppLanguage, string> = { "es-419": "Spanish", "en-US": "English", "fr-FR": "French" };

const newKey = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Gives every item a stable client key; old flashcards get their back text from the translation. */
function prepareItems(items: EditorItem[], t: TemplateDef): EditorItem[] {
  return items.map((it) => {
    const x = { ...it, key: it.key ?? newKey() };
    if (t.board === "flashcards" && !x.data.back && x.data.translation) x.data = { ...x.data, back: { text: x.data.translation } };
    return x;
  });
}

/** The editor's starting state for a game loaded from the server. */
function editorState(g: EditorGame, t: TemplateDef): EditorGame {
  return g.items.length ? { ...g, items: prepareItems(g.items, t) } : { ...g, items: Array.from({ length: t.minItems ?? 1 }, () => blankItem(t)) };
}

const stable = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(stable) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined && x !== null).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, stable(x)])) : v;

/** The content a save writes (no ids, keys, URLs or status), to tell real edits from a publish. */
function contentSnapshot(g: EditorGame): string {
  return JSON.stringify(
    stable({
      title: g.title.trim(),
      description: g.description,
      topic: g.topic,
      instructions: g.instructions,
      items: g.items.map((it) => ({
        text: it.text,
        imageAssetId: it.imageAssetId,
        data: it.data,
        prompt: it.question.prompt,
        expectedAnswer: it.question.expectedAnswer,
        accepted: it.question.accepted.filter((a) => a.trim()),
        hint: it.question.hint,
        supportText: it.question.supportText,
      })),
    }),
  );
}

function blankItem(t: TemplateDef): EditorItem {
  const name = t.key === "SPELL_YOUR_NAME";
  return {
    key: newKey(),
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

type LibrarySlots = { picker: ReactNode; list: ReactNode };

export function GameEditor(props: { initial: EditorGame; template: TemplateDef; categories: Category[]; library?: LibrarySlots }) {
  return (
    <UiLangProvider>
      <GameEditorInner {...props} />
    </UiLangProvider>
  );
}

function GameEditorInner({ initial, template, categories, library }: { initial: EditorGame; template: TemplateDef; categories: Category[]; library?: LibrarySlots }) {
  const router = useRouter();
  const { t, lang: uiLang, setLang: setUiLang } = useUi();
  const [game, setGame] = useState<EditorGame>(() => editorState(initial, template));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ item: EditorItem; index: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!!initial.instructions.trim());
  const [save, setSave] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [tts, setTts] = useState<TtsConfig | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "publish" | "assign" | "preview" | "duplicate" | "done">("");
  const [editPractice, setEditPractice] = useState(false);
  const [restore, setRestore] = useState<EditorGame | null>(null);
  const [activePoint, setActivePoint] = useState(0);
  const first = useRef(true);
  const dupForm = useRef<HTMLFormElement>(null);
  const backupKey = `sls-editor-${initial.id}`;
  // Version on the server this screen is based on, and the content it last saved or loaded.
  // Saves send the version; the server refuses them if someone saved in between.
  const baseRef = useRef(initial.updatedAt);
  const savedSnap = useRef(contentSnapshot(initial));
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const edited = useRef(false);
  const [conflict, setConflict] = useState<EditorGame | null>(null);
  const live = useRef({ game, save, conflict });
  useEffect(() => {
    live.current = { game, save, conflict };
  });

  /** Replaces the screen with a version loaded from the server (not an edit, so no autosave). */
  const adopt = useCallback(
    (server: EditorGame) => {
      first.current = true;
      baseRef.current = server.updatedAt;
      savedSnap.current = contentSnapshot(server);
      edited.current = false;
      setGame(editorState(server, template));
      setSave("saved");
    },
    [template],
  );

  // The page may come from the browser's cache (Back button, an old tab): if the server already
  // has a newer version and nothing was typed yet, show that one instead.
  useEffect(() => {
    let gone = false;
    fetch(`/api/games/${initial.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<EditorGame>) : null))
      .then((server) => {
        if (!gone && server && server.updatedAt !== baseRef.current && !edited.current) adopt(server);
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, [initial.id, adopt]);

  useEffect(() => {
    fetch("/api/tts").then((r) => r.json()).then(setTts).catch(() => setTts({ provider: null, voices: [] }));
    try {
      const raw = localStorage.getItem(backupKey);
      if (raw) {
        const b = JSON.parse(raw) as EditorGame;
        const strip = (items: EditorItem[]) => JSON.stringify(items.map((x) => ({ ...x, key: undefined })));
        if (strip(b.items) !== strip(prepareItems(initial.items, template)) || b.title !== initial.title) setRestore(b);
        else localStorage.removeItem(backupKey);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBody = (g: EditorGame) =>
    JSON.stringify({
      ...g,
      baseUpdatedAt: baseRef.current,
      items: g.items.map((it) => ({ ...it, question: { ...it.question, accepted: it.question.accepted.filter((a) => a.trim()) } })),
    });

  const persist = useCallback(
    (g: EditorGame): Promise<boolean> => {
      // One save at a time: each one needs the version the previous one produced.
      const run = chain.current.then(async () => {
        setSave("saving");
        try {
          for (let attempt = 0; ; attempt++) {
            const res = await fetch(`/api/games/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: saveBody(g) });
            const json = await res.json().catch(() => ({}));
            if (res.status === 409 && json.error === "stale_version") {
              const server = (await fetch(`/api/games/${g.id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))) as EditorGame | null;
              // Only the status changed (e.g. Publish): same content, so continue from that version.
              if (server && attempt === 0 && contentSnapshot(server) === savedSnap.current) {
                baseRef.current = server.updatedAt;
                continue;
              }
              setConflict(server);
              setSave("error");
              setSaveError("");
              return false;
            }
            if (!res.ok) throw new Error(json.error ?? `Save failed (${res.status})`);
            if (json.updatedAt) baseRef.current = json.updatedAt;
            savedSnap.current = contentSnapshot(g);
            setSave("saved");
            setSaveError("");
            setSavedAt(new Date());
            try {
              localStorage.removeItem(backupKey);
            } catch {}
            return true;
          }
        } catch (e) {
          setSave("error");
          setSaveError((e as Error).message);
          return false;
        }
      });
      chain.current = run.catch(() => {});
      return run;
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
    edited.current = true;
    setSave("dirty");
    try {
      localStorage.setItem(backupKey, JSON.stringify(game));
    } catch {}
    // While there is a newer version elsewhere, wait for the teacher's choice.
    if (live.current.conflict) return;
    const t = setTimeout(() => persist(game), 2500);
    return () => clearTimeout(t);
  }, [game, persist, backupKey]);

  // Leaving with unsaved changes. Links: save first, then go (or ask if the save fails).
  // Back button and other in-app navigation: send the last changes as the editor closes.
  useEffect(() => {
    const unsaved = () => live.current.save !== "saved";
    const onClick = (e: MouseEvent) => {
      if (!unsaved() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      e.stopPropagation();
      const go = () => router.push(url.pathname + url.search + url.hash);
      if (live.current.conflict) {
        if (window.confirm(t.leaveUnsaved)) go();
        return;
      }
      setBusy("done");
      persist(live.current.game).then((ok) => {
        if (ok || window.confirm(t.leaveUnsaved)) go();
        else setBusy("");
      });
    };
    const flush = () => {
      const { game: g, save: s, conflict: c } = live.current;
      if (s === "saved" || c) return;
      try {
        fetch(`/api/games/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: saveBody(g), keepalive: true }).catch(() => {});
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persist, router, t.leaveUnsaved]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save === "dirty" || save === "saving" || save === "error") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  const set = <K extends keyof EditorGame>(k: K, v: EditorGame[K]) => setGame((g) => ({ ...g, [k]: v }));
  const titleAuto = useAutocorrect((v) => set("title", v), game.language, { singleLine: true });
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

  const maxItems = maxItemsFor(template);
  const atMax = game.items.length >= maxItems;
  const reorder = (from: number, to: number) =>
    setGame((g) => {
      if (from === to) return g;
      const items = [...g.items];
      const [x] = items.splice(from, 1);
      items.splice(to, 0, x);
      return { ...g, items };
    });
  const duplicateItem = (i: number) =>
    setGame((g) => {
      if (g.items.length >= maxItems) return g;
      const it = g.items[i];
      const copy: EditorItem = { ...structuredClone(it), id: undefined, key: newKey(), data: { ...structuredClone(it.data), x: undefined, y: undefined }, question: { ...structuredClone(it.question), id: undefined } };
      return { ...g, items: [...g.items.slice(0, i + 1), copy, ...g.items.slice(i + 1)] };
    });
  const remove = (i: number) => {
    setLastDeleted({ item: game.items[i], index: i });
    setGame((g) => ({ ...g, items: g.items.filter((_, k) => k !== i) }));
  };
  const undoDelete = () => {
    if (!lastDeleted) return;
    setGame((g) => {
      const items = [...g.items];
      items.splice(Math.min(lastDeleted.index, items.length), 0, lastDeleted.item);
      return { ...g, items };
    });
    setLastDeleted(null);
  };
  useEffect(() => {
    if (!lastDeleted) return;
    const tm = setTimeout(() => setLastDeleted(null), 10_000);
    return () => clearTimeout(tm);
  }, [lastDeleted]);
  const swapAll = () => setGame((g) => ({ ...g, items: g.items.map(swapItem) }));

  const options = templateOptions(template, game.settings.options);
  const flash = template.board === "flashcards";
  const twoSided = flash && (options.sides ?? "two") !== "one";
  const setOption = (k: string, v: string | number | boolean) => setSettings({ options: { ...options, [k]: v } });
  const voicesFor = (l: AppLanguage) => (tts?.voices ?? []).filter((v) => v.language === l);
  const otherVoices = game.settings.voices ?? {};
  // Voices for every language, so marked runs ("…en español, [en]love[/en]?") use the teacher's choice.
  const voiceMap: Partial<Record<AppLanguage, string>> = { ...otherVoices, ...(game.settings.voice ? { [game.language]: game.settings.voice } : {}) };
  // The Audio panel starts from these and can save its choice as the activity default.
  const audioDefaults: AudioDefaults = {
    voices: voiceMap,
    rate: game.settings.rate,
    set: (language, voice, rate) =>
      setGame((g) => {
        const main = language === g.language;
        const voices = voice && !main ? { ...(g.settings.voices ?? {}), [language]: voice } : g.settings.voices;
        return { ...g, settings: { ...g.settings, rate, voices, ...(voice && main ? { voice } : {}) } };
      }),
  };
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

  /** Done: save, then open the activity (play it, Edit Content, Printables). */
  async function finishEditing(hash = "") {
    setBusy("done");
    if (await persist(game)) router.push(`/play/preview/${game.id}${hash}`);
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

  const questionFields = (it: EditorItem, i: number) => (
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

                  {fields.itemText && !flash && (
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

                  {fields.translation && !flash && (
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
  );

  const settingsSections = (
    <>
          <section className="space-y-4 rounded-xl2 border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <SpanishField label="Description" multiline value={game.description} onChange={(v) => set("description", v)} maxLength={1000} />
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
              {template.options.filter((o) => o.key !== "sides" && o.key !== "letsPractice").map((o) => (
                <div key={o.key} className="space-y-2">
                  <OptionInput o={o} value={options[o.key]} onChange={(v) => setOption(o.key, v)} disabled={o.key === "seconds" && !options.timed} />
                  {o.key === "font" && <FontPreview font={String(options.font ?? "default")} />}
                </div>
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
                        value={value ?? (list.find((v) => v.recommended) ?? list[0])?.id ?? ""}
                        onChange={(e) => (main ? setSettings({ voice: e.target.value }) : setSettings({ voices: { ...otherVoices, [l.code]: e.target.value } }))}
                      >
                        {list.map((v) => <option key={v.id} value={v.id}>{v.description ? `${v.label} — ${v.description}` : v.label}</option>)}
                      </Select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-paper-2 p-3 text-xs text-ink-2">
                {tts
                  ? "No voice service is configured. Students hear the device's own voices (each marked run in its own language, when the device has that voice). Set TTS_PROVIDER=gateway on Vercel (or an Azure/Google key) for natural, saved audio."
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
    </>
  );

  return (
    <AudioDefaultsContext.Provider value={audioDefaults}>
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

      {conflict && (
        <div role="alert" className="mb-4 rounded-xl2 border-2 border-coral bg-coral-soft px-4 py-3 text-sm">
          <p className="font-bold">{t.conflictTitle}</p>
          <p className="mt-1">{t.conflictBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { const c = conflict; setConflict(null); try { localStorage.removeItem(backupKey); } catch {} adopt(c); }}>{t.conflictLoad}</Button>
            <Button size="sm" variant="ghost" onClick={() => { baseRef.current = conflict.updatedAt; savedSnap.current = contentSnapshot(conflict); setConflict(null); persist(game); }}>{t.conflictKeep}</Button>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-5 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <Link href="/teacher/my-activities" className="text-sm font-bold text-muted hover:text-ink">← My Activities</Link>
        <Badge tone="sky">{template.name}</Badge>
        <Badge tone={game.status === "PUBLISHED" ? "leaf" : "neutral"}>{game.status === "PUBLISHED" ? "Published" : game.status === "ARCHIVED" ? "Archived" : "Draft"}</Badge>
        <span
          data-testid="save-status"
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${save === "error" ? "bg-coral-soft text-coral-dark" : save === "saved" ? "bg-leaf-soft text-leaf" : "bg-paper-2 text-ink-2"}`}
          aria-live="polite"
          title={save === "error" ? saveError : savedAt ? savedAt.toLocaleTimeString() : undefined}
        >
          {busy === "done" && save !== "saved" ? t.leaving : save === "saved" ? `✓ ${t.saved}` : save === "saving" ? t.saving : save === "dirty" ? t.unsaved : conflict ? `⚠ ${t.conflictStatus}` : `⚠ ${t.saveError}`}
          {save === "error" && !conflict && (
            <button type="button" onClick={saveDraft} className="underline">{t.retry}</button>
          )}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-paper-2 p-0.5 text-xs font-bold" role="group" aria-label="Language / Idioma">
            {(["es", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setUiLang(l)} aria-pressed={uiLang === l} className={`rounded-full px-2 py-1 ${uiLang === l ? "bg-card text-ink shadow-sm" : "text-muted"}`}>{l.toUpperCase()}</button>
            ))}
          </div>
          {flash && (
            <Button size="sm" variant="secondary" onClick={() => finishEditing("#activity-settings")} disabled={!!busy} data-testid="open-activity-settings">
              ⚙ {t.activitySettings}
            </Button>
          )}
          {flash && library?.picker}
          <Button size="sm" variant="ghost" onClick={duplicate} disabled={!!busy}>{busy === "duplicate" ? "Duplicating…" : "Duplicate"}</Button>
          {flash && <Button size="sm" variant="secondary" onClick={() => setShowPreview(true)}>👁 {t.preview}</Button>}
          <Button size="sm" variant="secondary" onClick={preview} disabled={!!busy}>{flash ? "Play" : "Preview"}</Button>
          <Button size="sm" onClick={doPublish} disabled={!!busy}>
            {busy === "publish" ? "Publishing…" : game.status === "PUBLISHED" ? "Update published" : "Publish"}
          </Button>
          <Button size="sm" variant="voice" onClick={assign} disabled={!!busy}>{busy === "assign" ? "Publishing…" : "Assign"}</Button>
        </div>
      </div>

      <section className="mb-4 space-y-2">
        <label htmlFor="game-title" className="block text-sm font-bold text-ink-2">{t.title}</label>
        <div className="relative">
          <input
            id="game-title"
            value={game.title}
            {...titleAuto.props}
            maxLength={120}
            placeholder={t.untitled}
            lang={game.language === "es-419" ? "es" : game.language}
            className="w-full rounded-xl border border-line bg-card px-4 py-3 font-display text-xl font-semibold focus:border-sky focus:outline-none focus:ring-3 focus:ring-sky/20"
          />
          <CorrectionNote notice={titleAuto.notice} className="absolute -bottom-3 right-4 z-10" />
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted" data-testid="autocorrect-help">
          <span aria-hidden>✨</span>
          <span><strong className="text-ink-2">{t.autoTitle}.</strong> {t.autoHelp}</span>
        </p>
        {flash && (
          <p className="flex items-start gap-1.5 text-xs text-muted" data-testid="paste-help">
            <span aria-hidden>📋</span>
            <span>{t.pasteHint}</span>
          </p>
        )}
        {showInstructions ? (
          <div>
            <SpanishField label={t.instructions} hint="spoken at the start" multiline value={game.instructions} language={game.language} onChange={(v) => set("instructions", v)} placeholder="Mira la imagen y responde." maxLength={1000} tags />
            <button type="button" onClick={() => (set("instructions", ""), setShowInstructions(false))} className="mt-1 text-xs font-bold text-muted hover:text-coral-dark">{t.hideInstructions}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowInstructions(true)} className="text-sm font-bold text-ink-2 hover:text-coral">+ {t.addInstructions}</button>
        )}
      </section>

      {showPreview && <FlashcardPreview items={game.items} twoSided={twoSided} rate={game.settings.rate} language={game.language} onClose={() => setShowPreview(false)} />}

      {problems.length > 0 && (
        <div role="alert" className="mb-6 rounded-xl2 bg-coral-soft p-4 text-sm text-coral-dark">
          <p className="font-bold">Before publishing:</p>
          <ul className="mt-1 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      <div className={flash ? "" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"}>
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
                  <ImageField assetId={null} onChange={(a) => setGame((g) => ({ ...g, diagramImageUrl: a?.url ?? null, settings: { ...g.settings, diagramImageId: a?.id ?? null } }))} />
                </div>
              )}
            </section>
          )}

          {flash && (
            <div className="flex flex-wrap items-center gap-3 px-2">
              <div role="radiogroup" aria-label={template.name} className="flex gap-4 text-sm font-bold">
                {(["two", "one"] as const).map((v) => (
                  <label key={v} className="flex cursor-pointer items-center gap-1.5">
                    <input type="radio" name="sides" checked={(options.sides ?? "two") === v} onChange={() => setOption("sides", v)} />
                    {v === "two" ? t.twoSides : t.oneSide}
                  </label>
                ))}
              </div>
              {twoSided && (
                <Button size="sm" variant="secondary" onClick={swapAll} className="ml-auto">⇄ {t.swap}</Button>
              )}
              {!twoSided && <p className="w-full text-xs text-muted">{t.backHiddenOne}</p>}
            </div>
          )}

          {flash && twoSided && (
            <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-2 text-sm font-bold text-ink-2 md:grid xl:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <span />
              <span>{t.front}</span>
              <span>{t.back}</span>
            </div>
          )}

          <ol className={flash ? "space-y-1" : "space-y-3"} aria-label={`${template.name}: ${game.items.length}`}>
            {game.items.map((it, i) => {
              const controls = (
                <RowControls
                  index={i}
                  count={game.items.length}
                  canDuplicate={!atMax}
                  onMove={(d) => move(i, d)}
                  onDuplicate={() => duplicateItem(i)}
                  onDelete={() => remove(i)}
                  onDragStart={() => setDragFrom(i)}
                />
              );
              const rowKey = it.key ?? it.id ?? `new-${i}`;
              const rowProps = {
                onDragOver: (e: React.DragEvent) => dragFrom !== null && (e.preventDefault(), setDragOver(i)),
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault();
                  if (dragFrom !== null) reorder(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                },
                onDragEnd: () => (setDragFrom(null), setDragOver(null)),
              };
              const dropMark = dragOver === i && dragFrom !== null && dragFrom !== i ? "ring-2 ring-sky" : "";

              if (flash) {
                const back = it.data.back ?? {};
                return (
                  <li key={rowKey} {...rowProps} className={`rounded-xl px-2 py-1 hover:bg-card ${dropMark} ${dragFrom === i ? "opacity-50" : ""}`} aria-label={`${t.card[0].toUpperCase()}${t.card.slice(1)} ${i + 1}`}>
                    <div className={`grid items-start gap-x-3 gap-y-1 ${twoSided ? "md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]" : "xl:grid-cols-[2.5rem_minmax(0,1fr)_auto]"} grid-cols-[2.5rem_minmax(0,1fr)]`}>
                      <span className={`self-start text-right font-display text-base font-semibold text-ink-2 ${twoSided ? "pt-8 md:pt-3" : "pt-3"}`}>{i + 1}.</span>
                      <FaceEditor
                        label={t.front}
                        showLabel={twoSided}
                        face={{ text: it.text, imageAssetId: it.imageAssetId, imageAlt: it.data.imageAlt, audio: it.data.audio }}
                        language={game.language}
                        tts={tts}
                        rate={game.settings.rate}
                        onChange={(f) => setItem(i, (x) => ({ ...x, text: f.text ?? "", imageAssetId: f.imageAssetId ?? null, imageUrl: mediaSrc(f.imageAssetId), data: { ...x.data, imageAlt: f.imageAlt, audio: f.audio ?? null } }))}
                      />
                      {twoSided && (
                        <FaceEditor
                          className="col-start-2 md:col-start-auto"
                          label={t.back}
                          showLabel
                          face={back}
                          language={it.data.translationLanguage ?? (game.language === "es-419" ? "en-US" : "es-419")}
                          tts={tts}
                          rate={game.settings.rate}
                          onChange={(f) => setData(i, { back: f, translation: undefined })}
                        />
                      )}
                      <div className={`col-start-2 flex flex-wrap items-center justify-end gap-1 self-start xl:col-span-1 xl:col-start-auto xl:pt-2 ${twoSided ? "md:col-span-2" : ""}`}>
                        {twoSided && (
                          <button type="button" onClick={() => setItem(i, swapItem)} className="rounded-full px-2 py-1 text-xs font-bold text-muted hover:bg-paper-2 hover:text-ink" aria-label={`${t.swapOne} ${i + 1}`} title={t.swapOne}>⇄</button>
                        )}
                        {controls}
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={rowKey}
                  {...rowProps}
                  className={`rounded-xl2 border bg-card p-5 ${template.activityImage && i === activePoint ? "border-teal ring-2 ring-teal/20" : "border-line"} ${dropMark} ${dragFrom === i ? "opacity-50" : ""}`}
                  aria-label={`${noun[0].toUpperCase()}${noun.slice(1)} ${i + 1}`}
                  onFocusCapture={() => template.activityImage && setActivePoint(i)}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white">{i + 1}</span>
                    <span className="text-sm font-bold capitalize text-muted">{noun}</span>
                    {fields.point && (
                      <button type="button" onClick={() => setActivePoint(i)} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${it.data.x == null ? "bg-coral-soft text-coral-dark" : "bg-leaf-soft text-leaf"}`}>
                        {it.data.x == null ? (i === activePoint ? "Click the picture to place it" : "Not placed — choose") : i === activePoint ? "Placing… click the picture to move" : "Placed ✓"}
                      </button>
                    )}
                    <div className="ml-auto">{controls}</div>
                  </div>
                  <div className={`grid gap-5 ${fields.image !== "none" ? "md:grid-cols-[220px_minmax(0,1fr)]" : ""}`}>
                    <div className="space-y-3">
                      {fields.image !== "none" && (
                        <div>
                          <Label>{t.addImage} {fields.image === "optional" && <span className="font-normal text-muted">(optional)</span>}</Label>
                          <ImageField
                            assetId={it.imageAssetId}
                            alt={it.data.imageAlt}
                            suggest={it.text || it.question.expectedAnswer}
                            onChange={(a) => setItem(i, (x) => ({ ...x, imageAssetId: a?.id ?? null, imageUrl: a?.url ?? null }))}
                            onAlt={(alt) => setData(i, { imageAlt: alt })}
                          />
                        </div>
                      )}
                      {template.board !== "diagram" && template.key !== "SPELL_YOUR_NAME" && (
                      <div>
                        <Label hint={template.key === "SPELL_THE_WORD" ? "plays as “Hear the word”" : undefined}>{t.itemAudio}</Label>
                        <AudioField
                          audio={it.data.audio}
                          onChange={(a) => setData(i, { audio: a })}
                          defaultText={template.key === "SPELL_THE_WORD" || template.key === "LISTEN_AND_SPEAK" ? it.question.expectedAnswer : it.text || it.question.expectedAnswer}
                          defaultLanguage={it.question.answerLanguage ?? game.language}
                          tts={tts}
                          rate={game.settings.rate}
                          label={`${noun} ${i + 1}`}
                        />
                      </div>
                      )}
                    </div>
                    {questionFields(it, i)}
                  </div>
                </li>
              );
            })}
          </ol>

          {lastDeleted && (
            <div role="status" className="sticky bottom-3 z-10 mx-auto flex w-fit items-center gap-3 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-soft">
              {t.deleted}
              <button type="button" onClick={undoDelete} className="font-bold text-sun underline">{t.undo}</button>
            </div>
          )}

          <div className={`flex flex-wrap items-center gap-3 ${flash ? "pl-12" : ""}`}>
            <button
              type="button"
              disabled={atMax}
              onClick={() => setGame((g) => (g.items.length >= maxItems ? g : { ...g, items: [...g.items, blankItem(template)] }))}
              className={`${flash ? "rounded-full px-4 py-2 hover:bg-coral-soft" : "flex-1 rounded-xl2 border-2 border-dashed border-line py-4 hover:border-coral"} font-bold text-ink-2 hover:text-coral disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-ink-2`}
            >
              + {flash ? t.addItem : `${t.add} ${noun}`}
            </button>
            <span className={`text-sm font-bold ${atMax ? "text-coral-dark" : "text-muted"}`} aria-live="polite">
              {game.items.length} {t.of} {maxItems}
              {flash && !atMax && <span className="block text-[11px] font-semibold">{t.minMax} {maxItems}</span>}
              {atMax && <span className="block text-xs font-semibold">{t.limitReached}</span>}
            </span>
            {flash && (
              options.letsPractice ? (
                <span className="ml-auto inline-flex flex-wrap items-center gap-2 rounded-full bg-teal-soft px-4 py-2 text-sm font-bold text-teal-dark" data-testid="practice-created">
                  🎤 {t.practiceOn}
                  <button type="button" onClick={() => setEditPractice((v) => !v)} aria-expanded={editPractice} aria-controls="practice-editor" data-testid="practice-edit" className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-teal-dark hover:bg-teal hover:text-white">✏️ {t.practiceEdit}</button>
                  <button type="button" onClick={() => setOption("letsPractice", false)} className="rounded-full px-2 text-xs font-bold text-muted hover:bg-white hover:text-coral-dark">{t.practiceRemove}</button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOption("letsPractice", true)}
                  data-testid="create-practice"
                  title={t.practiceHelp}
                  className="ml-auto inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 font-bold text-white shadow-[0_2px_0_var(--color-coral-dark)] hover:bg-coral-dark"
                >
                  <span aria-hidden>🎤</span>
                  <span className="leading-tight text-left">
                    <span className="block">Let&apos;s practice</span>
                    <span className="block text-[11px] font-semibold text-white/85">{t.practiceCreate}</span>
                  </span>
                </button>
              )
            )}
          </div>

          {flash && options.letsPractice && editPractice && (
            <section id="practice-editor" aria-label={t.practiceEditTitle} className="rounded-xl2 border-2 border-teal/30 bg-card p-4" data-testid="practice-editor">
              <h2 className="font-display text-lg font-semibold">🎤 {t.practiceEditTitle}</h2>
              <p className="mb-3 text-sm text-muted">{t.practiceEditHelp}</p>
              <ol className="space-y-3">
                {game.items.map((it, i) => {
                  const front = it.text.trim();
                  const back = (it.data.back?.text ?? "").trim();
                  const answer = it.question.expectedAnswer.trim() || back || front;
                  if (!answer) return null;
                  return (
                    <li key={it.key ?? it.id ?? i} className="grid gap-3 rounded-xl bg-paper p-3 md:grid-cols-[160px_1fr_1fr]" data-testid="practice-row">
                      <div className="flex items-center gap-2">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        ) : null}
                        <span className="min-w-0 text-sm">
                          <span className="block text-xs font-bold text-muted">{t.practiceAnswer}</span>
                          <strong className="break-words">{answer.replace(/\[\/?[a-z-]+\]/gi, "")}</strong>
                        </span>
                      </div>
                      <label className="text-sm">
                        <span className="mb-1 block text-xs font-bold text-ink-2">{t.practiceQuestion}</span>
                        <input value={it.question.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} maxLength={400} placeholder="¿Qué es esto?" className="h-10 w-full rounded-xl border border-line bg-card px-3" data-testid="practice-question" lang="es" />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block text-xs font-bold text-ink-2">{t.practiceAccepted}</span>
                        <input
                          defaultValue={it.question.accepted.join(", ")}
                          onBlur={(e) => setQ(i, { accepted: e.target.value.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 20) })}
                          placeholder="púrpura, violeta"
                          className="h-10 w-full rounded-xl border border-line bg-card px-3"
                          data-testid="practice-accepted"
                          lang="es"
                        />
                      </label>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {flash && library?.list}

          {flash && (
            <div className="sticky bottom-0 z-20 -mx-5 mt-6 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur">
              <Button onClick={() => finishEditing()} disabled={!!busy} className="min-w-36" data-testid="editor-done">
                {busy === "done" ? t.saving : t.done}
              </Button>
            </div>
          )}
        </div>

        {!flash && <aside className="space-y-4">{settingsSections}</aside>}
      </div>
    </AudioDefaultsContext.Provider>
  );
}

