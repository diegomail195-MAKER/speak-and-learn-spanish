# Graph Report - speak-and-learn-spanish  (2026-11-18)

## Corpus Check
- 342 files · ~203,822 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2268 nodes · 6941 edges · 107 communities (93 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e5787bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.ts
- tts/index.ts
- MyActivitiesBoard.tsx
- Button
- evaluate.ts
- library/types.ts
- commons.ts
- topics/[id]/page.tsx
- lessonData.ts
- classroom.ts
- next
- PageHeader
- audit
- MicSession
- voices.ts
- search.ts
- GameEditor.tsx
- package.json
- segments.ts
- games/service.ts
- lib/videos.ts
- mediaUrl
- 20261025012814_init/migration.sql
- requireTeacherPage
- autocorrect.ts
- auth.ts
- lextro.e2e.mjs
- rateLimit
- parts.tsx
- plainText
- 20261113220000_laxtrospeak_library/migration.sql
- AuthLayout
- Players.tsx
- TopicHero.tsx
- useVoiceSession.ts
- storage/index.ts
- assignments/page.tsx
- flow.e2e.mjs
- db.ts
- ActivitySettings.tsx
- AddListForm.tsx
- checkout/route.ts
- vitest
- SpellBoard.tsx
- photo-form.e2e.mjs
- RosterRow.tsx
- DiagramBoard.tsx
- GamePlayer.tsx
- audit
- CardPhotoForm.tsx
- TopicLesson.tsx
- compilerOptions
- dependencies
- SpanishField
- billing/page.tsx
- preview/[id]/page.tsx
- "public"."School"
- reports.ts
- ref_node_fs
- topic-hero.e2e.mjs
- templates.e2e.mjs
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
- print/page.tsx
- scripts
- "public"."Game"
- library/seed.ts
- CLAUDE.md
- Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity
- ActivityList.tsx
- TopicPlanEditor.tsx
- StorageDriver
- image-editor.e2e.mjs
- eslint.config.mjs
- spanish-check.ts
- "TopicPlan"
- Publicar en internet (Supabase + Vercel)
- build-accent-maps.mjs
- "public"."Topic"
- Button.tsx
- AssignTaskWizard.tsx
- app/layout.tsx
- LextroSpeak
- Student privacy & security notes
- Typography
- html-to-image
- vercel.json
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 122 edges
2. `HttpError` - 99 edges
3. `db` - 95 edges
4. `Button()` - 92 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 83 edges
7. `react` - 71 edges
8. `PageHeader()` - 58 edges
9. `requireTeacherPage()` - 53 edges
10. `Panel()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts
- `DeleteButton()` --indirect_call--> `deleteResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `PublishButton()` --indirect_call--> `publishResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts

## Import Cycles
- None detected.

## Communities (107 total, 14 thin omitted)

### Community 0 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 1 - "tts/index.ts"
Cohesion: 0.06
Nodes (48): GET(), maxDuration, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), AlphabetExplorer(), azure() (+40 more)

### Community 2 - "MyActivitiesBoard.tsx"
Cohesion: 0.07
Nodes (60): metadata, NewGame(), metadata, Search, CreateButton(), FEATURED, Oral(), TemplateGallery() (+52 more)

### Community 3 - "Button"
Cohesion: 0.15
Nodes (35): SheetEditor(), GradeForm(), PickedResources(), PickItem, MetaFields(), MetaForm(), NewResourceForm(), GradeOpt (+27 more)

### Community 4 - "evaluate.ts"
Cohesion: 0.11
Nodes (40): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+32 more)

### Community 5 - "library/types.ts"
Cohesion: 0.08
Nodes (41): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+33 more)

### Community 6 - "commons.ts"
Cohesion: 0.10
Nodes (33): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), FILE_HOSTS(), fileUrl() (+25 more)

### Community 7 - "topics/[id]/page.tsx"
Cohesion: 0.14
Nodes (25): DraftPreview(), metadata, STATUS, ManageActivities(), metadata, LibraryPage(), metadata, ResourcePreview() (+17 more)

### Community 8 - "lessonData.ts"
Cohesion: 0.14
Nodes (20): ActivityMaterials(), metadata, metadata, StudentViewPage(), EyeIcon(), TopicLessonProps, gameFor(), LessonStep (+12 more)

### Community 9 - "classroom.ts"
Cohesion: 0.12
Nodes (27): ownedClassroom(), ownedLevel(), checkMembers(), createClassroom(), createGroup(), createGroupWithMembers(), createLevel(), createStudent() (+19 more)

### Community 10 - "next"
Cohesion: 0.11
Nodes (26): next, zod, POST, POST, schema, POST, POST, start (+18 more)

### Community 11 - "PageHeader"
Cohesion: 0.12
Nodes (36): AddContent(), metadata, ContentList(), AdminGrades(), metadata, AdminHome(), metadata, AdminTopics() (+28 more)

### Community 12 - "audit"
Cohesion: 0.15
Nodes (37): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+29 more)

### Community 13 - "MicSession"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 14 - "voices.ts"
Cohesion: 0.08
Nodes (30): TtsConfig, AudioDefaults, AudioDefaultsContext, MAIN, RATE_STEPS, SAMPLE, loadBrowserVoices(), pending (+22 more)

### Community 15 - "search.ts"
Cohesion: 0.12
Nodes (27): GET, BLOCKED_WORDS, blockedWord(), hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED (+19 more)

### Community 16 - "GameEditor.tsx"
Cohesion: 0.13
Nodes (29): AudioField(), playFaceAudio(), SHORT(), stopFaceAudio(), FaceEditor(), FlashcardPreview(), swapItem(), blankItem() (+21 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 18 - "segments.ts"
Cohesion: 0.13
Nodes (24): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, ALSO_SPANISH, clearTags(), EN (+16 more)

### Community 19 - "games/service.ts"
Cohesion: 0.09
Nodes (45): Ctx, GET, PUT, CARDS, GET(), maxDuration, PreviewPage(), EditGame() (+37 more)

### Community 20 - "lib/videos.ts"
Cohesion: 0.16
Nodes (18): Ctx, PUT, POST, metadata, WatchPage(), Report, StudentWatch(), addToCollection() (+10 more)

### Community 21 - "mediaUrl"
Cohesion: 0.17
Nodes (25): POST, POST, POST, GET, POST, POST, done, POST (+17 more)

### Community 22 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 23 - "requireTeacherPage"
Cohesion: 0.15
Nodes (17): CategoriesPage(), metadata, metadata, TopicLessonPage(), MyActivitiesPage(), Dashboard(), metadata, AssignTaskPage() (+9 more)

### Community 24 - "autocorrect.ts"
Cohesion: 0.13
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 25 - "auth.ts"
Cohesion: 0.07
Nodes (63): POST(), escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword() (+55 more)

### Community 26 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 27 - "rateLimit"
Cohesion: 0.27
Nodes (12): GET, POST, schema, hashKey(), memory, memoryLimit(), rateLimit(), ensureAudio() (+4 more)

### Community 28 - "parts.tsx"
Cohesion: 0.12
Nodes (32): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+24 more)

### Community 29 - "plainText"
Cohesion: 0.10
Nodes (42): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+34 more)

### Community 30 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 31 - "AuthLayout"
Cohesion: 0.12
Nodes (19): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+11 more)

### Community 32 - "Players.tsx"
Cohesion: 0.17
Nodes (31): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), LinkPlayer(), ListenGame() (+23 more)

### Community 33 - "TopicHero.tsx"
Cohesion: 0.10
Nodes (32): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+24 more)

### Community 34 - "useVoiceSession.ts"
Cohesion: 0.12
Nodes (20): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+12 more)

### Community 35 - "storage/index.ts"
Cohesion: 0.14
Nodes (19): server-only, POST, PUT, GET, POST, GET, EXT, FileGroup (+11 more)

### Community 36 - "assignments/page.tsx"
Cohesion: 0.29
Nodes (8): AssignmentsPage(), ICON, Kind, KINDS, metadata, recipientLabel(), DeleteAssignmentButton(), Submit()

### Community 37 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 38 - "db.ts"
Cohesion: 0.10
Nodes (25): metadata, MyActivities(), metadata, MyProgress(), metadata, MyVideos(), Home(), EditGroupPage() (+17 more)

### Community 39 - "ActivitySettings.tsx"
Cohesion: 0.17
Nodes (14): FONT_SAMPLE, FontPreview(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section, SettingsValues (+6 more)

### Community 40 - "AddListForm.tsx"
Cohesion: 0.23
Nodes (15): AddListForm(), Roster, addStudentList(), ListResult, capitalize(), CheckedRow, checkRows(), friendlyPassword() (+7 more)

### Community 41 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

### Community 42 - "vitest"
Cohesion: 0.33
Nodes (3): vitest, poolerSafeUrl(), env

### Community 43 - "SpellBoard.tsx"
Cohesion: 0.20
Nodes (12): react, Config, DiagramPoints(), Point, sleep(), SpellBoard(), submit(), ALPHABET (+4 more)

### Community 44 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 45 - "RosterRow.tsx"
Cohesion: 0.06
Nodes (51): react-dom@19.1.0, react-dom, AdminLayout(), LearnLayout(), metadata, Privacy(), ClassLogin(), metadata (+43 more)

### Community 46 - "DiagramBoard.tsx"
Cohesion: 0.57
Nodes (6): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys()

### Community 47 - "GamePlayer.tsx"
Cohesion: 0.26
Nodes (11): GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer(), PlayerFrame(), StartScreen(), postJson(), StudentPlay() (+3 more)

### Community 48 - "audit"
Cohesion: 0.15
Nodes (27): POST, POST, ownedGroup(), ownedStudent(), schoolGame(), AssignState, createAssignment(), deleteAssignment() (+19 more)

### Community 49 - "CardPhotoForm.tsx"
Cohesion: 0.13
Nodes (22): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+14 more)

### Community 50 - "TopicLesson.tsx"
Cohesion: 0.18
Nodes (18): metadata, StudentTask(), ICON, KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase (+10 more)

### Community 51 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 52 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+10 more)

### Community 53 - "SpanishField"
Cohesion: 0.47
Nodes (5): SpanishField(), accept(), check(), maskTagged(), applySuggestion()

### Community 54 - "billing/page.tsx"
Cohesion: 0.60
Nodes (3): BillingPage(), metadata, BillingButtons()

### Community 55 - "preview/[id]/page.tsx"
Cohesion: 0.24
Nodes (8): metadata, recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole, renameGame()

### Community 56 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 57 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 60 - "templates.e2e.mjs"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 61 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 62 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 63 - "playwright"
Cohesion: 0.09
Nodes (7): errors, stamp, stamp, COLORS, db, stamp, playwright

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
Cohesion: 0.18
Nodes (14): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+6 more)

### Community 68 - "flashcards-printables.e2e.mjs"
Cohesion: 0.11
Nodes (8): COLORS, db, errors, stamp, db, dir, plan, @prisma/client

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
Cohesion: 0.08
Nodes (25): Ctx, Dict, EN, ES, UiLang, UiLangProvider(), EditStep, ico (+17 more)

### Community 73 - "print/page.tsx"
Cohesion: 0.60
Nodes (3): metadata, PrintAccess(), PrintButton()

### Community 74 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 75 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 76 - "library/seed.ts"
Cohesion: 0.29
Nodes (8): db, main(), CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary(), fileIdsOf()

### Community 78 - "Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity"
Cohesion: 0.20
Nodes (9): Built, not covered by automated tests, Create Activity & multilingual voice (`e2e/templates.e2e.mjs`), Hosting on Supabase + Vercel (`docs/DEPLOY.md`), Needs credentials / configuration, Next phases, Not tested yet (must be done before classroom use), Phase 2 — video library (`e2e/videos.e2e.mjs`), Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity (+1 more)

### Community 79 - "ActivityList.tsx"
Cohesion: 0.42
Nodes (7): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded

### Community 80 - "TopicPlanEditor.tsx"
Cohesion: 0.22
Nodes (6): ICON, KindIcon(), LABEL, PlanItem, TopicPlanEditor(), saveTopicPlan()

### Community 83 - "image-editor.e2e.mjs"
Cohesion: 0.13
Nodes (6): errors, NAMES, stamp, resetLinkFromLog(), sleep(), stamp

### Community 84 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 85 - "spanish-check.ts"
Cohesion: 0.27
Nodes (8): POST, ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

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

### Community 91 - "Button.tsx"
Cohesion: 0.21
Nodes (12): Bar(), ClassPage(), metadata, RosterPage(), AddStudentsMenu(), RosterHeader(), buttonClass(), Size (+4 more)

### Community 92 - "AssignTaskWizard.tsx"
Cohesion: 0.21
Nodes (11): StudentActivityPage(), StudentActivity(), ClassData, TopicData, createTopicTask(), recordActivityProgress(), TaskResult, taskSchema (+3 more)

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
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `SpellBoard.tsx` to `layout.ts`, `MyActivitiesBoard.tsx`, `Button`, `library/types.ts`, `topics/[id]/page.tsx`, `PageHeader`, `voices.ts`, `GameEditor.tsx`, `package.json`, `segments.ts`, `lib/videos.ts`, `requireTeacherPage`, `autocorrect.ts`, `parts.tsx`, `plainText`, `AuthLayout`, `Players.tsx`, `TopicHero.tsx`, `useVoiceSession.ts`, `db.ts`, `ActivitySettings.tsx`, `AddListForm.tsx`, `RosterRow.tsx`, `DiagramBoard.tsx`, `GamePlayer.tsx`, `CardPhotoForm.tsx`, `TopicLesson.tsx`, `dependencies`, `billing/page.tsx`, `preview/[id]/page.tsx`, `VideoForm`, `ImageField.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `Button.tsx`, `AssignTaskWizard.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062317429406037 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `tts/index.ts`, `MyActivitiesBoard.tsx`, `Button`, `library/types.ts`, `commons.ts`, `topics/[id]/page.tsx`, `lessonData.ts`, `classroom.ts`, `PageHeader`, `audit`, `GameEditor.tsx`, `package.json`, `games/service.ts`, `lib/videos.ts`, `mediaUrl`, `requireTeacherPage`, `auth.ts`, `rateLimit`, `AuthLayout`, `TopicHero.tsx`, `storage/index.ts`, `assignments/page.tsx`, `db.ts`, `ActivitySettings.tsx`, `AddListForm.tsx`, `checkout/route.ts`, `RosterRow.tsx`, `audit`, `TopicLesson.tsx`, `dependencies`, `preview/[id]/page.tsx`, `VideoForm`, `print/page.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `Button.tsx`, `AssignTaskWizard.tsx`, `app/layout.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `tts/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06093189964157706 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `flashcards-printables.e2e.mjs` to `topics/[id]/page.tsx`, `next`, `audit`, `package.json`, `games/service.ts`, `lib/videos.ts`, `mediaUrl`, `auth.ts`, `lextro.e2e.mjs`, `db.ts`, `photo-form.e2e.mjs`, `dependencies`, `reports.ts`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `playwright`, `library.e2e.mjs`, `video-player.e2e.mjs`, `library/seed.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `MyActivitiesBoard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0673903211216644 - nodes in this community are weakly interconnected._
- **Should `evaluate.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10628019323671498 - nodes in this community are weakly interconnected._