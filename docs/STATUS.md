# Status — Phase 1 + end-to-end oral activity (section 19)

## Working and tested

Automated: `npm test` (30 unit tests) and `e2e/flow.e2e.mjs` (real Chromium, 1366×768 Chromebook
viewport, fake microphone playing a generated Spanish voice through the real capture → VAD → WAV →
server path). The e2e test covers acceptance criteria 1, 2, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15,
16 and 18:

- Teacher sign-up/sign-in; class with code; levels (LE2), groups (Group A); students with PIN.
- Game creation (Speak & Answer): image upload, question typed with the ñ/á/¿/¡ bar and Alt
  shortcuts, spelling suggestions accepted ("El nino esta feliz" → "El niño está feliz."),
  autosave + local backup, preview, publish.
- Assign to LE2 Group A → student signs in with class code + PIN → sees it → presses Start once →
  answers by voice with no further clicks → correct answer advances automatically → wrong answer gets
  the hint → second answer accepted as *guided*.
- Results saved to PostgreSQL; teacher sees 1/2 independent, 1 guided, transcripts per question.
- Permissions: student of another group can't see/open it; other school can't read game/results/media.

## Built, not covered by automated tests

- Templates Listen & Speak, Image & Vocabulary, Question & Answer, Spell Your Name (letter scorer is
  unit-tested; the full UI path is not).
- Azure / Google TTS and STT adapters (no keys in this environment — **never called for real**).
- Chrome Web Speech fallback (does not run in headless Chromium).
- Mic interruption recovery, idle pause, "Escuchar otra vez", "Siguiente", fullscreen, resume of an
  incomplete activity, attempt limits, due dates, category CRUD, game duplicate/archive/delete.
- Print / Save as PDF of the results page (browser print dialog).

## Needs credentials / configuration

| Feature | Needs |
|---|---|
| Natural Spanish/English/French voices saved for reuse | `TTS_PROVIDER` + Azure or Google key |
| Server speech recognition + pronunciation scores | `STT_PROVIDER` + Azure (or Google) key |
| Grammar suggestions beyond the built-in Spanish rules | `LANGUAGETOOL_API_URL` |
| Hosting | A Postgres (e.g. Supabase) + a Node host; for serverless hosting implement the storage driver for Supabase Storage/S3 (`src/lib/storage`) |

## Not tested yet (must be done before classroom use)

- Real children's voices, different accents and classroom noise with each recognizer.
- Physical Chromebooks and tablets (only a Chromebook-sized viewport in Chromium so far).
- Accessibility audit (keyboard and screen reader pass), performance budget.

## Next phases

- Phase 2 — Video library: upload/YouTube (`youtube-nocookie`), collections, player with resume,
  Watch & Practice. (Schema for videos already exists.)
- Phase 3 — Templates Fly & Speak, Memory & Speak, Match & Learn, Spin & Speak, Watch-Listen-Answer
  on the same engine; media library management screen.
- Phase 4 — Provider tuning with real voices, letter-name phrase lists, child-voice test set.
- Phase 5 — Student/group reports over time, server-generated PDF, sequences
  (Watch → Listen → Speak → Play → Review), retention jobs, parental requests.
- Phase 6 — Chromebook lab testing, accessibility, security review, load tests.
