# Graph Report - speak-and-learn-spanish  (2026-11-18)

## Corpus Check
- 181 files · ~85,668 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 1122 nodes · 3259 edges · 51 communities (42 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e6d0467`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- HttpError
- useVoiceSession.ts
- auth.ts
- 20261025012814_init/migration.sql
- games/service.ts
- next
- evaluate.ts
- MicSession
- segments.ts
- templates.ts
- requireTeacherPage
- search.ts
- FlashcardParts.tsx
- Button.tsx
- GameEditor.tsx
- compilerOptions
- templates.e2e.mjs
- attempts/service.ts
- db.ts
- learn/layout.tsx
- tts/index.ts
- voices.ts
- devDependencies
- @prisma/client
- VideoPlayer.tsx
- flashcards.e2e.mjs
- package.json
- spanish-check.ts
- guards.ts
- i18n.tsx
- assignments/[id]/page.tsx
- Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity
- scripts
- actions/videos.ts
- StorageDriver
- flow.e2e.mjs
- eslint.config.mjs
- Publicar en internet (Supabase + Vercel)
- security.e2e.mjs
- videos.e2e.mjs
- app/layout.tsx
- Speak & Learn Spanish
- Student privacy & security notes
- next.config.ts
- middleware.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 65 edges
2. `HttpError` - 59 edges
3. `requireTeacher()` - 52 edges
4. `Button()` - 51 edges
5. `db` - 50 edges
6. `audit()` - 43 edges
7. `react` - 38 edges
8. `requireTeacherPage()` - 35 edges
9. `PageHeader()` - 34 edges
10. `GameEditorInner()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `AssignForm()` --indirect_call--> `createAssignment()`  [INFERRED]
  src/components/teacher/AssignForm.tsx → src/lib/actions/assignments.ts
- `AddStudentForm()` --indirect_call--> `createStudent()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts
- `ResetPinButton()` --indirect_call--> `resetStudentPin()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts
- `POST` --calls--> `requireStudent()`  [EXTRACTED]
  src/app/api/attempts/[id]/complete/route.ts → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (51 total, 9 thin omitted)

### Community 0 - "HttpError"
Cohesion: 0.05
Nodes (92): server-only, zod, POST, POST, GET, POST, GET, GET (+84 more)

### Community 1 - "useVoiceSession.ts"
Cohesion: 0.06
Nodes (83): react, AlphabetExplorer(), Config, Point, BoxesBoard(), openBox(), runReview(), sleep() (+75 more)

### Community 2 - "auth.ts"
Cohesion: 0.06
Nodes (62): ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic, metadata, ResetPasswordPage(), metadata (+54 more)

### Community 3 - "20261025012814_init/migration.sql"
Cohesion: 0.06
Nodes (72): AcceptedAnswer_questionId_idx, Assignment_schoolId_active_idx, AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, AudioAsset_schoolId_cacheKey_key (+64 more)

### Community 4 - "games/service.ts"
Cohesion: 0.08
Nodes (38): Ctx, GET, PUT, GET, POST, metadata, StudentAlphabet(), metadata (+30 more)

### Community 5 - "next"
Cohesion: 0.11
Nodes (32): next, POST, schema, POST, POST, schema, metadata, MyActivities() (+24 more)

### Community 6 - "evaluate.ts"
Cohesion: 0.12
Nodes (36): scoreTurn(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters(), evaluateTyped() (+28 more)

### Community 7 - "MicSession"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "segments.ts"
Cohesion: 0.09
Nodes (34): BarContext, CharButtons(), CHARS, FR_CHARS, Inserter, LANG_TONE, LanguageTools(), markSelection() (+26 more)

### Community 9 - "templates.ts"
Cohesion: 0.10
Nodes (30): db, metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE (+22 more)

### Community 10 - "requireTeacherPage"
Cohesion: 0.16
Nodes (26): metadata, TeacherAlphabet(), metadata, NewAssignment(), AssignmentsPage(), metadata, recipientLabel(), CategoriesPage() (+18 more)

### Community 11 - "search.ts"
Cohesion: 0.11
Nodes (25): vitest, poolerSafeUrl(), BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED (+17 more)

### Community 12 - "FlashcardParts.tsx"
Cohesion: 0.12
Nodes (25): AUDIO_LANGUAGES, AudioField(), AudioPanel(), previewTts(), save(), playFaceAudio(), SHORT, stopFaceAudio() (+17 more)

### Community 13 - "Button.tsx"
Cohesion: 0.13
Nodes (19): ActivityIllustration(), Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart() (+11 more)

### Community 14 - "GameEditor.tsx"
Cohesion: 0.12
Nodes (20): AudioControl(), DiagramPoints(), ALPHABET_TEMPLATES, alphabetItems(), blankItem(), Category, GameEditor(), GameEditorInner() (+12 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 16 - "templates.e2e.mjs"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 17 - "attempts/service.ts"
Cohesion: 0.23
Nodes (12): POST, isVoice(), questionResult(), questionStatus(), R, finalizeAttempt(), finishedQuestions(), assignmentReport() (+4 more)

### Community 18 - "db.ts"
Cohesion: 0.19
Nodes (10): LT_LANG, schema, TeacherLayout(), EditVideo(), metadata, metadata, NewVideo(), requireVideoAdminPage() (+2 more)

### Community 19 - "learn/layout.tsx"
Cohesion: 0.23
Nodes (11): LearnLayout(), NavLinks(), LINKS, TeacherShell(), Avatar(), AvatarKey, AVATARS, colors (+3 more)

### Community 20 - "tts/index.ts"
Cohesion: 0.23
Nodes (13): azure(), azureSsml(), escapeXml(), google(), googlePart(), joinPcm(), synthesize(), TtsPart (+5 more)

### Community 21 - "voices.ts"
Cohesion: 0.22
Nodes (10): TtsConfig, loadBrowserVoices(), pickBrowserVoice(), Speaker, Segment, TagProposal, AppLanguage, BROWSER_LOCALES (+2 more)

### Community 22 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint@^9, eslint-config-next@15.5.29, tailwindcss@^4, tsx@^4.20.5, @types/react@^19, @types/react-dom@^19, vitest@^3.2.4 (+6 more)

### Community 23 - "@prisma/client"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs@^3.0.2, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0, server-only@^0.0.1 (+5 more)

### Community 24 - "VideoPlayer.tsx"
Cohesion: 0.21
Nodes (9): Report, fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer (+1 more)

### Community 25 - "flashcards.e2e.mjs"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 26 - "package.json"
Cohesion: 0.17
Nodes (11): @tailwindcss/postcss@^4, @types/node@^20, typescript@^5, name, prisma, seed, private, version (+3 more)

### Community 27 - "spanish-check.ts"
Cohesion: 0.23
Nodes (10): POST, accept(), ALWAYS, applyAll(), applySuggestion(), checkSpanish(), ESTAR, matchCase() (+2 more)

### Community 28 - "guards.ts"
Cohesion: 0.33
Nodes (7): metadata, TeacherWatch(), fmt(), metadata, VideosPage(), adminEmails(), isPlatformAdmin()

### Community 29 - "i18n.tsx"
Cohesion: 0.20
Nodes (10): Ctx, Dict, EN, ES, UiLang, Edit, ImageEditor(), apply() (+2 more)

### Community 30 - "assignments/[id]/page.tsx"
Cohesion: 0.31
Nodes (9): Actions(), AssignmentResults(), fmtTime(), metadata, VideoResults(), PrintButton(), pct(), EvaluationReason (+1 more)

### Community 31 - "Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity"
Cohesion: 0.20
Nodes (9): Built, not covered by automated tests, Create Activity & multilingual voice (`e2e/templates.e2e.mjs`), Hosting on Supabase + Vercel (`docs/DEPLOY.md`), Needs credentials / configuration, Next phases, Not tested yet (must be done before classroom use), Phase 2 — video library (`e2e/videos.e2e.mjs`), Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity (+1 more)

### Community 32 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:migrate, db:seed, dev, lint, start, test (+2 more)

### Community 33 - "actions/videos.ts"
Cohesion: 0.44
Nodes (8): addToCollection(), deleteCollection(), deleteVideo(), moveInCollection(), removeFromCollection(), schoolCollection(), schoolVideo(), setVideoStatus()

### Community 35 - "flow.e2e.mjs"
Cohesion: 0.25
Nodes (5): addImage(), fx(), stamp, playwright@^1.63.0, playwright

### Community 36 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "Publicar en internet (Supabase + Vercel)"
Cohesion: 0.25
Nodes (7): 1. Supabase, 2. Vercel, Buscar imágenes en internet (con filtro infantil), Correo para "¿Olvidaste tu contraseña?", Límites conocidos en Vercel, Publicar en internet (Supabase + Vercel), Solo el administrador sube videos

### Community 38 - "security.e2e.mjs"
Cohesion: 0.29
Nodes (4): resetLinkFromLog(), sleep(), stamp, scripted()

### Community 39 - "videos.e2e.mjs"
Cohesion: 0.29
Nodes (3): addImage(), fx(), stamp

### Community 40 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): body, display, metadata, viewport

### Community 41 - "Speak & Learn Spanish"
Cohesion: 0.33
Nodes (5): How the oral activity works, Project map, Run locally, Speak & Learn Spanish, Stack

### Community 42 - "Student privacy & security notes"
Cohesion: 0.40
Nodes (4): Implemented, Pending (needs decisions / legal review), Student privacy & security notes, Third parties that receive data (document in the school's vendor list)

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useVoiceSession.ts` to `auth.ts`, `segments.ts`, `templates.ts`, `requireTeacherPage`, `FlashcardParts.tsx`, `Button.tsx`, `GameEditor.tsx`, `learn/layout.tsx`, `voices.ts`, `@prisma/client`, `VideoPlayer.tsx`, `package.json`, `i18n.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `HttpError` be split into smaller, more focused modules?**
  _Cohesion score 0.05392223275978865 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `HttpError`, `actions/videos.ts`, `auth.ts`, `games/service.ts`, `app/layout.tsx`, `requireTeacherPage`, `next.config.ts`, `middleware.ts`, `Button.tsx`, `GameEditor.tsx`, `attempts/service.ts`, `db.ts`, `learn/layout.tsx`, `@prisma/client`, `VideoPlayer.tsx`, `package.json`, `guards.ts`, `assignments/[id]/page.tsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `useVoiceSession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0597778169634985 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `useVoiceSession.ts` to `actions/videos.ts`, `auth.ts`, `requireTeacherPage`, `Button.tsx`, `GameEditor.tsx`, `assignments/[id]/page.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0636030636030636 - nodes in this community are weakly interconnected._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.05964912280701754 - nodes in this community are weakly interconnected._