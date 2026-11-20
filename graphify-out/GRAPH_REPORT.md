# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 401 files · ~236,881 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2535 nodes · 8010 edges · 117 communities (99 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16a48812`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- db.ts
- 20261025012814_init/migration.sql
- useVoiceSession.ts
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- next
- games/templates.ts
- dedupeRecipients
- mediaUrl
- commons.ts
- Dependencias (package.json)
- auth.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- guards.ts
- stt/index.ts
- Configuración TypeScript
- TopicHero.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- SpeakingPlayer.tsx
- topic-rows.e2e.mjs
- ContentEditor.tsx
- Tests e2e de flashcards
- Scripts de package.json
- library/types.ts
- Dependencias de desarrollo
- settings/page.tsx
- LetsPractice.tsx
- WsIcon
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- react
- teacher/library/page.tsx
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- AlphabetExplorer
- tts/index.ts
- classroom.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicLesson.tsx
- preview/[id]/page.tsx
- FlashcardsGame.tsx
- community.e2e.mjs
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- games.ts
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- ref_node_path
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- teacher/page.tsx
- lib/videos.ts
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- LocalTime
- "public"."Game"
- AudioField.tsx
- videos/[id]/edit/page.tsx
- ActivitySettings.tsx
- next
- ref_node_fs
- library-header.e2e.mjs
- GameEditor.tsx
- requireAdminPage
- ImageEditor.tsx
- "public"."Topic"
- voices.ts
- tts/route.ts
- gateway.ts
- TopicPlanEditor.tsx
- activity-actions.e2e.mjs
- lib/review.ts
- db.ts
- vercel.json
- Card
- topic-rows-v2.e2e.mjs
- requireTeacher
- FlashcardParts.tsx
- my-activities.e2e.mjs
- VideoPlayer.tsx
- dashboards.e2e.mjs
- DashBits.tsx
- spanish-check.ts
- admin/page.tsx
- react-dom
- 20261122000000_review_speaking_settings/migration.sql

## God Nodes (most connected - your core abstractions)
1. `next` - 151 edges
2. `db` - 116 edges
3. `HttpError` - 106 edges
4. `audit()` - 105 edges
5. `requireTeacher()` - 94 edges
6. `Button()` - 90 edges
7. `react` - 86 edges
8. `requireTeacherPage()` - 65 edges
9. `PageHeader()` - 48 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `VoiceGamePlayer()` --indirect_call--> `BoxesBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/BoxesBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `MatchBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/MatchBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `SequenceBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/SequenceBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `SpellBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/SpellBoard.tsx

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (117 total, 18 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.10
Nodes (37): BoxesBoard(), openBox(), runReview(), sleep(), State, DiagramBoard(), drop(), finishIfDone() (+29 more)

### Community 1 - "db.ts"
Cohesion: 0.09
Nodes (51): AddContent(), metadata, Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults() (+43 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (23): GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer(), PlayerFrame(), StartScreen(), Diagnostic, Input (+15 more)

### Community 4 - "games/service.ts"
Cohesion: 0.14
Nodes (22): Ctx, GET, PUT, CARDS, GET(), maxDuration, metadata, faceAudio (+14 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.09
Nodes (43): vitest, poolerSafeUrl(), scoreTurn(), env, say(), AnswerSpec, CARRIERS, cleanTyped() (+35 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.10
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "next"
Cohesion: 0.13
Nodes (27): POST, POST, schema, POST, POST, GET, POST, body (+19 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.15
Nodes (18): AdminNewGame(), metadata, metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery() (+10 more)

### Community 11 - "mediaUrl"
Cohesion: 0.10
Nodes (37): POST, POST, PUT, POST, start, POST, GET, POST (+29 more)

### Community 12 - "commons.ts"
Cohesion: 0.05
Nodes (68): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+60 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (36): devDependencies, dictionary-en@^4.0.0, dictionary-es@^4.0.0, dictionary-fr@^3.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0 (+28 more)

### Community 14 - "auth.ts"
Cohesion: 0.07
Nodes (67): POST(), escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword() (+59 more)

### Community 15 - "react"
Cohesion: 0.17
Nodes (28): GradeForm(), MetaFields(), MetaForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm(), TeacherSignUpForm() (+20 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.11
Nodes (30): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+22 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.06
Nodes (63): AdminCommunityPage(), metadata, AdminMyActivitiesPage(), metadata, CommunityPage(), metadata, metadata, MyActivitiesPage() (+55 more)

### Community 18 - "guards.ts"
Cohesion: 0.09
Nodes (35): server-only, metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata, StudentTask() (+27 more)

### Community 19 - "stt/index.ts"
Cohesion: 0.21
Nodes (11): azure(), CONTEXT, gateway(), GATEWAY_MODELS, google(), LETTER_HINTS, recognize(), scripted() (+3 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicHero.tsx"
Cohesion: 0.14
Nodes (26): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+18 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.09
Nodes (57): metadata, ROLE_LABEL, ROLES, AdminActionForm(), AdminState, createSchool(), endSessions(), GRANT_MESSAGE (+49 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 25 - "AuthLayout"
Cohesion: 0.06
Nodes (34): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LearnLayout(), LoginPage(), metadata (+26 more)

### Community 26 - "SpeakingPlayer.tsx"
Cohesion: 0.16
Nodes (13): Done, SpeakingPlayer(), Status, EngineResult, ListenOptions, ServerEngine, SpeechEngine, SR (+5 more)

### Community 27 - "topic-rows.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 28 - "ContentEditor.tsx"
Cohesion: 0.17
Nodes (18): ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools(), SheetEditor() (+10 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.10
Nodes (21): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, html-to-image@1.11.13, jspdf@4.2.1, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2 (+13 more)

### Community 31 - "library/types.ts"
Cohesion: 0.07
Nodes (60): EditResource(), ContentList(), metadata, STATUS, ManageActivities(), metadata, ICON, Kind (+52 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "settings/page.tsx"
Cohesion: 0.25
Nodes (9): metadata, Status(), metadata, SettingsForm(), LANGUAGE_LABEL, TOPIC_LANGUAGES, TopicLanguage, DEFAULT_SETTINGS (+1 more)

### Community 34 - "LetsPractice.tsx"
Cohesion: 0.25
Nodes (13): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+5 more)

### Community 35 - "WsIcon"
Cohesion: 0.18
Nodes (15): Error(), Error(), StatusPillClient(), TopicStatusBar(), DashError(), isActive(), useDismiss(), UserMenu() (+7 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.10
Nodes (24): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+16 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "react"
Cohesion: 0.29
Nodes (10): react, Config, sleep(), SpellBoard(), submit(), ALPHABET, Letter, LETTER_STYLES (+2 more)

### Community 40 - "teacher/library/page.tsx"
Cohesion: 0.33
Nodes (8): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), libraryTopics()

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.23
Nodes (26): Celebrate(), ConnectSheet(), FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer(), MatchGame() (+18 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "AlphabetExplorer"
Cohesion: 0.27
Nodes (8): POST, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), AlphabetExplorer(), sttLocale(), sttProvider()

### Community 53 - "tts/index.ts"
Cohesion: 0.18
Nodes (18): azure(), azureSsml(), escapeXml(), gateway(), gatewayPart(), google(), googlePart(), joinPcm() (+10 more)

### Community 54 - "classroom.ts"
Cohesion: 0.07
Nodes (54): AddListPage(), metadata, AddListForm(), Roster, RosterRow(), Row, PinNotice(), ResetPinButton() (+46 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.12
Nodes (22): DiagramPoints(), Point, StripRole, asLang(), guessLang(), Lang, Line, PRACTICE (+14 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.13
Nodes (25): metadata, StudentViewPage(), EyeIcon(), StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments() (+17 more)

### Community 58 - "preview/[id]/page.tsx"
Cohesion: 0.26
Nodes (9): metadata, PreviewPage(), recipientLabel(), ActivityStrip(), saveRename(), StripAssignment, renameGame(), buildPlayGame() (+1 more)

### Community 59 - "FlashcardsGame.tsx"
Cohesion: 0.20
Nodes (18): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+10 more)

### Community 60 - "community.e2e.mjs"
Cohesion: 0.14
Nodes (7): animalesBefore, db, errors, signedIn(), stamp, STORAGE, watch()

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.15
Nodes (19): FavoriteButton(), KindDot(), TopicCard(), AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep (+11 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "games.ts"
Cohesion: 0.19
Nodes (16): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, schoolGame() (+8 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.12
Nodes (6): errors, NAMES, stamp, COLORS, db, stamp

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.15
Nodes (17): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddStudentPage(), metadata (+9 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "teacher/page.tsx"
Cohesion: 0.15
Nodes (23): ClassesPage(), metadata, Dashboard(), DashboardContent(), metadata, STATUS_CLS, metadata, ProgressPage() (+15 more)

### Community 75 - "lib/videos.ts"
Cohesion: 0.17
Nodes (16): Ctx, PUT, POST, metadata, WatchPage(), metadata, MyVideos(), Report (+8 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.26
Nodes (9): db, main(), CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary(), TOPIC_DESCRIPTION (+1 more)

### Community 79 - "LocalTime"
Cohesion: 0.24
Nodes (10): metadata, ACTION_GROUPS, actionWhere(), ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf(), recentContentChanges() (+2 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AudioField.tsx"
Cohesion: 0.09
Nodes (32): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel() (+24 more)

### Community 82 - "videos/[id]/edit/page.tsx"
Cohesion: 0.26
Nodes (9): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage() (+1 more)

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.18
Nodes (17): ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section (+9 more)

### Community 84 - "next"
Cohesion: 0.15
Nodes (8): nextConfig, securityHeaders, next, DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview(), config

### Community 85 - "ref_node_fs"
Cohesion: 0.12
Nodes (8): errors, stamp, db, dir, plan, build(), strip(), words()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GameEditor.tsx"
Cohesion: 0.10
Nodes (32): AudioField(), FaceEditor(), RowControls(), FONT_SAMPLE, FontPreview(), blankItem(), Category, contentSnapshot() (+24 more)

### Community 88 - "requireAdminPage"
Cohesion: 0.21
Nodes (10): AdminLayout(), TeacherLayout(), VerifyBanner(), Workspace, WsLink, ADMIN_EXTRA, ADMIN_LINKS, TEACHER_EXTRA (+2 more)

### Community 89 - "ImageEditor.tsx"
Cohesion: 0.23
Nodes (11): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+3 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "voices.ts"
Cohesion: 0.17
Nodes (11): TtsPart, AUDIO_LANGUAGE_CODES, AUDIO_LANGUAGE_LABELS, EXTRA_AUDIO_LANGUAGES, ExtraAudioLanguage, GATEWAY_VOICES, GEMINI_VOICES, GOOGLE_VOICES (+3 more)

### Community 92 - "tts/route.ts"
Cohesion: 0.42
Nodes (8): GET, POST, schema, ensureAudio(), VoiceChoice, ttsCacheKey(), ttsProvider(), voicesFor()

### Community 93 - "gateway.ts"
Cohesion: 0.36
Nodes (8): GET(), maxDuration, GatewayError, gatewaySpeech(), GatewaySpeechRequest, gatewayTranscribe(), sniff(), token()

### Community 94 - "TopicPlanEditor.tsx"
Cohesion: 0.24
Nodes (5): KindIcon(), LABEL, PlanItem, TopicPlanEditor(), saveTopicPlan()

### Community 96 - "lib/review.ts"
Cohesion: 0.15
Nodes (24): metadata, ReviewWork(), metadata, ReviewPage(), OUTCOME, ReviewForm(), assignmentsForTeacherWhere(), decision (+16 more)

### Community 97 - "db.ts"
Cohesion: 0.09
Nodes (31): @prisma/client, zod, LT_LANG, POST, schema, metadata, PlayPage(), AccountState (+23 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "Card"
Cohesion: 0.16
Nodes (24): ActivityLog(), CATEGORIES, ContentLibrary(), metadata, AdminSettings(), metadata, NewTopic(), AdminTopics() (+16 more)

### Community 103 - "topic-rows-v2.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 104 - "requireTeacher"
Cohesion: 0.14
Nodes (22): POST, POST, POST, POST, metadata, createCategory(), deleteCategory(), names (+14 more)

### Community 105 - "FlashcardParts.tsx"
Cohesion: 0.31
Nodes (6): stopFaceAudio(), FlashcardPreview(), swapItem(), EditorItem, FaceData, Lang

### Community 106 - "my-activities.e2e.mjs"
Cohesion: 0.14
Nodes (5): stamp, resetLinkFromLog(), sleep(), stamp, playwright

### Community 107 - "VideoPlayer.tsx"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "DashBits.tsx"
Cohesion: 0.20
Nodes (16): AdminTopicPreview(), metadata, AdminRowTopic, AdminTopicRow(), OPTIONS, TopicStatusMenu(), Kind3D(), kindLabel() (+8 more)

### Community 110 - "spanish-check.ts"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 111 - "admin/page.tsx"
Cohesion: 0.23
Nodes (12): AdminOverview(), AdminOverviewContent(), metadata, AutoSubmitSelect(), StatCard(), StatCardSkeleton(), DashLoading(), AdminTopicFilter (+4 more)

### Community 112 - "react-dom"
Cohesion: 0.50
Nodes (4): react-dom@19.1.0, react-dom, DeleteAssignmentButton(), Submit()

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `useVoiceSession.ts`, `layout.ts`, `games/templates.ts`, `Dependencias (package.json)`, `react`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `guards.ts`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `SpeakingPlayer.tsx`, `ContentEditor.tsx`, `Scripts de package.json`, `library/types.ts`, `settings/page.tsx`, `LetsPractice.tsx`, `WsIcon`, `ImageField.tsx`, `teacher/library/page.tsx`, `autocorrect.ts`, `Players.tsx`, `classroom.ts`, `plainText`, `TopicLesson.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `games.ts`, `DashBits.tsx`, `teacher/page.tsx`, `lib/videos.ts`, `AudioField.tsx`, `ActivitySettings.tsx`, `GameEditor.tsx`, `requireAdminPage`, `ImageEditor.tsx`, `TopicPlanEditor.tsx`, `lib/review.ts`, `Card`, `FlashcardParts.tsx`, `VideoPlayer.tsx`, `DashBits.tsx`, `admin/page.tsx`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10465116279069768 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `next`, `mediaUrl`, `commons.ts`, `Dependencias (package.json)`, `auth.ts`, `react`, `MyActivitiesBoard.tsx`, `guards.ts`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `Scripts de package.json`, `library/types.ts`, `settings/page.tsx`, `WsIcon`, `Layout raíz`, `teacher/library/page.tsx`, `classroom.ts`, `plainText`, `TopicLesson.tsx`, `preview/[id]/page.tsx`, `TopicRow.tsx`, `games.ts`, `DashBits.tsx`, `teacher/page.tsx`, `lib/videos.ts`, `LocalTime`, `videos/[id]/edit/page.tsx`, `ActivitySettings.tsx`, `GameEditor.tsx`, `tts/route.ts`, `gateway.ts`, `TopicPlanEditor.tsx`, `lib/review.ts`, `db.ts`, `Card`, `requireTeacher`, `DashBits.tsx`, `admin/page.tsx`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `db.ts` to `games/service.ts`, `mediaUrl`, `Dependencias (package.json)`, `auth.ts`, `guards.ts`, `library.ts`, `topic-rows.e2e.mjs`, `Scripts de package.json`, `lextro.e2e.mjs`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `lib/videos.ts`, `library/seed.ts`, `LocalTime`, `ref_node_fs`, `lib/review.ts`, `topic-rows-v2.e2e.mjs`, `dashboards.e2e.mjs`, `admin/page.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `useVoiceSession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._