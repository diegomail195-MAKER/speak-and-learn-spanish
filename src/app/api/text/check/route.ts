import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { checkSpanish, type Suggestion } from "@/lib/text/spanish-check";

const schema = z.object({ text: z.string().max(2000), language: z.enum(["es-419", "en-US", "fr-FR"]) });
const LT_LANG = { "es-419": "es", "en-US": "en-US", "fr-FR": "fr" } as const;

// Spelling, accent, grammar and punctuation suggestions for teacher-written content.
// Built-in Spanish rules always run; LanguageTool (optional, LANGUAGETOOL_API_URL) adds grammar
// and other languages. Only teacher content is sent, never student data.
export const POST = handle(async (req: Request) => {
  const { user } = await requireTeacher();
  const { text, language } = schema.parse(await req.json());
  const keep = (await db.keepWord.findMany({ where: { schoolId: user.schoolId }, select: { word: true } })).map((k) => k.word);
  const suggestions: Suggestion[] = language === "es-419" ? checkSpanish(text, keep) : [];
  let languageTool: "used" | "not_configured" | "unavailable" = "not_configured";

  const ltUrl = process.env.LANGUAGETOOL_API_URL;
  if (ltUrl && text.trim()) {
    try {
      const body = new URLSearchParams({ text, language: LT_LANG[language] });
      if (process.env.LANGUAGETOOL_USERNAME && process.env.LANGUAGETOOL_API_KEY) {
        body.set("username", process.env.LANGUAGETOOL_USERNAME);
        body.set("apiKey", process.env.LANGUAGETOOL_API_KEY);
      }
      const res = await fetch(`${ltUrl.replace(/\/$/, "")}/check`, { method: "POST", body, signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        languageTool = "used";
        const json = (await res.json()) as { matches: Array<{ offset: number; length: number; message: string; replacements: Array<{ value: string }>; rule: { issueType: string } }> };
        for (const m of json.matches) {
          const replacement = m.replacements[0]?.value;
          const original = text.slice(m.offset, m.offset + m.length);
          if (!replacement || keep.some((k) => k.toLowerCase() === original.toLowerCase())) continue;
          const overlaps = suggestions.some((s) => m.offset < s.offset + Math.max(1, s.length) && s.offset < m.offset + Math.max(1, m.length));
          if (overlaps) continue;
          suggestions.push({
            offset: m.offset,
            length: m.length,
            original,
            replacement,
            message: m.message,
            kind: m.rule.issueType === "misspelling" ? "spelling" : m.rule.issueType === "typographical" ? "punctuation" : "grammar",
            source: "languagetool",
          });
        }
      } else languageTool = "unavailable";
    } catch {
      languageTool = "unavailable";
    }
  }
  suggestions.sort((a, b) => a.offset - b.offset);
  return NextResponse.json({ suggestions, languageTool });
});
