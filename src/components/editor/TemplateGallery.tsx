"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createGame } from "@/lib/actions/games";
import { FILTERS, type TemplateDef, type TemplateFilter } from "@/lib/games/templates";
import { PREVIEW_BG, TemplatePreview } from "./TemplatePreview";

const FEATURED = ["FLASHCARDS", "SPELL_THE_WORD", "SPIN_THE_WHEEL", "LABEL_THE_DIAGRAM", "OPEN_THE_BOX", "LISTEN_AND_SPEAK", "SPEAK_AND_ANSWER", "MATCH_AND_SPEAK"];
const WIDE = ["FLASHCARDS", "SPIN_THE_WHEEL"];

function Oral({ t }: { t: TemplateDef }) {
  const [text, tone] =
    t.answers === "voice"
      ? ["Answered out loud", "bg-teal-soft text-teal-dark"]
      : t.answers === "voice-or-typing"
        ? ["Out loud or typed — you choose", "bg-sky-soft text-sky"]
        : ["Speaking optional — you choose", "bg-sun-soft text-[#7a5200]"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path fill="currentColor" d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15Zm6-3.5a6 6 0 0 1-12 0H4.5a7.5 7.5 0 0 0 6.75 7.46V21h1.5v-2.04a7.5 7.5 0 0 0 6.75-7.46H18Z" /></svg>
      {text}
    </span>
  );
}

function CreateButton({ name }: { name: string }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("templateKey") === name;
  return (
    <button name="templateKey" value={name} disabled={pending} className="rounded-full bg-coral px-5 py-2 font-bold text-white shadow-soft transition hover:bg-coral-dark disabled:opacity-60">
      {mine ? "Creating…" : "Create"}
    </button>
  );
}

export function TemplateGallery({ templates }: { templates: TemplateDef[] }) {
  const [filter, setFilter] = useState<TemplateFilter | "all">("all");
  const ready = templates.filter((t) => t.available);
  const show = (t: TemplateDef) => filter === "all" || t.filters.includes(filter);
  const featured = FEATURED.map((k) => ready.find((t) => t.key === k)!).filter(Boolean).filter(show);
  const more = ready.filter((t) => !FEATURED.includes(t.key)).filter(show);
  const planned = templates.filter((t) => !t.available);

  return (
    <form action={createGame}>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter templates">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${filter === f.key ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-2 hover:border-ink-2"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => {
          const wide = WIDE.includes(t.key) && filter === "all";
          return (
            <article
              key={t.key}
              className={`group flex overflow-hidden rounded-[1.75rem] border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-soft ${wide ? "flex-col sm:col-span-2 md:flex-row" : "flex-col"}`}
              aria-labelledby={`tpl-${t.key}`}
            >
              <div className={`shrink-0 ${wide ? "aspect-[5/3] md:aspect-auto md:w-1/2" : "aspect-[5/3]"}`} style={{ background: PREVIEW_BG[t.key] }}>
                <TemplatePreview k={t.key} />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 id={`tpl-${t.key}`} className="font-display text-xl font-semibold leading-tight">
                  {t.name} <span className="block font-sans text-sm font-semibold text-muted">{t.nameEs}</span>
                </h2>
                <p className="text-sm text-ink-2">{t.description}</p>
                <p className="text-xs text-muted">{t.howItPlays}</p>
                {t.options.length > 0 && (
                  <p className="text-xs text-muted">
                    <span className="font-bold text-ink-2">Options:</span> {t.options.map((o) => o.label.replace(/ \(.*\)$/, "")).join(" · ")}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <Oral t={t} />
                  <CreateButton name={t.key} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {more.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-display text-xl font-semibold">More speaking templates</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-card">
            {more.map((t) => (
              <li key={t.key} className="flex items-center gap-4 px-4 py-3">
                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: PREVIEW_BG[t.key] }} aria-hidden="true">
                  <TemplatePreview k={t.key} />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold">
                    {t.name} <span className="font-sans text-sm font-semibold text-muted">· {t.nameEs}</span>
                  </span>
                  <span className="text-sm text-muted">{t.description}</span>
                </span>
                <span className="hidden sm:block"><Oral t={t} /></span>
                <CreateButton name={t.key} />
              </li>
            ))}
          </ul>
        </>
      )}

      {featured.length === 0 && more.length === 0 && <p className="text-muted">No templates in this group.</p>}

      {filter === "all" && planned.length > 0 && (
        <p className="mt-8 text-sm text-muted">
          Planned, not available yet: {planned.map((t) => t.key.toLowerCase().replace(/_/g, " ")).join(", ")}.
        </p>
      )}
    </form>
  );
}
