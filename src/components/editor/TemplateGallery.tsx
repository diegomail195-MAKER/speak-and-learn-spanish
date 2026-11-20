"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ActivityTypeIcon } from "@/components/activity/ActivityTypeIcon";
import { createGame } from "@/lib/actions/games";
import { activityDescription, activityName, sortActivityTypes, type ActivityLang } from "@/lib/games/activityTypes";
import type { TemplateDef } from "@/lib/games/templates";
import { UiLangProvider, useUi } from "./i18n";

// Create Activity (Teacher View and Platform Admin): two columns of horizontal cards, 3D icon on
// the left, name and short description on the right. The whole card is the button: it submits
// the template key to createGame, which creates the activity and opens its editor.

type Sort = "recommended" | "alphabetical";
const SORT_KEY = "sls-create-activity-sort";

function TypeCard({ t, lang }: { t: TemplateDef; lang: ActivityLang }) {
  const { pending, data } = useFormStatus();
  const { t: ui } = useUi();
  const mine = pending && data?.get("templateKey") === t.key;
  const name = activityName(t.key, lang);
  return (
    <button
      type="submit"
      name="templateKey"
      value={t.key}
      disabled={pending}
      aria-busy={mine || undefined}
      aria-current={mine ? "true" : undefined}
      data-testid="activity-type"
      data-selected={mine || undefined}
      className="activity-type-card"
    >
      <span className="activity-type-card__icon">
        <ActivityTypeIcon templateKey={t.key} size={80} />
      </span>
      <span className="activity-type-card__text">
        <span className="activity-type-card__name">{name}</span>
        <span className="activity-type-card__desc">{mine ? ui.opening : activityDescription(t.key, lang)}</span>
      </span>
    </button>
  );
}

function Gallery({ templates, workspace }: { templates: TemplateDef[]; workspace: "teacher" | "admin" }) {
  const { lang, t: ui } = useUi();
  const [sort, setSortState] = useState<Sort>("recommended");
  useEffect(() => {
    try {
      const v = localStorage.getItem(SORT_KEY);
      if (v === "alphabetical" || v === "recommended") setSortState(v);
    } catch {}
  }, []);
  const setSort = (s: Sort) => {
    setSortState(s);
    try {
      localStorage.setItem(SORT_KEY, s);
    } catch {}
  };
  const list = sortActivityTypes(
    templates.filter((t) => t.available),
    sort,
    lang,
  );

  return (
    <div className="create-activity">
      <div className="create-activity__head">
        <div>
          <h1 className="create-activity__title">{ui.createActivity}</h1>
          <p className="create-activity__subtitle">{ui.chooseActivityType}</p>
        </div>
        <div className="create-activity__sort" role="group" aria-label={ui.sortBy}>
          <span className="create-activity__sort-label" aria-hidden="true">{ui.sortBy}:</span>
          {(["recommended", "alphabetical"] as const).map((s, i) => (
            <span key={s} className="contents">
              {i > 0 && <span className="create-activity__sort-sep" aria-hidden="true">|</span>}
              <button type="button" aria-pressed={sort === s} onClick={() => setSort(s)} className="create-activity__sort-btn" data-testid={`sort-${s}`}>
                {s === "recommended" ? ui.sortRecommended : ui.sortAlphabetical}
              </button>
            </span>
          ))}
        </div>
      </div>

      <form action={createGame} className="@container">
        <input type="hidden" name="workspace" value={workspace} />
        <ul className="activity-type-grid" aria-label={ui.activityTypes} data-testid="activity-type-grid">
          {list.map((t) => (
            <li key={t.key} className="flex">
              <TypeCard t={t} lang={lang} />
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}

export function TemplateGallery({ templates, workspace = "teacher" }: { templates: TemplateDef[]; workspace?: "teacher" | "admin" }) {
  return (
    <UiLangProvider>
      <Gallery templates={templates} workspace={workspace} />
    </UiLangProvider>
  );
}
