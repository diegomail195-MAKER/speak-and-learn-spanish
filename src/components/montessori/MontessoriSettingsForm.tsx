"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { saveMontessoriSettings } from "@/lib/actions/montessori";
import { activitySetting, type MontessoriConfig } from "@/lib/montessori/config";
import { linesFor } from "@/lib/montessori/engine";
import { LEVEL_LABEL } from "@/lib/montessori/levels";
import { MESSAGES, renderMessage, usableVariants, type MessageDef } from "@/lib/montessori/messages";
import { NOUNS, type NounKey } from "@/lib/montessori/nouns";
import { ACTIVITY_LABEL, ACTIVITY_TYPES, LEVELS, type ActivityType } from "@/lib/montessori/types";

type Voice = { id: string; label: string; lang: "en" | "es" };

const GROUPS: Array<{ key: MessageDef["group"]; title: string }> = [
  { key: "success", title: "A. When the student succeeds" },
  { key: "support", title: "B. When the student needs repetition or support" },
  { key: "activity", title: "Activity-specific messages" },
  { key: "technical", title: "Technical problems (never recorded as mistakes)" },
  { key: "level", title: "Progress levels" },
];

function speakPreview(lines: Array<{ lang: "en" | "es"; text: string }>) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  for (const l of lines) {
    const u = new SpeechSynthesisUtterance(l.text);
    u.lang = l.lang === "es" ? "es-MX" : "en-US";
    speechSynthesis.speak(u);
  }
}

function Num({ label, value, min, max, onChange, help }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; help?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-bold">{label}</span>
      {help && <span className="block text-xs text-muted">{help}</span>}
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className="mt-1 h-10 w-24 rounded-lg border border-line bg-card px-2" />
    </label>
  );
}

function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (b: boolean) => void; help?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4" />
      <span>
        <span className="font-bold">{label}</span>
        {help && <span className="block text-xs text-muted">{help}</span>}
      </span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl2 border border-line bg-card p-5">
      <h2 className="mb-4 font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function MontessoriSettingsForm({ initial, voices, ttsConfigured }: { initial: MontessoriConfig; voices: Voice[]; ttsConfigured: boolean }) {
  const [c, setC] = useState<MontessoriConfig>(initial);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [sample, setSample] = useState<{ noun: NounKey; activity: ActivityType }>({ noun: "animal", activity: "speaking" });
  const set = <K extends keyof MontessoriConfig>(k: K, v: MontessoriConfig[K]) => setC((x) => ({ ...x, [k]: v }));
  const setPart = <K extends "conditions" | "guidedPractice" | "progress" | "challenge">(k: K, v: Partial<MontessoriConfig[K]>) => setC((x) => ({ ...x, [k]: { ...x[k], ...v } }));

  const previewCtx = useMemo(() => ({ activityType: sample.activity, noun: sample.noun, model: "Es un perro", labelEn: "dog", count: 3, total: 5 }), [sample]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus(null);
        start(async () => {
          const r = await saveMontessoriSettings(c);
          if (r.ok) {
            setC(r.config);
            setStatus({ ok: true, text: "Saved. Students see the new settings the next time they open an activity." });
          } else setStatus({ ok: false, text: r.error });
        });
      }}
    >
      <Section title="1. Feedback by activity type">
        <p className="mb-3 text-sm text-muted">Turn feedback on or off for each kind of activity. “Brief” describes each answer; “At the end” keeps the game flowing and gives feedback when the work is finished (memory and matching games start this way).</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIVITY_TYPES.map((t) => {
            const a = activitySetting(c, t);
            const update = (v: Partial<typeof a>) => set("activities", { ...c.activities, [t]: { ...a, ...v } });
            return (
              <div key={t} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2" data-testid={`activity-${t}`}>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={a.enabled} onChange={(e) => update({ enabled: e.target.checked })} className="h-4 w-4" />
                  {ACTIVITY_LABEL[t]}
                </label>
                <select value={a.perItem} disabled={!a.enabled} onChange={(e) => update({ perItem: e.target.value as "brief" | "silent" })} className="h-8 rounded-lg border border-line bg-card px-1 text-xs" aria-label={`Per-answer feedback for ${ACTIVITY_LABEL[t]}`}>
                  <option value="brief">Brief, after each answer</option>
                  <option value="silent">At the end</option>
                </select>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="2. Language and narration">
        <div className="flex flex-wrap gap-6">
          <fieldset>
            <legend className="text-sm font-bold">Feedback language</legend>
            {(["en", "es", "bilingual"] as const).map((l) => (
              <label key={l} className="mt-1 flex items-center gap-2 text-sm">
                <input type="radio" name="language" value={l} checked={c.language === l} onChange={() => set("language", l)} data-testid={`language-${l}`} />
                {l === "en" ? "1. English" : l === "es" ? "2. Español" : "3. Bilingual (English + Español)"}
              </label>
            ))}
          </fieldset>
          <fieldset disabled={c.language !== "bilingual"}>
            <legend className="text-sm font-bold">Read aloud in bilingual mode</legend>
            {(["activity", "es", "en", "both"] as const).map((l) => (
              <label key={l} className="mt-1 flex items-center gap-2 text-sm">
                <input type="radio" name="spoken" value={l} checked={c.spokenLanguage === l} onChange={() => set("spokenLanguage", l)} />
                {l === "activity" ? "The language the activity teaches" : l === "es" ? "Spanish line" : l === "en" ? "English line" : "Both lines"}
              </label>
            ))}
          </fieldset>
          <div className="space-y-2">
            <Toggle label="Read feedback aloud automatically" checked={c.autoNarration} onChange={(b) => set("autoNarration", b)} help="Off: students press 🔊 Listen to hear a message. Students can always mute." />
          </div>
        </div>
      </Section>

      <Section title="3. Voices">
        {ttsConfigured ? (
          <div className="flex flex-wrap gap-6">
            {(["en", "es"] as const).map((l) => (
              <label key={l} className="text-sm font-bold">
                {l === "en" ? "English (American English)" : "Español (latinoamericano neutro)"}
                <select value={c.voices[l]} onChange={(e) => set("voices", { ...c.voices, [l]: e.target.value })} className="mt-1 block h-10 rounded-lg border border-line bg-card px-2 font-normal">
                  <option value="">Default voice</option>
                  {voices.filter((v) => v.lang === l).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </label>
            ))}
            <p className="w-full text-xs text-muted">Feedback audio is generated with these voices when an activity is published (or published again).</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No natural-voice service is configured on this server (TTS_PROVIDER), so feedback is read by the device&apos;s own English and Spanish voices. Voice choices appear here once the service is set up.</p>
        )}
      </Section>

      <Section title="4. When messages appear">
        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Independent answers in a row" help="before “You did that independently.”" min={2} max={10} value={c.conditions.independenceStreak} onChange={(n) => setPart("conditions", { independenceStreak: n })} />
          <Num label="Tries on one item" help="before “That was challenging, and you kept working on it.”" min={2} max={6} value={c.conditions.persistenceTries} onChange={(n) => setPart("conditions", { persistenceTries: n })} />
          <Num label="Missed items in one activity" help="before “Let's try a different activity to practice this.”" min={2} max={10} value={c.conditions.repeatedErrorItems} onChange={(n) => setPart("conditions", { repeatedErrorItems: n })} />
          <Toggle label="Ask for the full sentence after a short answer" help="“Perro” for “Es un perro”: the word counts, then the sentence is modelled once." checked={c.conditions.offerFullSentence} onChange={(b) => setPart("conditions", { offerFullSentence: b })} />
        </div>
      </Section>

      <Section title="5. Guided practice">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle label="Offer to practice only the missed items" checked={c.guidedPractice.offerPracticeMissed} onChange={(b) => setPart("guidedPractice", { offerPracticeMissed: b })} />
          <Toggle label="Offer the same items as flashcards after repeated mistakes" checked={c.guidedPractice.offerAlternative} onChange={(b) => setPart("guidedPractice", { offerAlternative: b })} />
          <Num label="Items in “the first part”" help="when an activity is stopped before the end" min={1} max={10} value={c.guidedPractice.firstPartSize} onChange={(n) => setPart("guidedPractice", { firstPartSize: n })} />
        </div>
      </Section>

      <Section title="6. Progress criteria (visible to teachers)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Progressing: independent answers" min={1} max={10} value={c.progress.progressingIndependent} onChange={(n) => setPart("progress", { progressingIndependent: n })} />
          <Num label="Proficient: independent answers in a row" min={2} max={10} value={c.progress.proficientStreak} onChange={(n) => setPart("progress", { proficientStreak: n })} />
          <Num label="Proficient: different days" min={1} max={10} value={c.progress.proficientSessions} onChange={(n) => setPart("progress", { proficientSessions: n })} />
          <Num label="Extending: different activities" min={2} max={6} value={c.progress.extendingContexts} onChange={(n) => setPart("progress", { extendingContexts: n })} />
        </div>
      </Section>

      <Section title="7. New challenge">
        <div className="flex flex-wrap items-end gap-6">
          <Toggle label="Offer a new challenge after mastery" checked={c.challenge.enabled} onChange={(b) => setPart("challenge", { enabled: b })} help="The button leads to the student's next unfinished activity." />
          <label className="text-sm font-bold">
            When every item is at least
            <select value={c.challenge.minLevel} onChange={(e) => setPart("challenge", { minLevel: e.target.value as MontessoriConfig["challenge"]["minLevel"] })} className="mt-1 block h-10 rounded-lg border border-line bg-card px-2 font-normal">
              {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l].en}</option>)}
            </select>
          </label>
        </div>
      </Section>

      <Section title="8. Messages">
        <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-paper p-3 text-sm">
          <span className="font-bold">Preview with:</span>
          <label>
            Content{" "}
            <select value={sample.noun} onChange={(e) => setSample((x) => ({ ...x, noun: e.target.value as NounKey }))} className="h-8 rounded-lg border border-line bg-card px-1">
              {(Object.keys(NOUNS) as NounKey[]).map((n) => <option key={n} value={n}>{NOUNS[n].en}</option>)}
            </select>
          </label>
          <label>
            Activity{" "}
            <select value={sample.activity} onChange={(e) => setSample((x) => ({ ...x, activity: e.target.value as ActivityType }))} className="h-8 rounded-lg border border-line bg-card px-1">
              {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_LABEL[t]}</option>)}
            </select>
          </label>
          <span className="text-muted">Sample answer “Es un perro” (dog), 3 of 5 correct.</span>
        </div>
        <p className="mb-4 text-xs text-muted">Write one version per line; versions in English and Spanish are paired by line. Placeholders: {"{thing}"}, {"{things}"}, {"{verb}"}, {"{model}"}, {"{count}"}, {"{total}"}, {"{rest}"}, {"{all}"}; in Spanish also {"{el_thing}"}, {"{Verb}"}, {"{la_unit}"}. Each message keeps its stable id, whatever its text.</p>
        {GROUPS.map((g) => (
          <div key={g.key} className="mb-6">
            <h3 className="mb-2 font-bold">{g.title}</h3>
            <div className="space-y-3">
              {MESSAGES.filter((m) => m.group === g.key).map((m) => {
                const o = c.messages[m.id] ?? {};
                const disabled = c.disabledMessages.includes(m.id);
                const variants = usableVariants(m, previewCtx, c.messages);
                const preview = renderMessage(m.id, variants[0], previewCtx, c.messages);
                const lines = linesFor(preview, c);
                const setText = (lang: "en" | "es", text: string) => {
                  const list = text.split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 5);
                  const next = { ...o, [lang]: list.length ? list : undefined };
                  const msgs = { ...c.messages };
                  if (!next.en && !next.es) delete msgs[m.id];
                  else msgs[m.id] = next;
                  set("messages", msgs);
                };
                return (
                  <details key={m.id} className={`rounded-lg border border-line p-3 ${disabled ? "opacity-60" : ""}`} data-testid={`message-${m.id}`}>
                    <summary className="cursor-pointer text-sm">
                      <span className="font-bold">{m.n ? `${m.n}. ` : ""}{m.title}</span>
                      <code className="ml-2 rounded bg-paper-2 px-1 text-xs text-muted">{m.id}</code>
                      <span className="mt-1 block text-ink-2">{lines.show.map((l) => l.text).join(" / ")}</span>
                    </summary>
                    <p className="mt-2 text-xs text-muted"><strong>Condition:</strong> {m.condition}</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {(["en", "es"] as const).map((lang) => (
                        <label key={lang} className="text-xs font-bold">
                          {lang === "en" ? "English" : "Español"} {o[lang] ? "(custom)" : "(default)"}
                          <textarea rows={Math.max(2, (o[lang] ?? m[lang]).length)} defaultValue={(o[lang] ?? m[lang]).join("\n")} onBlur={(e) => setText(lang, e.target.value === m[lang].join("\n") ? "" : e.target.value)} className="mt-1 block w-full rounded-lg border border-line bg-card p-2 text-sm font-normal" />
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Toggle label="Show this message" checked={!disabled} onChange={(b) => set("disabledMessages", b ? c.disabledMessages.filter((x) => x !== m.id) : [...c.disabledMessages, m.id])} />
                      <button type="button" onClick={() => speakPreview(lines.show)} className="rounded-full bg-paper-2 px-3 py-1 text-xs font-bold" data-testid={`preview-${m.id}`}>🔊 Preview</button>
                      <span className="text-xs text-muted" data-testid={`preview-text-${m.id}`}>{lines.show.map((l) => l.text).join(" / ")}</span>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ))}
      </Section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-card p-3 shadow-pop">
        <Button type="submit" variant="voice" disabled={pending} data-testid="save-montessori">{pending ? "Saving…" : "Save settings"}</Button>
        {status && <span role="status" className={`text-sm font-bold ${status.ok ? "text-leaf" : "text-coral-dark"}`}>{status.text}</span>}
      </div>
    </form>
  );
}
