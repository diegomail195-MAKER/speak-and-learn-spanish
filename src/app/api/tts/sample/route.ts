import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishGame, saveEditorGame, saveSchema } from "@/lib/games/service";
import { templateByKey, templateOptions } from "@/lib/games/templates";
import { DEFAULT_SETTINGS, type FaceAudio } from "@/lib/games/types";
import { ensureAudio } from "@/lib/tts/generate";
import type { AudioLanguage } from "@/lib/tts/voices";

// Preview-only: builds a published Flashcards activity whose faces are read by natural voices in
// Spanish, English and French (a word, a question and a sentence in each), so the voices can be
// heard in the real editor and player. Disabled unless TTS_PROBE_TOKEN is set, and never in
// production.
export const maxDuration = 300;

const TITLE = "Muestra de voces · Español · English · Français";

const CARDS: Array<[string, AudioLanguage, string, AudioLanguage]> = [
  ["pingüino", "es-419", "penguin", "en-US"],
  ["dieciséis", "es-419", "sixteen", "en-US"],
  ["¿Cuál es tu color favorito?", "es-419", "What is your favorite color?", "en-US"],
  ["El gato duerme en la cama.", "es-419", "The cat is sleeping on the bed.", "en-US"],
  ["écureuil", "fr-FR", "ardilla", "es-419"],
  ["Comment tu t’appelles ?", "fr-FR", "¿Cómo te llamas?", "es-419"],
  ["Le chat dort sur le lit.", "fr-FR", "I like to read books.", "en-US"],
];

export async function GET(req: Request) {
  const token = process.env.TTS_PROBE_TOKEN;
  const u = new URL(req.url);
  if (!token || process.env.VERCEL_ENV === "production" || u.searchParams.get("token") !== token) return new NextResponse("Not found", { status: 404 });
  const email = (u.searchParams.get("email") ?? "").toLowerCase();
  const user = await db.user.findFirst({ where: { email }, include: { teacher: true } });
  if (!user?.teacher) return NextResponse.json({ error: "teacher not found" }, { status: 404 });
  const t = templateByKey("FLASHCARDS")!;
  const rate = 0.95;
  const audio = async (text: string, language: AudioLanguage): Promise<FaceAudio> => {
    const r = await ensureAudio({ schoolId: user.schoolId, userId: user.id, text, language, rate });
    if (!r) throw new Error(`no audio for ${text}`);
    return { mediaId: r.asset.mediaAssetId, text, language, voice: r.asset.voice, rate, source: "tts" };
  };
  // ?game=<id> refreshes an earlier sample in place instead of adding another one.
  const again = u.searchParams.get("game");
  const earlier = again ? await db.game.findFirst({ where: { id: again, schoolId: user.schoolId, title: TITLE } }) : null;
  const game =
    earlier ??
    (await db.game.create({
      data: { schoolId: user.schoolId, teacherId: user.teacher.id, templateKey: t.key, title: "", settings: { ...DEFAULT_SETTINGS, options: templateOptions(t, undefined) } },
    }));
  const items = await Promise.all(
    CARDS.map(async ([front, fl, back, bl]) => {
      const [fa, ba] = await Promise.all([audio(front, fl), audio(back, bl)]);
      return {
        imageAssetId: null,
        text: front,
        difficulty: 1,
        data: { audio: fa, back: { text: back, audio: ba } },
        question: { prompt: "", promptAudioId: null, expectedAnswer: "", accepted: [], hint: "", supportText: "", supportLanguage: "es-419", supportAudioId: null, evaluationMode: "PHRASE", answerLanguage: null },
      };
    }),
  );
  await saveEditorGame(
    user.schoolId,
    game.id,
    saveSchema.parse({
      title: TITLE,
      description: "Una palabra, una pregunta y una frase en cada idioma, leídas con voces naturales.",
      categoryId: null,
      topic: "Voces",
      objective: "",
      level: "",
      instructions: "Escucha cada tarjeta y voltéala para oír el reverso.",
      language: "es-419",
      difficulty: 1,
      estimatedMinutes: 5,
      settings: { acceptShortAnswer: true, rate, maxTries: 3, options: { ...templateOptions(t, undefined), autoplayAudio: true } },
      items,
    }),
  );
  const pub = await publishGame(user.schoolId, user.id, game.id);
  return NextResponse.json({ gameId: game.id, published: pub.ok, edit: `/teacher/games/${game.id}/edit`, preview: `/play/preview/${game.id}` });
}
