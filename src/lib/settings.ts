import { cache } from "react";
import { db } from "@/lib/db";

// Platform settings edited in Platform Admin › Settings (one row, id "global"). Missing row or
// table read failure → the defaults, so a page never breaks because of settings.
export type PlatformSettingsData = { signupOpen: boolean; announcement: string; defaultTopicLanguage: string; supportEmail: string; updatedAt: Date | null };

export const DEFAULT_SETTINGS: PlatformSettingsData = { signupOpen: true, announcement: "", defaultTopicLanguage: "es", supportEmail: "", updatedAt: null };

export const getSettings = cache(async (): Promise<PlatformSettingsData> => {
  const row = await db.platformSettings.findUnique({ where: { id: "global" } }).catch(() => null);
  return row ? { signupOpen: row.signupOpen, announcement: row.announcement, defaultTopicLanguage: row.defaultTopicLanguage, supportEmail: row.supportEmail, updatedAt: row.updatedAt } : DEFAULT_SETTINGS;
});
