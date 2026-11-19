"use client";

import { useActionState } from "react";
import { FormError } from "@/components/ui/Field";
import { updateSettings } from "@/lib/actions/settings";
import { LANGUAGE_LABEL, TOPIC_LANGUAGES } from "@/lib/library/topicMeta";
import type { PlatformSettingsData } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: PlatformSettingsData }) {
  const [state, action, pending] = useActionState(updateSettings, undefined);
  return (
    <form action={action} className="grid gap-5" data-testid="settings-form">
      {/* Remounted after each save, so the fields show the saved values (forms reset after an action). */}
      <div key={settings.updatedAt?.toISOString() ?? "new"} className="grid gap-5">
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input type="checkbox" name="signupOpen" defaultChecked={settings.signupOpen} className="mt-1 h-5 w-5 accent-[#2563EB]" data-testid="setting-signup" />
        <span>
          <span className="block font-bold">Public teacher sign-up</span>
          <span className="block text-[15px] text-[#5B6577]">When off, the sign-up page is closed and new accounts come only from administrator invitations.</span>
        </span>
      </label>
      <div>
        <label htmlFor="announcement" className="mb-1.5 block font-bold">Notice for teachers <span className="font-normal text-[#5B6577]">(optional)</span></label>
        <input id="announcement" name="announcement" defaultValue={settings.announcement} maxLength={240} className="ws-input" placeholder="e.g. New Speaking activities are in the Library!" data-testid="setting-announcement" />
        <p className="mt-1 text-sm text-[#5B6577]">Shown at the top of every Teacher View and Platform Admin page. Leave empty to hide it.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="defaultTopicLanguage" className="mb-1.5 block font-bold">Default topic language</label>
          <select id="defaultTopicLanguage" name="defaultTopicLanguage" defaultValue={settings.defaultTopicLanguage} className="ws-select" data-testid="setting-language">
            {TOPIC_LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
          </select>
          <p className="mt-1 text-sm text-[#5B6577]">Preselected when you create a topic.</p>
        </div>
        <div>
          <label htmlFor="supportEmail" className="mb-1.5 block font-bold">Support email <span className="font-normal text-[#5B6577]">(optional)</span></label>
          <input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail} maxLength={200} className="ws-input" placeholder="help@yourschool.org" data-testid="setting-support" />
          <p className="mt-1 text-sm text-[#5B6577]">Teachers see it in My Account under “Need help?”.</p>
        </div>
      </div>
      </div>
      <FormError message={state?.error} />
      {state?.message && <p role="status" className="font-bold text-[#146C2E]">{state.message}</p>}
      <div><button className="ws-btn ws-btn-primary ws-btn-lg" disabled={pending} data-testid="settings-save">{pending ? "Saving…" : "Save settings"}</button></div>
    </form>
  );
}
