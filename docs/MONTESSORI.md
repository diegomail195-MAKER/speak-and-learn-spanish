# Montessori Intelligent Feedback Engine

One engine decides the feedback in every LextroSpeak activity: it describes a real achievement,
offers help when it is needed, or proposes a new challenge. Every message is tied to something the
activity reported (an answer, a try count, a hint, a picture clue) or to the student's recorded
history. Technical problems (silence, recognition, microphone) are never recorded as mistakes.

## Files

| Part | Where |
|---|---|
| Event and decision types, activity families, error kinds, levels | `src/lib/montessori/types.ts` |
| Feedback library: 20 situations + activity-specific and technical messages, stable ids, English/Spanish variants | `src/lib/montessori/messages.ts` |
| Content nouns ("animal", "forma"…) and Spanish agreement | `src/lib/montessori/nouns.ts` |
| Decision rules (`FeedbackEngine`) and error classification | `src/lib/montessori/engine.ts` |
| Five progress levels from evidence | `src/lib/montessori/levels.ts` |
| Teacher recommendation (evidence only, no pronouns) | `src/lib/montessori/recommend.ts` |
| Admin settings schema and defaults | `src/lib/montessori/config.ts` |
| Template → activity family, skill keys, answer helpers | `src/lib/montessori/activity.ts` |
| Server: settings, skill records, history, teacher queries (ownership-checked) | `src/lib/montessori/server.ts` |
| Server actions (library answers, admin settings, teacher level) | `src/lib/actions/montessori.ts` |
| Voice activities (all 7 boards) | `src/components/player/useVoiceSession.ts`, `parts.tsx`, `GamePlayer.tsx`, `StudentPlay.tsx` |
| Library games (Memory, Picture Match, Listen & Find, Quiz) | `src/components/library/feedback.tsx`, `Players.tsx`, `StudentActivity.tsx` |
| Teacher: Montessori Learning Feedback & Progress | `/teacher/progress`, `/teacher/progress/[studentId]` |
| Admin: Settings → Montessori Feedback | `/admin/settings/montessori` |
| Database (additive migration) | `prisma/migrations/20261114212557_montessori_feedback` |
| Tests | `src/lib/montessori/engine.test.ts`, `e2e/montessori.e2e.mjs` |

## Connecting an activity

Any activity, present or future, uses the same interface:

```ts
const engine = new FeedbackEngine({ config, activityType: "number_tracing", noun: "number", history });
const d = engine.onAnswer({ itemId, outcome, reason, input, support, incorrectSoFar, endsQuestion, hasHint, hasImage, model });
// d.id (stable), d.en, d.es, d.display (inline | pause | silent), d.action (retry, hint, model, compare…)
engine.onComplete({ items, levelsAfter });   // end-of-activity messages and practice actions
```

To save progress, a voice activity just uses the existing attempts API (the server records
self-corrections and error kinds, and updates skills when the attempt is completed). A library-style
game calls `recordLibraryLearning` with the words answered; the server only accepts words that are
in the assigned activity.

## What is recorded

- `StudentResponse.selfCorrected`, `StudentResponse.errorKind` (new columns with defaults).
- `SkillProgress`: one row per student and word/phrase (`vocab:<language>:<normalized answer>`), so
  the same word in a speaking game and in a library game is one skill. Attempts, correct, correct
  with no help, missed, help used, self-corrections, independent run, days and activities with
  independent answers, computed level, teacher level and observation.
- `MontessoriSettings`: one row (`platform`) with the admin settings as JSON.

A student's own name ("Spell your name") is never stored as a skill.

## Levels

Exploring → Developing (correct with help) → Progressing (independent answers) → Proficient (a run
of independent answers on more than one day) → Extending (Proficient in more than one activity).
One correct answer is never Proficient. The thresholds are admin settings; a teacher can set a
level for a skill, which wins until it is cleared.

## Known limits

- French activities keep the original feedback phrases (the library is English/Spanish).
- Natural voices: lines without per-answer content are generated with the chosen voices when an
  activity is published, if a TTS service is configured. Lines with counts or the model answer use
  the device voice. No TTS key was available here, so generated audio was not tested.
- Library flashcards, songs, videos and printables have no answers to evaluate; they keep their
  existing completion tracking.
- After a short spoken answer ("perro" for "Es un perro") the full sentence is modelled and the
  student may say it once; that extra try is feedback only and is not saved.
- "You're ready for a new challenge" shows a button only when the student has another unfinished
  assignment; otherwise the teacher sees the recommendation.
- Inactivity is detected in voice activities (two silent waits while the microphone works).
- Teachers (and administrators) see the students of their own classes only.
