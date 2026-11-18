# Graph Report - speak-and-learn-spanish  (2026-11-18)

## Corpus Check
- 344 files · ~207,007 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2296 nodes · 6989 edges · 98 communities (85 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5d8a3b80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.ts
- tts/index.ts
- MyActivitiesBoard.tsx
- react
- evaluate.ts
- Input
- google.ts
- ButtonLink
- lessonData.ts
- classroom.ts
- next
- db.ts
- audit
- MicSession
- voices.ts
- search.ts
- GameEditor.tsx
- package.json
- segments.ts
- games/service.ts
- server-only
- mediaUrl
- 20261025012814_init/migration.sql
- [slug]/page.tsx
- autocorrect.ts
- auth.ts
- lextro.e2e.mjs
- rateLimit
- parts.tsx
- plainText
- 20261113220000_laxtrospeak_library/migration.sql
- AuthLayout
- library/types.ts
- TopicHero.tsx
- useVoiceSession.ts
- storage/index.ts
- folders.e2e.mjs
- flow.e2e.mjs
- requireStudentPage
- games/types.ts
- AddListForm.tsx
- checkout/route.ts
- ref_node_fs
- my-activities.e2e.mjs
- photo-form.e2e.mjs
- RosterRow.tsx
- DiagramBoard.tsx
- attempts/service.ts
- requireTeacher
- FlashcardParts.tsx
- TopicLesson.tsx
- compilerOptions
- dependencies
- "public"."School"
- assignments/[id]/page.tsx
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- VideoForm
- AudioPanel
- flashcards-printables.e2e.mjs
- flashcards.e2e.mjs
- "public"."MediaAsset"
- "public"."User"
- ImageField.tsx
- scripts
- "public"."Game"
- games.ts
- CLAUDE.md
- Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity
- TopicPlanEditor.tsx
- StorageDriver
- image-editor.e2e.mjs
- eslint.config.mjs
- "TopicPlan"
- Publicar en internet (Supabase + Vercel)
- build-accent-maps.mjs
- "public"."Topic"
- Button
- AssignTaskWizard.tsx
- app/layout.tsx
- LextroSpeak
- Student privacy & security notes
- Typography
- html-to-image
- vercel.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 122 edges
2. `HttpError` - 99 edges
3. `db` - 95 edges
4. `Button()` - 92 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 83 edges
7. `react` - 72 edges
8. `PageHeader()` - 58 edges
9. `requireTeacherPage()` - 53 edges
10. `Panel()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts
- `DeleteButton()` --indirect_call--> `deleteResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `PublishButton()` --indirect_call--> `publishResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `ForgotPasswordForm()` --indirect_call--> `requestPasswordReset()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts

## Import Cycles
- None detected.

## Communities (98 total, 13 thin omitted)

### Community 0 - "layout.ts"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 1 - "tts/index.ts"
Cohesion: 0.07
Nodes (42): vitest, GET(), maxDuration, poolerSafeUrl(), env, azure(), CONTEXT, gateway() (+34 more)

### Community 2 - "MyActivitiesBoard.tsx"
Cohesion: 0.08
Nodes (52): metadata, MyActivitiesPage(), Search, EN, ES, FolderStrings, useFolderStrings(), BoardActivity (+44 more)

### Community 3 - "react"
Cohesion: 0.19
Nodes (13): react, AdminInvitePage(), dynamic, metadata, AcceptInviteForm(), GameOption, Option, Tree (+5 more)

### Community 4 - "evaluate.ts"
Cohesion: 0.11
Nodes (40): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+32 more)

### Community 5 - "Input"
Cohesion: 0.27
Nodes (14): ContentEditor(), listOps(), PairsEditor(), RowTools(), SheetEditor(), AddResult, LibraryPicker(), PickedResources() (+6 more)

### Community 6 - "google.ts"
Cohesion: 0.19
Nodes (17): GET, b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress() (+9 more)

### Community 7 - "ButtonLink"
Cohesion: 0.14
Nodes (26): EditResource(), ContentList(), metadata, STATUS, ManageActivities(), metadata, AssignmentsPage(), ICON (+18 more)

### Community 8 - "lessonData.ts"
Cohesion: 0.13
Nodes (22): metadata, StudentTask(), metadata, TopicLessonPage(), metadata, stepTitle(), TaskPage(), TopicLessonProps (+14 more)

### Community 9 - "classroom.ts"
Cohesion: 0.10
Nodes (32): GroupForm(), S, AvatarKey, AVATARS, colors, ownedClassroom(), ownedGroup(), ownedLevel() (+24 more)

### Community 10 - "next"
Cohesion: 0.12
Nodes (19): nextConfig, securityHeaders, next, zod, POST, schema, POST, PROBES (+11 more)

### Community 11 - "db.ts"
Cohesion: 0.09
Nodes (47): AddContent(), metadata, AdminGrades(), metadata, AdminHome(), metadata, AdminTopics(), metadata (+39 more)

### Community 12 - "audit"
Cohesion: 0.10
Nodes (57): LinkPreview(), MetaFields(), MetaForm(), Method, METHOD_LABEL, METHODS, NewResourceForm(), TopicOpt (+49 more)

### Community 13 - "MicSession"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 14 - "voices.ts"
Cohesion: 0.10
Nodes (21): TtsConfig, AudioDefaults, loadBrowserVoices(), pending, pickBrowserVoice(), queued, ready, SayResult (+13 more)

### Community 15 - "search.ts"
Cohesion: 0.07
Nodes (49): API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS(), fileUrl(), HEADERS (+41 more)

### Community 16 - "GameEditor.tsx"
Cohesion: 0.10
Nodes (24): EditGame(), metadata, DiagramPoints(), Point, FONT_SAMPLE, FontPreview(), blankItem(), Category (+16 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 18 - "segments.ts"
Cohesion: 0.12
Nodes (30): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+22 more)

### Community 19 - "games/service.ts"
Cohesion: 0.11
Nodes (36): POST, POST, Ctx, GET, PUT, CARDS, GET(), maxDuration (+28 more)

### Community 20 - "server-only"
Cohesion: 0.31
Nodes (9): @prisma/client, server-only, Ctx, PUT, POST, requireVideoAdmin(), StudentRef, videoData() (+1 more)

### Community 21 - "mediaUrl"
Cohesion: 0.17
Nodes (22): POST, POST, GET, POST, POST, done, POST, start (+14 more)

### Community 22 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 23 - "[slug]/page.tsx"
Cohesion: 0.23
Nodes (12): LibraryPage(), metadata, TopicPage(), metadata, StudentViewPage(), EyeIcon(), TopicCard(), libraryTopics() (+4 more)

### Community 24 - "autocorrect.ts"
Cohesion: 0.10
Nodes (29): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+21 more)

### Community 25 - "auth.ts"
Cohesion: 0.06
Nodes (65): POST(), escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword() (+57 more)

### Community 26 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 27 - "rateLimit"
Cohesion: 0.13
Nodes (25): POST, GET, POST, GET, POST, schema, metadata, StudentAlphabet() (+17 more)

### Community 28 - "parts.tsx"
Cohesion: 0.08
Nodes (48): AlphabetExplorer(), Config, BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard() (+40 more)

### Community 29 - "plainText"
Cohesion: 0.11
Nodes (33): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+25 more)

### Community 30 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 31 - "AuthLayout"
Cohesion: 0.15
Nodes (21): ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic, metadata, ResetPasswordPage(), metadata (+13 more)

### Community 32 - "library/types.ts"
Cohesion: 0.08
Nodes (58): DraftPreview(), ActivityMaterials(), metadata, ResourcePreview(), ART_OPTIONS, FilePicker(), ImagePicker(), useUpload() (+50 more)

### Community 33 - "TopicHero.tsx"
Cohesion: 0.09
Nodes (33): metadata, WatchPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel() (+25 more)

### Community 34 - "useVoiceSession.ts"
Cohesion: 0.12
Nodes (21): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+13 more)

### Community 35 - "storage/index.ts"
Cohesion: 0.12
Nodes (19): POST, PUT, GET, POST, start, GET, EXT, FileGroup (+11 more)

### Community 36 - "folders.e2e.mjs"
Cohesion: 0.19
Nodes (8): COLORS, db, dialog(), openEdit(), saveAndWait(), stamp, tile(), tileColor()

### Community 37 - "flow.e2e.mjs"
Cohesion: 0.09
Nodes (14): addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp, addImage(), fx() (+6 more)

### Community 38 - "requireStudentPage"
Cohesion: 0.19
Nodes (14): metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata, MyVideos(), StudentActivity() (+6 more)

### Community 39 - "games/types.ts"
Cohesion: 0.10
Nodes (31): AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section, SettingsData, SettingsValues, SHORT (+23 more)

### Community 40 - "AddListForm.tsx"
Cohesion: 0.19
Nodes (18): AddListForm(), Roster, addStudentList(), ListResult, newSecret(), rand(), capitalize(), CheckedRow (+10 more)

### Community 41 - "checkout/route.ts"
Cohesion: 0.47
Nodes (6): POST, POST, HttpError, billingConfigured(), isLiveKey(), stripe()

### Community 42 - "ref_node_fs"
Cohesion: 0.17
Nodes (7): resetLinkFromLog(), sleep(), stamp, db, dir, plan, slug()

### Community 44 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 45 - "RosterRow.tsx"
Cohesion: 0.07
Nodes (42): react-dom@19.1.0, react-dom, AdminLayout(), LearnLayout(), metadata, Privacy(), ClassLogin(), metadata (+34 more)

### Community 46 - "DiagramBoard.tsx"
Cohesion: 0.57
Nodes (6): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys()

### Community 47 - "attempts/service.ts"
Cohesion: 0.46
Nodes (6): isVoice(), questionResult(), questionStatus(), R, finalizeAttempt(), finishedQuestions()

### Community 48 - "requireTeacher"
Cohesion: 0.16
Nodes (19): POST, POST, POST, createCategory(), deleteCategory(), names, updateCategory(), key (+11 more)

### Community 49 - "FlashcardParts.tsx"
Cohesion: 0.08
Nodes (35): stopFaceAudio(), cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload() (+27 more)

### Community 50 - "TopicLesson.tsx"
Cohesion: 0.14
Nodes (23): Home(), ICON, KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson() (+15 more)

### Community 51 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 52 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+10 more)

### Community 56 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 57 - "assignments/[id]/page.tsx"
Cohesion: 0.20
Nodes (15): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), metadata, PrintAccess() (+7 more)

### Community 61 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 62 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 63 - "playwright"
Cohesion: 0.08
Nodes (10): errors, stamp, errors, stamp, COLORS, db, stamp, errors (+2 more)

### Community 64 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 65 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 66 - "VideoForm"
Cohesion: 0.24
Nodes (10): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), VideoFormValue (+2 more)

### Community 67 - "AudioPanel"
Cohesion: 0.14
Nodes (21): AudioControl(), browserPreview(), generate(), AudioDefaultsContext, AudioField(), audioLanguages(), AudioPanel(), ensureGenerated() (+13 more)

### Community 68 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 69 - "flashcards.e2e.mjs"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 70 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 71 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 72 - "ImageField.tsx"
Cohesion: 0.14
Nodes (16): Ctx, Dict, EN, ES, UiLang, EditStep, ico, Icons (+8 more)

### Community 74 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 75 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 76 - "games.ts"
Cohesion: 0.05
Nodes (59): db, main(), metadata, NewGame(), GamesPage(), metadata, CreateButton(), FEATURED (+51 more)

### Community 78 - "Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity"
Cohesion: 0.20
Nodes (9): Built, not covered by automated tests, Create Activity & multilingual voice (`e2e/templates.e2e.mjs`), Hosting on Supabase + Vercel (`docs/DEPLOY.md`), Needs credentials / configuration, Next phases, Not tested yet (must be done before classroom use), Phase 2 — video library (`e2e/videos.e2e.mjs`), Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity (+1 more)

### Community 80 - "TopicPlanEditor.tsx"
Cohesion: 0.22
Nodes (5): ICON, KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 83 - "image-editor.e2e.mjs"
Cohesion: 0.22
Nodes (3): errors, NAMES, stamp

### Community 84 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 86 - ""TopicPlan""
Cohesion: 0.29
Nodes (3): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key

### Community 87 - "Publicar en internet (Supabase + Vercel)"
Cohesion: 0.25
Nodes (7): 1. Supabase, 2. Vercel, Buscar imágenes en internet (con filtro infantil), Correo para "¿Olvidaste tu contraseña?", Límites conocidos en Vercel, Publicar en internet (Supabase + Vercel), Solo el administrador sube videos

### Community 89 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "Button"
Cohesion: 0.14
Nodes (25): GradeForm(), PublishButton(), S, StudentPicker(), AddStudentsMenu(), AssignForm(), BillingButtons(), Progress() (+17 more)

### Community 92 - "AssignTaskWizard.tsx"
Cohesion: 0.23
Nodes (10): AssignTaskPage(), metadata, AssignTaskWizard(), ClassData, TopicData, createTopicTask(), TaskResult, taskSchema (+2 more)

### Community 93 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 94 - "LextroSpeak"
Cohesion: 0.33
Nodes (5): How the oral activity works, LextroSpeak, Project map, Run locally, Stack

### Community 95 - "Student privacy & security notes"
Cohesion: 0.40
Nodes (4): Implemented, Pending (needs decisions / legal review), Student privacy & security notes, Third parties that receive data (document in the school's vendor list)

### Community 96 - "Typography"
Cohesion: 0.40
Nodes (4): How it is set up, Licence status, To use authentic Century Gothic everywhere, Typography

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 99 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `layout.ts`, `MyActivitiesBoard.tsx`, `Input`, `classroom.ts`, `db.ts`, `audit`, `voices.ts`, `GameEditor.tsx`, `package.json`, `segments.ts`, `autocorrect.ts`, `rateLimit`, `parts.tsx`, `plainText`, `AuthLayout`, `library/types.ts`, `TopicHero.tsx`, `useVoiceSession.ts`, `games/types.ts`, `AddListForm.tsx`, `RosterRow.tsx`, `DiagramBoard.tsx`, `FlashcardParts.tsx`, `TopicLesson.tsx`, `dependencies`, `VideoForm`, `AudioPanel`, `ImageField.tsx`, `games.ts`, `TopicPlanEditor.tsx`, `Button`, `AssignTaskWizard.tsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06456140350877193 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `tts/index.ts`, `MyActivitiesBoard.tsx`, `react`, `Input`, `ButtonLink`, `lessonData.ts`, `classroom.ts`, `db.ts`, `audit`, `GameEditor.tsx`, `package.json`, `games/service.ts`, `server-only`, `mediaUrl`, `[slug]/page.tsx`, `auth.ts`, `rateLimit`, `AuthLayout`, `library/types.ts`, `TopicHero.tsx`, `storage/index.ts`, `requireStudentPage`, `games/types.ts`, `AddListForm.tsx`, `checkout/route.ts`, `RosterRow.tsx`, `requireTeacher`, `TopicLesson.tsx`, `dependencies`, `assignments/[id]/page.tsx`, `VideoForm`, `games.ts`, `TopicPlanEditor.tsx`, `Button`, `AssignTaskWizard.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `tts/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06558441558441558 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `server-only` to `db.ts`, `audit`, `package.json`, `games/service.ts`, `mediaUrl`, `auth.ts`, `lextro.e2e.mjs`, `library/types.ts`, `folders.e2e.mjs`, `ref_node_fs`, `photo-form.e2e.mjs`, `attempts/service.ts`, `dependencies`, `assignments/[id]/page.tsx`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `playwright`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `games.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `MyActivitiesBoard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07514124293785311 - nodes in this community are weakly interconnected._
- **Should `evaluate.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10628019323671498 - nodes in this community are weakly interconnected._