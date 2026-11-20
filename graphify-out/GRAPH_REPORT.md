# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 413 files · ~246,775 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2628 nodes · 8267 edges · 117 communities (98 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4864fbc3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- db.ts
- 20261025012814_init/migration.sql
- SpeakingPlayer.tsx
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- session.ts
- topic-preview.e2e.mjs
- commons.ts
- mediaUrl
- search.ts
- Dependencias (package.json)
- auth.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- guards.ts
- google.ts
- Configuración TypeScript
- TopicHero.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- library/types.ts
- topic-rows.e2e.mjs
- settings/page.tsx
- Tests e2e de flashcards
- Scripts de package.json
- topics/[id]/page.tsx
- Dependencias de desarrollo
- verify.ts
- CardPhotoForm.tsx
- WsIcon
- Configuración ESLint
- games/types.ts
- Layout raíz
- useVoiceSession.ts
- teacher/library/page.tsx
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- create-activity.e2e.mjs
- tts/index.ts
- classroom.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicLesson.tsx
- TopicPlanEditor.tsx
- tasks/[assignmentId]/page.tsx
- community.e2e.mjs
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- users/page.tsx
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- ref_node_path
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- DiagramBoard.tsx
- roster.ts
- "public"."MediaAsset"
- "public"."User"
- storage/index.ts
- actions/tasks.ts
- "public"."Game"
- voices.ts
- VideoForm
- ActivitySettings.tsx
- resources/[id]/page.tsx
- ref_node_fs
- library-header.e2e.mjs
- GameEditor.tsx
- safety.ts
- ImageField.tsx
- "public"."Topic"
- DashBits.tsx
- assignments/[id]/page.tsx
- SpellBoard.tsx
- lessonData.ts
- admin/page.tsx
- lib/review.ts
- next
- vercel.json
- teacher/page.tsx
- States.tsx
- html-to-image
- build-accent-maps.mjs
- db-url.ts
- dashboards.e2e.mjs
- Card
- next.config.ts
- 20261122000000_review_speaking_settings/migration.sql
- video-protect.e2e.mjs
- middleware.ts
- checkout/route.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 154 edges
2. `db` - 116 edges
3. `HttpError` - 113 edges
4. `audit()` - 105 edges
5. `requireTeacher()` - 94 edges
6. `Button()` - 90 edges
7. `react` - 88 edges
8. `requireTeacherPage()` - 67 edges
9. `Input()` - 48 edges
10. `PageHeader()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `VoiceGamePlayer()` --indirect_call--> `DiagramBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/DiagramBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `SpellBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/SpellBoard.tsx
- `ProfileForm()` --indirect_call--> `updateProfile()`  [INFERRED]
  src/components/teacher/ProfileForm.tsx → src/lib/actions/account.ts
- `ForgotPasswordForm()` --indirect_call--> `requestPasswordReset()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts
- `ResetPasswordForm()` --indirect_call--> `resetPassword()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (117 total, 19 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.10
Nodes (36): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+28 more)

### Community 1 - "db.ts"
Cohesion: 0.08
Nodes (62): AddContent(), metadata, ContentList(), Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata (+54 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "SpeakingPlayer.tsx"
Cohesion: 0.16
Nodes (12): Done, Status, EngineResult, ListenOptions, ServerEngine, SpeechEngine, SR, webSpeechAvailable() (+4 more)

### Community 4 - "games/service.ts"
Cohesion: 0.08
Nodes (49): POST, schema, Ctx, GET, PUT, GET, CARDS, GET() (+41 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (41): vitest, scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer() (+33 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "session.ts"
Cohesion: 0.33
Nodes (6): GET, Home(), destroySession(), getSessionUser, hashToken(), SessionUser

### Community 9 - "topic-preview.e2e.mjs"
Cohesion: 0.10
Nodes (9): assign(), byTitle(), db, errors, signedIn(), stamp, STEPS, studentIn() (+1 more)

### Community 10 - "commons.ts"
Cohesion: 0.19
Nodes (16): API(), CommonsPhoto, CommonsStats, dropReason(), FILE_HOSTS(), fileUrl(), HEADERS, Info (+8 more)

### Community 11 - "mediaUrl"
Cohesion: 0.11
Nodes (29): POST, PUT, POST, start, done, POST, start, maxDuration (+21 more)

### Community 12 - "search.ts"
Cohesion: 0.16
Nodes (19): searchCommons(), hasBlockedWords(), isSafeAnnotation(), download(), fetchSafeImage(), ImageResult, ImageSize, pixabay() (+11 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "auth.ts"
Cohesion: 0.07
Nodes (55): POST(), escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword() (+47 more)

### Community 15 - "react"
Cohesion: 0.11
Nodes (44): react, metadata, RosterPage(), GradeForm(), MetaFields(), MetaForm(), NewResourceForm(), ForgotPasswordForm() (+36 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.09
Nodes (36): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+28 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.05
Nodes (80): react-dom@19.1.0, react-dom, AdminNewGame(), metadata, AdminCommunityPage(), metadata, AdminMyActivitiesPage(), metadata (+72 more)

### Community 18 - "guards.ts"
Cohesion: 0.10
Nodes (36): @prisma/client, server-only, Ctx, PUT, POST, metadata, MyActivities(), metadata (+28 more)

### Community 19 - "google.ts"
Cohesion: 0.16
Nodes (18): b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress(), Provider (+10 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicHero.tsx"
Cohesion: 0.15
Nodes (25): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+17 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.10
Nodes (48): db, main(), addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade() (+40 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthLayout"
Cohesion: 0.06
Nodes (33): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LearnLayout(), LoginPage(), metadata (+25 more)

### Community 26 - "library/types.ts"
Cohesion: 0.08
Nodes (45): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+37 more)

### Community 27 - "topic-rows.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 28 - "settings/page.tsx"
Cohesion: 0.17
Nodes (16): AdminLayout(), AdminSettings(), metadata, Status(), metadata, NewTopic(), metadata, SettingsForm() (+8 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.12
Nodes (16): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, server-only@^0.0.1 (+8 more)

### Community 31 - "topics/[id]/page.tsx"
Cohesion: 0.13
Nodes (28): metadata, STATUS, ManageActivities(), metadata, GameLibraryPanel(), AddResult, LibraryPicker(), PickedResources() (+20 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "verify.ts"
Cohesion: 0.27
Nodes (9): VerifyBanner(), acceptAdminInvite(), acceptSchema, confirmEmail(), resendVerification(), VerifyState, promoteVerified(), shouldPromote() (+1 more)

### Community 34 - "CardPhotoForm.tsx"
Cohesion: 0.15
Nodes (19): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+11 more)

### Community 35 - "WsIcon"
Cohesion: 0.15
Nodes (18): TeacherLayout(), StatusPillClient(), TopicStatusBar(), isActive(), useDismiss(), UserMenu(), Workspace, WorkspaceFrame() (+10 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "games/types.ts"
Cohesion: 0.18
Nodes (13): AudioDefaults, SettingsValues, EditorGame, EditorQuestion, FaceAudio, FaceData, GameSettings, ItemData (+5 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "useVoiceSession.ts"
Cohesion: 0.27
Nodes (9): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), pick() (+1 more)

### Community 40 - "teacher/library/page.tsx"
Cohesion: 0.33
Nodes (8): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), libraryTopics()

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.12
Nodes (42): Celebrate(), ConnectSheet(), FinishedButton(), FlashcardsPlayer(), GamePlayer(), Instructions(), LinkPlayer(), ListenGame() (+34 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "create-activity.e2e.mjs"
Cohesion: 0.16
Nodes (12): addImage(), assert(), createEach(), db, errors, fillFirstItem(), fx(), log() (+4 more)

### Community 53 - "tts/index.ts"
Cohesion: 0.07
Nodes (45): GET(), maxDuration, metadata, StudentAlphabet(), TeacherAlphabet(), azure(), CONTEXT, gateway() (+37 more)

### Community 54 - "classroom.ts"
Cohesion: 0.08
Nodes (63): POST, POST, metadata, ownClassroomStrict(), ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent() (+55 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.11
Nodes (41): PossibleAnswers(), CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow() (+33 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.14
Nodes (28): KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, PURPLE, TopicLesson(), TopicLessonProps (+20 more)

### Community 58 - "TopicPlanEditor.tsx"
Cohesion: 0.25
Nodes (4): KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 59 - "tasks/[assignmentId]/page.tsx"
Cohesion: 0.39
Nodes (5): metadata, StudentTask(), lessonEntry(), openSteps(), SequenceStep

### Community 60 - "community.e2e.mjs"
Cohesion: 0.14
Nodes (7): animalesBefore, db, errors, signedIn(), stamp, STORAGE, watch()

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.13
Nodes (22): metadata, StudentViewPage(), FavoriteButton(), EyeIcon(), KindDot(), TopicCard(), AccessItem, KindPicture() (+14 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "users/page.tsx"
Cohesion: 0.19
Nodes (14): metadata, ROLE_LABEL, ROLES, AdminActionForm(), AdminState, createSchool(), endSessions(), GRANT_MESSAGE (+6 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.10
Nodes (9): errors, NAMES, stamp, resetLinkFromLog(), sleep(), stamp, db, dir (+1 more)

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "ref_node_path"
Cohesion: 0.07
Nodes (9): errors, stamp, stamp, COLORS, db, stamp, errors, stamp (+1 more)

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.15
Nodes (16): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+8 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "DiagramBoard.tsx"
Cohesion: 0.57
Nodes (6): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys()

### Community 75 - "roster.ts"
Cohesion: 0.27
Nodes (11): capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList(), slugName() (+3 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "storage/index.ts"
Cohesion: 0.19
Nodes (12): GET, GET, copyFromCommunity(), refresh(), communityWhere, copyGameTo(), isCommunityImage(), remapJson() (+4 more)

### Community 79 - "actions/tasks.ts"
Cohesion: 0.18
Nodes (14): POST, POST, schema, StudentActivityPage(), StudentActivity(), createTopicTask(), recordActivityProgress(), TaskResult (+6 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "voices.ts"
Cohesion: 0.09
Nodes (22): loadBrowserVoices(), pending, pickBrowserVoice(), preloadAudio(), pump(), queued, ready, SayResult (+14 more)

### Community 82 - "VideoForm"
Cohesion: 0.26
Nodes (9): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage() (+1 more)

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.09
Nodes (30): FONT_SAMPLE, FontPreview(), ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS (+22 more)

### Community 84 - "resources/[id]/page.tsx"
Cohesion: 0.48
Nodes (4): DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GameEditor.tsx"
Cohesion: 0.08
Nodes (49): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaultsContext, AudioField(), audioLanguages(), AudioPanel() (+41 more)

### Community 88 - "safety.ts"
Cohesion: 0.33
Nodes (6): BLOCKED_WORDS, Likelihood, normalize(), NORMALIZED, RANK, SafeSearchAnnotation

### Community 89 - "ImageField.tsx"
Cohesion: 0.09
Nodes (25): Ctx, Dict, EN, ES, UiLang, UiLangProvider(), EditStep, ico (+17 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "DashBits.tsx"
Cohesion: 0.18
Nodes (19): CATEGORIES, ContentLibrary(), metadata, AdminRowTopic, AdminTopicRow(), OPTIONS, TopicStatusMenu(), Kind3D() (+11 more)

### Community 92 - "assignments/[id]/page.tsx"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 93 - "SpellBoard.tsx"
Cohesion: 0.16
Nodes (15): metadata, AlphabetExplorer(), Config, sleep(), SpellBoard(), submit(), FeedbackBubble(), ListenBlocked() (+7 more)

### Community 94 - "lessonData.ts"
Cohesion: 0.11
Nodes (29): AdminTopicPreview(), metadata, metadata, TopicLessonPage(), metadata, TeacherTopicPreview(), TopicPreviewProps, finishedQuestions() (+21 more)

### Community 95 - "admin/page.tsx"
Cohesion: 0.13
Nodes (20): AdminOverview(), AdminOverviewContent(), metadata, AutoSubmitSelect(), StatCard(), StatCardSkeleton(), DashLoading(), ACTION_GROUPS (+12 more)

### Community 96 - "lib/review.ts"
Cohesion: 0.22
Nodes (14): metadata, ReviewWork(), ReviewForm(), submitReview(), effective(), nameOf(), parseDetails(), ReviewAnswer (+6 more)

### Community 97 - "next"
Cohesion: 0.11
Nodes (35): next, zod, POST, POST, POST, GET, PROBES, GET (+27 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "teacher/page.tsx"
Cohesion: 0.18
Nodes (17): Dashboard(), DashboardContent(), metadata, STATUS_CLS, Progress(), Backup, UnsavedDrafts(), assignmentSummaries() (+9 more)

### Community 103 - "States.tsx"
Cohesion: 0.60
Nodes (3): Error(), Error(), DashError()

### Community 104 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 105 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 112 - "Card"
Cohesion: 0.16
Nodes (25): ActivityLog(), metadata, AdminTopics(), Schools(), Users(), UsersAndSchools(), AccountPage(), metadata (+17 more)

### Community 118 - "video-protect.e2e.mjs"
Cohesion: 0.22
Nodes (5): desktop, errors, stamp, state(), vid()

### Community 120 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `SpeakingPlayer.tsx`, `layout.ts`, `session.ts`, `Dependencias (package.json)`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `guards.ts`, `TopicHero.tsx`, `AuthLayout`, `library/types.ts`, `settings/page.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `verify.ts`, `CardPhotoForm.tsx`, `WsIcon`, `useVoiceSession.ts`, `teacher/library/page.tsx`, `autocorrect.ts`, `Players.tsx`, `plainText`, `TopicLesson.tsx`, `TopicPlanEditor.tsx`, `TopicRow.tsx`, `users/page.tsx`, `DashBits.tsx`, `DiagramBoard.tsx`, `actions/tasks.ts`, `ActivitySettings.tsx`, `GameEditor.tsx`, `ImageField.tsx`, `DashBits.tsx`, `SpellBoard.tsx`, `admin/page.tsx`, `teacher/page.tsx`, `States.tsx`, `Card`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10359408033826638 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `session.ts`, `mediaUrl`, `Dependencias (package.json)`, `auth.ts`, `react`, `MyActivitiesBoard.tsx`, `guards.ts`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `library/types.ts`, `settings/page.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `verify.ts`, `WsIcon`, `Layout raíz`, `teacher/library/page.tsx`, `tts/index.ts`, `classroom.ts`, `TopicLesson.tsx`, `TopicPlanEditor.tsx`, `tasks/[assignmentId]/page.tsx`, `TopicRow.tsx`, `users/page.tsx`, `DashBits.tsx`, `storage/index.ts`, `actions/tasks.ts`, `VideoForm`, `ActivitySettings.tsx`, `resources/[id]/page.tsx`, `GameEditor.tsx`, `DashBits.tsx`, `lessonData.ts`, `admin/page.tsx`, `lib/review.ts`, `teacher/page.tsx`, `States.tsx`, `Card`, `next.config.ts`, `middleware.ts`, `checkout/route.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07563291139240506 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `guards.ts` to `games/service.ts`, `topic-preview.e2e.mjs`, `Dependencias (package.json)`, `auth.ts`, `library.ts`, `flow.e2e.mjs`, `topic-rows.e2e.mjs`, `Scripts de package.json`, `lextro.e2e.mjs`, `create-activity.e2e.mjs`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `users/page.tsx`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `ref_node_path`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `storage/index.ts`, `actions/tasks.ts`, `assignments/[id]/page.tsx`, `admin/page.tsx`, `lib/review.ts`, `next`, `dashboards.e2e.mjs`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `games/service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07864488808227466 - nodes in this community are weakly interconnected._