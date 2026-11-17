import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/guards";
import { lessonClipKey, lessonClips } from "@/lib/library/lesson";
import { mediaUrl } from "@/lib/media/save";
import { rateLimit } from "@/lib/rate-limit";
import { ensureAudio } from "@/lib/tts/generate";

// Natural-voice clips for the guided Topic lesson (Spanish and English voices). Only the fixed
// lesson lines are spoken, with the lesson title inserted; nothing else can be synthesized here.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (!(await rateLimit(`lesson-voice:${user.id}`, 40, 10 * 60_000))) throw new HttpError(429, "Too many requests");
  const { title } = z.object({ title: z.string().trim().min(1).max(120) }).parse(await req.json());
  const out: Record<string, string> = {};
  await Promise.all(
    lessonClips(title).map(async (c) => {
      try {
        const r = await ensureAudio({ schoolId: user.schoolId, userId: user.id, text: c.text, language: c.language, rate: 0.95 });
        if (r) out[lessonClipKey(c.language, c.text)] = mediaUrl(r.asset.mediaAssetId);
      } catch (e) {
        console.error("lesson voice", e);
      }
    }),
  );
  return NextResponse.json({ clips: out });
});
