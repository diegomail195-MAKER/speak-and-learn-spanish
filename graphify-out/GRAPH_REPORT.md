# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 347 files · ~208,934 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2273 nodes · 7006 edges · 102 communities (88 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf9f3cbd`
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
- verify.ts
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
- AuthForms.tsx
- useVoiceSession.ts
- ref_node_path
- games/types.ts
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
- TeacherShell.tsx
- PublicHeader
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- lessonData.ts
- reports.ts
- TopicLesson.tsx
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicHero.tsx
- auth.ts
- HttpError
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
- roster/page.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- GameEditorInner
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- teacher/page.tsx
- SpellBoard.tsx
- "public"."Game"
- CardPhotoForm.tsx
- VideoForm
- ActivitySettings.tsx
- ActivityList.tsx
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- ResourceForms.tsx
- topic-hero.e2e.mjs
- build-accent-maps.mjs
- "public"."Topic"
- resources/[id]/page.tsx
- next
- emails/templates.ts
- Button.tsx
- activity-actions.e2e.mjs
- i18n.tsx
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
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `seedLibrary()`  [EXTRACTED]
  prisma/seed.ts → src/lib/library/seed.ts
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `MetaForm()` --indirect_call--> `updateResourceMeta()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `PublishButton()` --indirect_call--> `publishResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts

## Import Cycles
- None detected.

## Communities (102 total, 14 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.12
Nodes (24): BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep(), COLORS (+16 more)

### Community 1 - "PageHeader"
Cohesion: 0.09
Nodes (44): AddContent(), metadata, AdminGrades(), metadata, AdminHome(), metadata, Actions(), AssignedBanner() (+36 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "GameEditor.tsx"
Cohesion: 0.15
Nodes (26): TtsConfig, AudioDefaults, AudioDefaultsContext, AudioField(), MAIN, playFaceAudio(), RATE_STEPS, SAMPLE (+18 more)

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (33): POST, CARDS, GET(), maxDuration, metadata, PreviewPage(), recipientLabel(), EditGame() (+25 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.08
Nodes (45): vitest, poolerSafeUrl(), scoreTurn(), openSteps(), SequenceStep, say(), AnswerSpec, CARRIERS (+37 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "Acciones de aula, tareas y categorías"
Cohesion: 0.08
Nodes (55): POST, Ctx, GET, PUT, POST, GET, ownedClassroom(), ownedGroup() (+47 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.11
Nodes (22): db, main(), metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery() (+14 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.09
Nodes (41): ContentList(), metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata, TopicPage() (+33 more)

### Community 11 - "HttpError"
Cohesion: 0.08
Nodes (36): POST, PUT, POST, start, GET, done, POST, start (+28 more)

### Community 12 - "commons.ts"
Cohesion: 0.05
Nodes (66): CardPhotoForm(), API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS(), fileUrl() (+58 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "verify.ts"
Cohesion: 0.21
Nodes (17): signInTeacher(), signUpTeacher(), acceptAdminInvite(), acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken() (+9 more)

### Community 15 - "Button"
Cohesion: 0.11
Nodes (43): ContentEditor(), listOps(), PairsEditor(), RowTools(), SheetEditor(), GradeForm(), MetaFields(), NewResourceForm() (+35 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.11
Nodes (30): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+22 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.09
Nodes (50): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+42 more)

### Community 18 - "next"
Cohesion: 0.08
Nodes (51): @prisma/client, server-only, zod, POST, schema, POST, GET, POST (+43 more)

### Community 19 - "tts/index.ts"
Cohesion: 0.10
Nodes (34): speechSegments(), ensureAudio(), VoiceChoice, azure(), azureSsml(), escapeXml(), gateway(), gatewayPart() (+26 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "library/types.ts"
Cohesion: 0.08
Nodes (38): ART_OPTIONS, FilePicker(), ImagePicker(), useUpload(), LinkPreview(), Uploaded, uploadLibraryFile(), CATEGORY (+30 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.15
Nodes (37): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+29 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthForms.tsx"
Cohesion: 0.13
Nodes (20): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+12 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (19): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+11 more)

### Community 27 - "ref_node_path"
Cohesion: 0.12
Nodes (6): COLORS, db, stamp, db, errors, stamp

### Community 28 - "games/types.ts"
Cohesion: 0.17
Nodes (19): MatchBoard(), done(), drop(), sleep(), GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer() (+11 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, motion@^14.14.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2 (+14 more)

### Community 31 - "stt/index.ts"
Cohesion: 0.15
Nodes (18): GET(), maxDuration, azure(), CONTEXT, gateway(), GATEWAY_MODELS, google(), LETTER_HINTS (+10 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "Corrector de español"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 34 - "AudioField.tsx"
Cohesion: 0.10
Nodes (22): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+14 more)

### Community 35 - "webhook.ts"
Cohesion: 0.17
Nodes (17): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+9 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.12
Nodes (18): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+10 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "TeacherShell.tsx"
Cohesion: 0.19
Nodes (13): AdminLayout(), LearnLayout(), TeacherLayout(), NavLinks(), LINKS, TeacherShell(), VerifyBanner(), Avatar() (+5 more)

### Community 40 - "PublicHeader"
Cohesion: 0.16
Nodes (12): metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), S, StudentPicker() (+4 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.21
Nodes (28): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), LinkPlayer(), ListenGame() (+20 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.11
Nodes (22): metadata, TopicLessonPage(), metadata, StudentViewPage(), TopicLessonProps, KindIcon(), LABEL, PlanItem (+14 more)

### Community 53 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 54 - "TopicLesson.tsx"
Cohesion: 0.17
Nodes (18): metadata, StudentTask(), StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase (+10 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.14
Nodes (24): DiagramPoints(), Point, Clips, LetsPractice(), begin(), go(), lineFor(), loaded (+16 more)

### Community 57 - "TopicHero.tsx"
Cohesion: 0.10
Nodes (30): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+22 more)

### Community 58 - "auth.ts"
Cohesion: 0.17
Nodes (18): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword(), resetSchema (+10 more)

### Community 59 - "HttpError"
Cohesion: 0.15
Nodes (29): POST, POST, GET, PROBES, GET, POST, body, POST (+21 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.20
Nodes (19): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+11 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.17
Nodes (19): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), AccessItem (+11 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "roster.ts"
Cohesion: 0.19
Nodes (18): AddListForm(), Roster, addStudentList(), ListResult, newSecret(), rand(), capitalize(), CheckedRow (+10 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.13
Nodes (6): errors, NAMES, stamp, db, dir, plan

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

### Community 71 - "roster/page.tsx"
Cohesion: 0.15
Nodes (14): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), metadata, RosterPage() (+6 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "GameEditorInner"
Cohesion: 0.17
Nodes (13): FONT_SAMPLE, FontPreview(), blankItem(), contentSnapshot(), editorState(), GameEditorInner(), assign(), doPublish() (+5 more)

### Community 75 - "DiagramBoard.tsx"
Cohesion: 0.57
Nodes (6): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys()

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "teacher/page.tsx"
Cohesion: 0.21
Nodes (12): metadata, StudentAlphabet(), metadata, TeacherAlphabet(), Dashboard(), metadata, Backup, UnsavedDrafts() (+4 more)

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.18
Nodes (15): react, AlphabetExplorer(), Config, sleep(), SpellBoard(), submit(), FeedbackBubble(), ListenBlocked() (+7 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "CardPhotoForm.tsx"
Cohesion: 0.18
Nodes (13): cache, CardFace, LANG, Photo, PhotoBox(), upload(), SearchPanel(), SIDE (+5 more)

### Community 82 - "VideoForm"
Cohesion: 0.42
Nodes (6): EditVideo(), metadata, metadata, NewVideo(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.12
Nodes (24): AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section, SettingsData, SHORT, Voice (+16 more)

### Community 84 - "ActivityList.tsx"
Cohesion: 0.36
Nodes (8): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, duplicateGame()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "ResourceForms.tsx"
Cohesion: 0.29
Nodes (9): EditResource(), DeleteButton(), MetaForm(), Method, METHOD_LABEL, METHODS, PublishButton(), TopicOpt (+1 more)

### Community 89 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "resources/[id]/page.tsx"
Cohesion: 0.43
Nodes (5): DraftPreview(), ResourcePreview(), BackLink(), requireAdminPage(), resourceForPreview()

### Community 92 - "next"
Cohesion: 0.13
Nodes (12): nextConfig, securityHeaders, next, POST, POST, LT_LANG, POST, schema (+4 more)

### Community 93 - "emails/templates.ts"
Cohesion: 0.47
Nodes (9): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, verifyEmail() (+1 more)

### Community 94 - "Button.tsx"
Cohesion: 0.14
Nodes (19): Home(), metadata, NewAssignment(), Bar(), ClassPage(), AssignTaskPage(), metadata, resourceOf() (+11 more)

### Community 96 - "i18n.tsx"
Cohesion: 0.25
Nodes (7): GameEditor(), Ctx, Dict, EN, ES, UiLang, UiLangProvider()

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `PageHeader`, `GameEditor.tsx`, `games/service.ts`, `Acciones de aula, tareas y categorías`, `topics/[id]/page.tsx`, `HttpError`, `Dependencias (package.json)`, `verify.ts`, `Button`, `MyActivitiesBoard.tsx`, `next`, `library.ts`, `AuthForms.tsx`, `Scripts de package.json`, `stt/index.ts`, `webhook.ts`, `Layout raíz`, `TeacherShell.tsx`, `PublicHeader`, `lessonData.ts`, `TopicLesson.tsx`, `TopicHero.tsx`, `auth.ts`, `HttpError`, `TopicRow.tsx`, `roster.ts`, `roster/page.tsx`, `teacher/page.tsx`, `VideoForm`, `ActivitySettings.tsx`, `ActivityList.tsx`, `ResourceForms.tsx`, `resources/[id]/page.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12183908045977011 - nodes in this community are weakly interconnected._
- **Why does `react` connect `SpellBoard.tsx` to `parts.tsx`, `PageHeader`, `GameEditor.tsx`, `layout.ts`, `games/templates.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `Button`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `next`, `library/types.ts`, `AuthForms.tsx`, `useVoiceSession.ts`, `games/types.ts`, `Scripts de package.json`, `ImageField.tsx`, `TeacherShell.tsx`, `PublicHeader`, `autocorrect.ts`, `Players.tsx`, `lessonData.ts`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `roster.ts`, `DiagramBoard.tsx`, `teacher/page.tsx`, `CardPhotoForm.tsx`, `ActivitySettings.tsx`, `ActivityList.tsx`, `ResourceForms.tsx`, `Button.tsx`, `i18n.tsx`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Should `PageHeader` be split into smaller, more focused modules?**
  _Cohesion score 0.09435028248587571 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `next` to `games/service.ts`, `games/templates.ts`, `Dependencias (package.json)`, `library/types.ts`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `webhook.ts`, `lextro.e2e.mjs`, `reports.ts`, `HttpError`, `photo-form.e2e.mjs`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `GameEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14919354838709678 - nodes in this community are weakly interconnected._