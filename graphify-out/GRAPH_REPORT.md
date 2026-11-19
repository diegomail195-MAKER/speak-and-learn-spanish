# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 377 files · ~224,474 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2425 nodes · 7597 edges · 106 communities (94 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78aaca5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- db.ts
- 20261025012814_init/migration.sql
- GameEditor.tsx
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- classroom.ts
- lessonData.ts
- topics/[id]/page.tsx
- api.ts
- search.ts
- Dependencias (package.json)
- db.ts
- Button
- Segmentación de texto
- MyActivitiesBoard.tsx
- next
- access.ts
- Configuración TypeScript
- library/types.ts
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- PublicHeader
- useVoiceSession.ts
- ref_node_path
- Reproductor de video
- Tests e2e de flashcards
- Scripts de package.json
- tts/index.ts
- Dependencias de desarrollo
- Corrector de español
- AudioField.tsx
- teacher/page.tsx
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- mediaUrl
- commons.ts
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
- requireTeacher
- google.ts
- FlashcardsGame.tsx
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- AuthLayout
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- users/page.tsx
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- SpellBoard.tsx
- "public"."Game"
- WsIcon
- CardPhotoForm.tsx
- ActivitySettings.tsx
- ActivityList.tsx
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- TopicPlanEditor.tsx
- admin/page.tsx
- ref_node_fs
- "public"."Topic"
- resources/[id]/page.tsx
- checkout/route.ts
- LibraryBits.tsx
- Button.tsx
- dashboards.e2e.mjs
- activity/page.tsx
- html-to-image
- vercel.json
- PageTitle
- teacher/videos/page.tsx
- topic-rows-v2.e2e.mjs
- AssignTaskWizard.tsx

## God Nodes (most connected - your core abstractions)
1. `next` - 141 edges
2. `db` - 109 edges
3. `HttpError` - 104 edges
4. `audit()` - 97 edges
5. `Button()` - 90 edges
6. `requireTeacher()` - 90 edges
7. `react` - 81 edges
8. `requireTeacherPage()` - 59 edges
9. `Input()` - 48 edges
10. `PageHeader()` - 46 edges

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

## Communities (106 total, 12 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.11
Nodes (33): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+25 more)

### Community 1 - "db.ts"
Cohesion: 0.14
Nodes (25): AddContent(), metadata, BillingPage(), metadata, CategoriesPage(), metadata, EditGroupPage(), metadata (+17 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "GameEditor.tsx"
Cohesion: 0.08
Nodes (37): AudioField(), stopFaceAudio(), DiagramPoints(), Point, FaceEditor(), FlashcardPreview(), RowControls(), swapItem() (+29 more)

### Community 4 - "games/service.ts"
Cohesion: 0.06
Nodes (67): POST, schema, Ctx, GET, PUT, CARDS, GET(), maxDuration (+59 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (43): useVoiceSession(), audioUrlsIn(), scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH (+35 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "classroom.ts"
Cohesion: 0.07
Nodes (49): AddListForm(), Roster, RosterRow(), Row, AddStudentForm(), PinNotice(), ResetPinButton(), inputClass (+41 more)

### Community 9 - "lessonData.ts"
Cohesion: 0.11
Nodes (27): metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata, StudentTask(), ActivityMaterials() (+19 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.20
Nodes (16): EditResource(), ContentList(), metadata, STATUS, ManageActivities(), metadata, GameLibraryPanel(), DeleteButton() (+8 more)

### Community 11 - "api.ts"
Cohesion: 0.14
Nodes (23): POST, PUT, GET, POST, start, GET, maxDuration, POST (+15 more)

### Community 12 - "search.ts"
Cohesion: 0.11
Nodes (28): POST, GET, BLOCKED_WORDS, blockedWord(), hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize() (+20 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (36): devDependencies, dictionary-en@^4.0.0, dictionary-es@^4.0.0, dictionary-fr@^3.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0 (+28 more)

### Community 14 - "db.ts"
Cohesion: 0.05
Nodes (81): AdminInvitePage(), dynamic, metadata, POST(), VerifyBanner(), Workspace, WsLink, ADMIN_LINKS (+73 more)

### Community 15 - "Button"
Cohesion: 0.13
Nodes (37): react, GradeForm(), AddResult, LibraryPicker(), PickedResources(), PickItem, PublishButton(), GradeOpt (+29 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (29): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+21 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.09
Nodes (50): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+42 more)

### Community 18 - "next"
Cohesion: 0.09
Nodes (32): nextConfig, securityHeaders, next, POST, POST, POST, POST, body (+24 more)

### Community 19 - "access.ts"
Cohesion: 0.12
Nodes (25): metadata, NewAssignment(), AssignmentsPage(), ICON, Kind, metadata, recipientLabel(), metadata (+17 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "library/types.ts"
Cohesion: 0.08
Nodes (45): ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools(), SheetEditor() (+37 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.08
Nodes (58): EditVideo(), metadata, metadata, NewVideo(), StatusPillClient(), TopicStatusBar(), AdminState, createSchool() (+50 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 25 - "PublicHeader"
Cohesion: 0.13
Nodes (16): LearnLayout(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), S (+8 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.11
Nodes (20): Coach, CoachLine, Diagnostic, Input, SessionOptions, TurnResult, TYPED_HELP, MicState (+12 more)

### Community 27 - "ref_node_path"
Cohesion: 0.11
Nodes (5): errors, stamp, db, errors, stamp

### Community 28 - "Reproductor de video"
Cohesion: 0.17
Nodes (12): metadata, WatchPage(), Report, StudentWatch(), fmt(), loadYouTubeApi(), ProgressReport, SPEEDS (+4 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.11
Nodes (18): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0 (+10 more)

### Community 31 - "tts/index.ts"
Cohesion: 0.06
Nodes (47): vitest, GET(), maxDuration, metadata, StudentAlphabet(), poolerSafeUrl(), env, azure() (+39 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "Corrector de español"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 34 - "AudioField.tsx"
Cohesion: 0.07
Nodes (42): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel() (+34 more)

### Community 35 - "teacher/page.tsx"
Cohesion: 0.17
Nodes (22): ClassesPage(), metadata, DashboardContent(), metadata, STATUS_CLS, metadata, ProgressPage(), Card() (+14 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.11
Nodes (23): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+15 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "mediaUrl"
Cohesion: 0.20
Nodes (19): POST, GET, POST, POST, done, POST, start, requireVideoAdmin() (+11 more)

### Community 40 - "commons.ts"
Cohesion: 0.16
Nodes (21): API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS(), fileUrl(), HEADERS (+13 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.24
Nodes (23): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+15 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.15
Nodes (19): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), AssignTaskPage(), metadata (+11 more)

### Community 53 - "assignments/[id]/page.tsx"
Cohesion: 0.15
Nodes (21): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), metadata, PrintAccess() (+13 more)

### Community 54 - "TopicLesson.tsx"
Cohesion: 0.21
Nodes (17): KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), useLessonVoice(), postJson() (+9 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.13
Nodes (29): StripRole, Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf() (+21 more)

### Community 57 - "TopicHero.tsx"
Cohesion: 0.15
Nodes (23): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+15 more)

### Community 58 - "requireTeacher"
Cohesion: 0.11
Nodes (28): server-only, zod, POST, LT_LANG, POST, schema, POST, GET (+20 more)

### Community 59 - "google.ts"
Cohesion: 0.17
Nodes (19): GET, PROBES, searchCommons(), b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider() (+11 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.19
Nodes (20): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+12 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.22
Nodes (14): CATEGORIES, metadata, AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep, RowTopic (+6 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "AuthLayout"
Cohesion: 0.15
Nodes (15): ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic, metadata, ResetPasswordPage(), metadata (+7 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.22
Nodes (3): errors, NAMES, stamp

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "playwright"
Cohesion: 0.10
Nodes (7): errors, stamp, stamp, resetLinkFromLog(), sleep(), stamp, playwright

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.21
Nodes (15): metadata, AdminRowTopic, AdminTopicRow(), OPTIONS, TopicStatusMenu(), Kind3D(), kindLabel(), orderedKinds() (+7 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.15
Nodes (8): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "users/page.tsx"
Cohesion: 0.19
Nodes (15): metadata, ROLE_LABEL, ROLES, Schools(), Users(), UsersAndSchools(), AccountPage(), metadata (+7 more)

### Community 75 - "DiagramBoard.tsx"
Cohesion: 0.57
Nodes (6): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys()

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.14
Nodes (14): COLORS, db, stamp, db, main(), @prisma/client, TEMPLATES, CATEGORY (+6 more)

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.18
Nodes (14): AlphabetExplorer(), Config, sleep(), SpellBoard(), submit(), FeedbackBubble(), ListenBlocked(), MicIndicator() (+6 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "WsIcon"
Cohesion: 0.24
Nodes (12): Error(), Error(), DashError(), isActive(), useDismiss(), UserMenu(), WorkspaceFrame(), WORKSPACES (+4 more)

### Community 82 - "CardPhotoForm.tsx"
Cohesion: 0.17
Nodes (14): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+6 more)

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.19
Nodes (14): ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section (+6 more)

### Community 84 - "ActivityList.tsx"
Cohesion: 0.18
Nodes (14): AdminLayout(), metadata, TeacherAlphabet(), GamesPage(), metadata, TeacherLayout(), WorkspaceShell(), ActivityFilters() (+6 more)

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "TopicPlanEditor.tsx"
Cohesion: 0.19
Nodes (8): KindIcon(), LABEL, PlanItem, TopicPlanEditor(), ownedClassroom(), createLevel(), key, saveTopicPlan()

### Community 88 - "admin/page.tsx"
Cohesion: 0.23
Nodes (12): AdminOverview(), AdminOverviewContent(), metadata, Dashboard(), StatCard(), StatCardSkeleton(), DashLoading(), AdminTopicFilter (+4 more)

### Community 89 - "ref_node_fs"
Cohesion: 0.22
Nodes (7): db, dir, plan, build(), strip(), words(), slug()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "resources/[id]/page.tsx"
Cohesion: 0.36
Nodes (7): DraftPreview(), ResourcePreview(), BackLink(), noop(), ResourcePlayer(), useInBrowser(), resourceForPreview()

### Community 92 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

### Community 93 - "LibraryBits.tsx"
Cohesion: 0.19
Nodes (13): AdminTopicPreview(), metadata, TopicPage(), metadata, StudentViewPage(), FavoriteButton(), EyeIcon(), KindDot() (+5 more)

### Community 94 - "Button.tsx"
Cohesion: 0.14
Nodes (18): Home(), Bar(), ClassPage(), metadata, RosterPage(), AddStudentsMenu(), Art(), buttonClass() (+10 more)

### Community 95 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 96 - "activity/page.tsx"
Cohesion: 0.24
Nodes (11): ActivityLog(), metadata, ACTION_GROUPS, actionWhere(), ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf() (+3 more)

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "PageTitle"
Cohesion: 0.33
Nodes (9): ContentLibrary(), AdminSettings(), metadata, Status(), metadata, NewTopic(), AdminTopics(), PageTitle() (+1 more)

### Community 103 - "teacher/videos/page.tsx"
Cohesion: 0.25
Nodes (8): metadata, MyVideos(), metadata, TeacherWatch(), fmt(), metadata, VideosPage(), toPlayVideo()

### Community 104 - "topic-rows-v2.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 105 - "AssignTaskWizard.tsx"
Cohesion: 0.36
Nodes (6): AssignTaskWizard(), ClassData, TopicData, createTopicTask(), dedupeRecipients(), GroupInfo

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Button` to `parts.tsx`, `db.ts`, `GameEditor.tsx`, `games/service.ts`, `layout.ts`, `classroom.ts`, `lessonData.ts`, `Dependencias (package.json)`, `db.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `library/types.ts`, `library.ts`, `PublicHeader`, `useVoiceSession.ts`, `Reproductor de video`, `Scripts de package.json`, `AudioField.tsx`, `teacher/page.tsx`, `ImageField.tsx`, `autocorrect.ts`, `Players.tsx`, `lessonData.ts`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `AuthLayout`, `DashBits.tsx`, `users/page.tsx`, `DiagramBoard.tsx`, `SpellBoard.tsx`, `WsIcon`, `CardPhotoForm.tsx`, `ActivitySettings.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `admin/page.tsx`, `LibraryBits.tsx`, `Button.tsx`, `AssignTaskWizard.tsx`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `GameEditor.tsx`, `games/service.ts`, `classroom.ts`, `lessonData.ts`, `topics/[id]/page.tsx`, `api.ts`, `search.ts`, `Dependencias (package.json)`, `db.ts`, `Button`, `MyActivitiesBoard.tsx`, `access.ts`, `library.ts`, `PublicHeader`, `Reproductor de video`, `Scripts de package.json`, `tts/index.ts`, `teacher/page.tsx`, `Layout raíz`, `mediaUrl`, `lessonData.ts`, `assignments/[id]/page.tsx`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `requireTeacher`, `google.ts`, `TopicRow.tsx`, `AuthLayout`, `DashBits.tsx`, `users/page.tsx`, `WsIcon`, `ActivitySettings.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `admin/page.tsx`, `resources/[id]/page.tsx`, `checkout/route.ts`, `LibraryBits.tsx`, `Button.tsx`, `activity/page.tsx`, `PageTitle`, `teacher/videos/page.tsx`, `AssignTaskWizard.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14082503556187767 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `library/seed.ts` to `db.ts`, `games/service.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `db.ts`, `next`, `library.ts`, `ref_node_path`, `Scripts de package.json`, `mediaUrl`, `lextro.e2e.mjs`, `assignments/[id]/page.tsx`, `requireTeacher`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `users/page.tsx`, `admin/page.tsx`, `ref_node_fs`, `dashboards.e2e.mjs`, `activity/page.tsx`, `topic-rows-v2.e2e.mjs`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `GameEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._