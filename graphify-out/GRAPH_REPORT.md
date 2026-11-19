# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 347 files · ~208,932 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2271 nodes · 7001 edges · 102 communities (86 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d17a468b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- PageHeader
- 20261025012814_init/migration.sql
- GameEditor.tsx
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- Acciones de aula, tareas y categorías
- games/templates.ts
- topics/[id]/page.tsx
- HttpError
- commons.ts
- Dependencias (package.json)
- db.ts
- Button
- Segmentación de texto
- MyActivitiesBoard.tsx
- next
- tts/index.ts
- Configuración TypeScript
- library/types.ts
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- useVoiceSession.ts
- ref_node_path
- Reproductor de video
- Tests e2e de flashcards
- Scripts de package.json
- stt/index.ts
- Dependencias de desarrollo
- Corrector de español
- AudioField.tsx
- webhook.ts
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- Configuración Next.js
- Middleware
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- lessonData.ts
- assignments/[id]/page.tsx
- TopicLesson.tsx
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicHero.tsx
- actions/videos.ts
- google.ts
- FlashcardsGame.tsx
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- roster.ts
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- GroupForm.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- preview/[id]/page.tsx
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- SpellBoard.tsx
- "public"."Game"
- teacher/library/page.tsx
- VideoForm
- games.ts
- ActivityList.tsx
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- TopicPlanEditor.tsx
- topic-hero.e2e.mjs
- build-accent-maps.mjs
- "public"."Topic"
- resources/[id]/page.tsx
- checkout/route.ts
- [slug]/page.tsx
- Button.tsx
- activity-actions.e2e.mjs
- vitest
- html-to-image
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `next` - 125 edges
2. `HttpError` - 103 edges
3. `db` - 98 edges
4. `Button()` - 90 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 85 edges
7. `react` - 69 edges
8. `PageHeader()` - 56 edges
9. `requireTeacherPage()` - 55 edges
10. `Panel()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `VoiceGamePlayer()` --indirect_call--> `DiagramBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/DiagramBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `MatchBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/MatchBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `SpellBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/SpellBoard.tsx
- `upload()` --calls--> `uploadBlob()`  [EXTRACTED]
  src/components/editor/CardPhotoForm.tsx → src/components/editor/ImageField.tsx
- `ForgotPasswordForm()` --indirect_call--> `requestPasswordReset()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts

## Import Cycles
- None detected.

## Communities (102 total, 16 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.11
Nodes (34): BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep(), COLORS (+26 more)

### Community 1 - "PageHeader"
Cohesion: 0.09
Nodes (46): AddContent(), metadata, AdminGrades(), metadata, AdminHome(), metadata, metadata, NewAssignment() (+38 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "GameEditor.tsx"
Cohesion: 0.09
Nodes (38): TtsConfig, AudioField(), playFaceAudio(), stopFaceAudio(), DiagramPoints(), Point, FaceEditor(), onPaste() (+30 more)

### Community 4 - "games/service.ts"
Cohesion: 0.13
Nodes (32): POST, schema, CARDS, GET(), maxDuration, PlayPage(), EditGame(), metadata (+24 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.11
Nodes (41): useVoiceSession(), audioUrlsIn(), scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH (+33 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "Acciones de aula, tareas y categorías"
Cohesion: 0.08
Nodes (54): zod, POST, Ctx, GET, PUT, POST, LT_LANG, POST (+46 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.13
Nodes (18): metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, PREVIEW_BG (+10 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.10
Nodes (41): ContentList(), metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata, Home() (+33 more)

### Community 11 - "HttpError"
Cohesion: 0.09
Nodes (50): POST, body, POST, POST, PUT, GET, POST, start (+42 more)

### Community 12 - "commons.ts"
Cohesion: 0.06
Nodes (59): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+51 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "db.ts"
Cohesion: 0.09
Nodes (52): server-only, metadata, escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset() (+44 more)

### Community 15 - "Button"
Cohesion: 0.12
Nodes (42): react, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm() (+34 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (29): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+21 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.09
Nodes (50): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+42 more)

### Community 18 - "next"
Cohesion: 0.07
Nodes (41): next, @prisma/client, POST, POST, POST, GET, POST, schema (+33 more)

### Community 19 - "tts/index.ts"
Cohesion: 0.10
Nodes (35): GET, ensureAudio(), VoiceChoice, azure(), azureSsml(), escapeXml(), gateway(), gatewayPart() (+27 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "library/types.ts"
Cohesion: 0.08
Nodes (44): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+36 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.13
Nodes (41): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+33 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthLayout"
Cohesion: 0.06
Nodes (40): AdminInvitePage(), dynamic, metadata, AdminLayout(), ForgotPasswordPage(), metadata, LearnLayout(), LoginPage() (+32 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.09
Nodes (25): Coach, CoachLine, Diagnostic, Input, SessionOptions, TurnResult, TYPED_HELP, MicState (+17 more)

### Community 27 - "ref_node_path"
Cohesion: 0.12
Nodes (6): COLORS, db, stamp, db, errors, stamp

### Community 28 - "Reproductor de video"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.10
Nodes (20): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+12 more)

### Community 31 - "stt/index.ts"
Cohesion: 0.10
Nodes (26): GET(), maxDuration, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), AlphabetExplorer(), azure() (+18 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "Corrector de español"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 34 - "AudioField.tsx"
Cohesion: 0.08
Nodes (33): AudioControl(), browserPreview(), generate(), AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel(), ensureGenerated() (+25 more)

### Community 35 - "webhook.ts"
Cohesion: 0.14
Nodes (23): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+15 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.09
Nodes (25): Ctx, Dict, EN, ES, UiLang, UiLangProvider(), EditStep, ico (+17 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 49 - "autocorrect.ts"
Cohesion: 0.13
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.22
Nodes (27): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+19 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.14
Nodes (22): metadata, StudentTask(), metadata, TopicLessonPage(), AssignTaskPage(), metadata, resourceOf(), TopicResources (+14 more)

### Community 53 - "assignments/[id]/page.tsx"
Cohesion: 0.14
Nodes (21): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), metadata, PrintAccess() (+13 more)

### Community 54 - "TopicLesson.tsx"
Cohesion: 0.15
Nodes (22): StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), TopicLessonProps (+14 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.17
Nodes (21): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+13 more)

### Community 57 - "TopicHero.tsx"
Cohesion: 0.16
Nodes (22): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+14 more)

### Community 58 - "actions/videos.ts"
Cohesion: 0.17
Nodes (17): Ctx, PUT, POST, metadata, addToCollection(), deleteCollection(), deleteVideo(), moveInCollection() (+9 more)

### Community 59 - "google.ts"
Cohesion: 0.18
Nodes (18): GET, PROBES, b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl() (+10 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.18
Nodes (20): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+12 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.22
Nodes (13): FavoriteButton(), AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep, RowTopic, StudentTopicRow() (+5 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "roster.ts"
Cohesion: 0.21
Nodes (15): addStudentList(), newSecret(), rand(), capitalize(), CheckedRow, checkRows(), fourDigitPin(), friendlyPassword() (+7 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.12
Nodes (7): errors, NAMES, stamp, db, dir, plan, slug()

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "playwright"
Cohesion: 0.14
Nodes (5): stamp, resetLinkFromLog(), sleep(), stamp, playwright

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "GroupForm.tsx"
Cohesion: 0.26
Nodes (9): EditGroupPage(), metadata, metadata, NewGroupPage(), AddListPage(), metadata, GroupForm(), S (+1 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "preview/[id]/page.tsx"
Cohesion: 0.24
Nodes (9): metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole (+1 more)

### Community 75 - "DiagramBoard.tsx"
Cohesion: 0.29
Nodes (11): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), MatchBoard(), done(), drop() (+3 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.24
Nodes (9): db, main(), TEMPLATES, CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary() (+1 more)

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.32
Nodes (9): Config, sleep(), SpellBoard(), submit(), ALPHABET, Letter, LETTER_STYLES, letterName() (+1 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "teacher/library/page.tsx"
Cohesion: 0.33
Nodes (8): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), libraryTopics()

### Community 82 - "VideoForm"
Cohesion: 0.29
Nodes (8): EditVideo(), metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "games.ts"
Cohesion: 0.29
Nodes (10): AnswerRow(), save(), schoolGame(), deleteGame(), langCode, saveAcceptedAnswers(), saveActivitySettings(), setGameFont() (+2 more)

### Community 84 - "ActivityList.tsx"
Cohesion: 0.36
Nodes (8): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, duplicateGame()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "TopicPlanEditor.tsx"
Cohesion: 0.25
Nodes (4): KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 89 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "resources/[id]/page.tsx"
Cohesion: 0.43
Nodes (5): DraftPreview(), ResourcePreview(), BackLink(), requireAdminPage(), resourceForPreview()

### Community 92 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

### Community 93 - "[slug]/page.tsx"
Cohesion: 0.39
Nodes (6): TopicPage(), metadata, StudentViewPage(), EyeIcon(), heroShapes(), GRADES

### Community 94 - "Button.tsx"
Cohesion: 0.32
Nodes (6): AddStudentsMenu(), buttonClass(), Size, sizes, Variant, variants

### Community 96 - "vitest"
Cohesion: 0.40
Nodes (3): vitest, poolerSafeUrl(), env

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Button` to `parts.tsx`, `PageHeader`, `GameEditor.tsx`, `layout.ts`, `games/templates.ts`, `topics/[id]/page.tsx`, `commons.ts`, `Dependencias (package.json)`, `db.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `next`, `library/types.ts`, `AuthLayout`, `useVoiceSession.ts`, `Reproductor de video`, `Scripts de package.json`, `AudioField.tsx`, `ImageField.tsx`, `autocorrect.ts`, `Players.tsx`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `GroupForm.tsx`, `preview/[id]/page.tsx`, `DiagramBoard.tsx`, `SpellBoard.tsx`, `teacher/library/page.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11219512195121951 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `PageHeader`, `GameEditor.tsx`, `games/service.ts`, `Acciones de aula, tareas y categorías`, `topics/[id]/page.tsx`, `HttpError`, `Dependencias (package.json)`, `db.ts`, `Button`, `MyActivitiesBoard.tsx`, `library/types.ts`, `library.ts`, `AuthLayout`, `Scripts de package.json`, `stt/index.ts`, `webhook.ts`, `Layout raíz`, `Configuración Next.js`, `Middleware`, `lessonData.ts`, `assignments/[id]/page.tsx`, `TopicLesson.tsx`, `TopicHero.tsx`, `actions/videos.ts`, `google.ts`, `TopicRow.tsx`, `GroupForm.tsx`, `preview/[id]/page.tsx`, `teacher/library/page.tsx`, `games.ts`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `resources/[id]/page.tsx`, `checkout/route.ts`, `[slug]/page.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `PageHeader` be split into smaller, more focused modules?**
  _Cohesion score 0.09077380952380952 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `next` to `games/service.ts`, `Acciones de aula, tareas y categorías`, `HttpError`, `Dependencias (package.json)`, `db.ts`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `webhook.ts`, `lextro.e2e.mjs`, `assignments/[id]/page.tsx`, `photo-form.e2e.mjs`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `GameEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09397163120567376 - nodes in this community are weakly interconnected._