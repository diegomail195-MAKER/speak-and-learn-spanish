# Speak & Learn Spanish

**Interactive Spanish Learning for Kids — Speak. Play. Learn.**

A web platform for US elementary schools where teachers build voice-first Spanish activities and
students (ages 6–12) answer **out loud**. The microphone stays ready for the whole activity: no
clicking to talk.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router) + React 19 + TypeScript |
| UI | Tailwind CSS v4 with a custom token set (`src/app/globals.css`), Nunito + Fredoka |
| Data | PostgreSQL via Prisma (works with Supabase Postgres) |
| Auth | Own session auth: httpOnly cookie, hashed token in DB, bcrypt passwords/PINs |
| Speech in | Browser capture (AudioWorklet) + own VAD → server STT (Azure/Google) or Chrome Web Speech |
| Speech out | Azure Neural / Google Neural2 TTS, cached per school; device voice fallback |

## Run locally

```bash
cp .env.example .env            # set DATABASE_URL / DIRECT_URL
npm install
npx prisma migrate deploy
npm run db:seed                 # game templates
npm run dev                     # http://localhost:3000
```

Tests:

```bash
npm test                        # unit tests: answer evaluation, letters, VAD, Spanish checker
npm run build && npx next start -p 3100   # with STT_PROVIDER=scripted-test, see e2e/flow.e2e.mjs
BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/tmp/stt.json node e2e/flow.e2e.mjs
BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/tmp/stt.json node e2e/videos.e2e.mjs
BASE_URL=http://localhost:3100 E2E_STT_SCRIPT_FILE=/tmp/stt.json E2E_STT_LOG=/tmp/stt.log node e2e/templates.e2e.mjs  # server started with the same E2E_STT_LOG
```

## How the oral activity works

1. Student presses **Start** once → browser asks for the microphone (echo cancellation, noise
   suppression, auto gain on).
2. The stream stays open for the activity. A voice-activity detector (`src/lib/client/vad.ts`)
   with an adaptive noise floor detects when the child starts and stops talking.
3. While the app speaks, the detector is **disarmed**, so the app's own voice is never taken as an
   answer (`src/lib/client/mic-session.ts`).
4. The utterance (16 kHz WAV) goes to `/api/stt` → Azure/Google with a **fixed Spanish locale**
   (never auto-switches to English). Without a server key, Chrome's recognizer is used per answer.
5. The answer is scored **on the server** (`src/lib/speech/evaluate.ts`): normalization, digits →
   words, Latin-American phonetic equivalences (seseo, b/v, ll/y, silent h), accepted alternatives,
   optional carrier words ("perro" for "Es un perro"), English detection, a dedicated letter-name
   scorer for spelling. Result: **CORRECT / INCORRECT / UNCERTAIN** — silence, noise and low
   confidence are UNCERTAIN and never counted as mistakes.
6. Feedback: correct → praise + auto-advance; incorrect → hint, then the model answer, then move on;
   uncertain → "¿Puedes repetirlo?". Two silences in a row pause listening until the child returns.
7. Every response is stored (transcript, outcome, support level, confidence, engine) — **no audio**.
   Mastery: **Independent** (no help), **Guided** (after hint/model), **Needs practice**.

Teacher preview runs the same engine with a **diagnostics panel** (expected answer, transcript and
alternatives, locale, engine, confidence, result, reason, mic state, noise floor).

## Project map

```
prisma/schema.prisma        all tables, relations, indexes
src/lib/speech/             normalization, evaluation, Spanish letter names (+ tests)
src/lib/client/             mic session, VAD, WAV encoder, recognizers, speaker
src/lib/games/              templates, editor/player data, publish (audio generation)
src/lib/tts, src/lib/stt    provider adapters (server only)
src/lib/text/               Spanish spelling/accent/punctuation suggestions (+ tests)
src/lib/access.ts           ownership + student visibility rules
src/components/editor/      game editor, Spanish character bar, audio + image pickers
src/components/player/      the activity engine used by every template
src/app/teacher/*           dashboard, games, classes, assignments/results, categories
src/app/learn/*, /play/*    student portal and activity player
e2e/flow.e2e.mjs            end-to-end test of the full flow in Chromium with a fake microphone
```

See `docs/STATUS.md` for what is done, tested and pending, and `docs/PRIVACY.md` for the student
data notes (COPPA/FERPA items that need legal review).
