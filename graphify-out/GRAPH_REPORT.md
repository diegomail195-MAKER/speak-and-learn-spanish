# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 389 files · ~231,859 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2444 nodes · 7573 edges · 115 communities (93 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c38a9f7d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- db.ts
- 20261025012814_init/migration.sql
- AudioField.tsx
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- next
- games/templates.ts
- topics/[id]/page.tsx
- mediaUrl
- search.ts
- Dependencias (package.json)
- db.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- lib/videos.ts
- tts/index.ts
- Configuración TypeScript
- AlphabetExplorer
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- PublicHeader
- useVoiceSession.ts
- ref_node_path
- preview/[id]/page.tsx
- Tests e2e de flashcards
- Scripts de package.json
- Button
- Dependencias de desarrollo
- GameEditor.tsx
- voices.ts
- WsIcon
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- session.ts
- [slug]/page.tsx
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- lessonData.ts
- GamePlayer.tsx
- stt/index.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- gateway.ts
- ImageField.tsx
- HttpError
- FlashcardsGame.tsx
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- classroom.ts
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- teacher/page.tsx
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- SpellBoard.tsx
- "public"."Game"
- teacher.ts
- videos/[id]/edit/page.tsx
- ActivitySettings.tsx
- progress/route.ts
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- i18n.tsx
- admin/page.tsx
- ref_node_fs
- "public"."Topic"
- users/page.tsx
- rateLimit
- DeleteAssignmentButton.tsx
- Button.tsx
- dashboards.e2e.mjs
- lib/review.ts
- actions/review.ts
- vercel.json
- settings/page.tsx
- next.config.ts
- dedupeRecipients
- roster.ts
- middleware.ts
- dashboards.e2e.mjs
- DashBits.tsx
- activity.ts
- library/service.ts
- 20261122000000_review_speaking_settings/migration.sql

## God Nodes (most connected - your core abstractions)
1. `next` - 140 edges
2. `db` - 110 edges
3. `HttpError` - 103 edges
4. `audit()` - 97 edges
5. `Button()` - 90 edges
6. `requireTeacher()` - 87 edges
7. `react` - 79 edges
8. `requireTeacherPage()` - 61 edges
9. `PageHeader()` - 52 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `VoiceGamePlayer()` --indirect_call--> `BoxesBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/BoxesBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `SequenceBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/SequenceBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `WheelBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/WheelBoard.tsx
- `VoiceGamePlayer()` --indirect_call--> `DiagramBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/DiagramBoard.tsx

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (115 total, 22 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.12
Nodes (30): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+22 more)

### Community 1 - "db.ts"
Cohesion: 0.10
Nodes (46): AddContent(), metadata, ContentList(), AdminGrades(), metadata, metadata, NewAssignment(), AssignmentsPage() (+38 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "AudioField.tsx"
Cohesion: 0.09
Nodes (32): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel() (+24 more)

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (28): Ctx, GET, PUT, CARDS, GET(), maxDuration, EditGame(), metadata (+20 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.06
Nodes (62): vitest, Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), metadata (+54 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "next"
Cohesion: 0.16
Nodes (16): next, zod, schema, GET, body, start, LT_LANG, schema (+8 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.22
Nodes (8): AUTOPLAY_OPTION, Board, DEFAULT_MAX_ITEMS, FONT_OPTION, OptionDef, TemplateDef, TemplateFilter, TemplateKey

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.10
Nodes (38): metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata, metadata, StudentViewPage() (+30 more)

### Community 11 - "mediaUrl"
Cohesion: 0.13
Nodes (29): POST, POST, POST, GET, POST, POST, done, POST (+21 more)

### Community 12 - "search.ts"
Cohesion: 0.06
Nodes (58): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), FILE_HOSTS(), fileUrl() (+50 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "db.ts"
Cohesion: 0.05
Nodes (81): stripe@^17.7.0, @prisma/client, stripe, POST, POST, POST(), dynamic, metadata (+73 more)

### Community 15 - "react"
Cohesion: 0.12
Nodes (40): react, metadata, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm() (+32 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.09
Nodes (36): POST, LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept() (+28 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.07
Nodes (61): metadata, NewGame(), metadata, MyActivitiesPage(), Search, CreateButton(), FEATURED, Oral() (+53 more)

### Community 18 - "lib/videos.ts"
Cohesion: 0.16
Nodes (18): Ctx, PUT, POST, fmt(), metadata, Report, addToCollection(), deleteVideo() (+10 more)

### Community 19 - "tts/index.ts"
Cohesion: 0.18
Nodes (18): azure(), azureSsml(), escapeXml(), gateway(), gatewayPart(), google(), googlePart(), joinPcm() (+10 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "AlphabetExplorer"
Cohesion: 0.26
Nodes (8): metadata, StudentAlphabet(), metadata, TeacherAlphabet(), AlphabetExplorer(), sttLocale(), sttProvider(), gatewayAvailable()

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.09
Nodes (50): AdminState, createSchool(), endSessions(), GRANT_MESSAGE, inviteAdmin(), mergeSchool(), moveUser(), renameSchool() (+42 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "PublicHeader"
Cohesion: 0.07
Nodes (31): AdminInvitePage(), dynamic, metadata, AdminLayout(), ForgotPasswordPage(), metadata, LearnLayout(), LoginPage() (+23 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (19): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+11 more)

### Community 27 - "ref_node_path"
Cohesion: 0.12
Nodes (6): COLORS, db, stamp, db, errors, stamp

### Community 28 - "preview/[id]/page.tsx"
Cohesion: 0.24
Nodes (9): metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole (+1 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.10
Nodes (21): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, html-to-image@1.11.13, jspdf@4.2.1, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2 (+13 more)

### Community 31 - "Button"
Cohesion: 0.08
Nodes (46): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+38 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditor.tsx"
Cohesion: 0.10
Nodes (31): AudioField(), stopFaceAudio(), DiagramPoints(), Point, FaceEditor(), FlashcardPreview(), RowControls(), swapItem() (+23 more)

### Community 34 - "voices.ts"
Cohesion: 0.17
Nodes (11): TtsPart, AUDIO_LANGUAGE_CODES, AUDIO_LANGUAGE_LABELS, EXTRA_AUDIO_LANGUAGES, ExtraAudioLanguage, GATEWAY_VOICES, GEMINI_VOICES, GOOGLE_VOICES (+3 more)

### Community 35 - "WsIcon"
Cohesion: 0.20
Nodes (15): isActive(), useDismiss(), UserMenu(), Workspace, WorkspaceFrame(), WORKSPACES, WorkspaceSwitcher(), WsLink (+7 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.11
Nodes (23): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+15 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "session.ts"
Cohesion: 0.39
Nodes (5): Home(), destroySession(), getSessionUser, hashToken(), SessionUser

### Community 40 - "[slug]/page.tsx"
Cohesion: 0.13
Nodes (17): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), GRADE_FILTERS, GradeFilter (+9 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.13
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.05
Nodes (80): TopicPage(), Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame() (+72 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.09
Nodes (36): POST, metadata, MyActivities(), metadata, MyProgress(), metadata, StudentTask(), metadata (+28 more)

### Community 53 - "GamePlayer.tsx"
Cohesion: 0.27
Nodes (10): GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer(), DiagnosticsPanel(), PlayerFrame(), StartScreen(), SubmitTurn (+2 more)

### Community 54 - "stt/index.ts"
Cohesion: 0.23
Nodes (10): azure(), CONTEXT, gateway(), GATEWAY_MODELS, google(), LETTER_HINTS, recognize(), scripted() (+2 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.17
Nodes (22): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+14 more)

### Community 57 - "gateway.ts"
Cohesion: 0.36
Nodes (8): GET(), maxDuration, GatewayError, gatewaySpeech(), GatewaySpeechRequest, gatewayTranscribe(), sniff(), token()

### Community 58 - "ImageField.tsx"
Cohesion: 0.14
Nodes (20): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+12 more)

### Community 59 - "HttpError"
Cohesion: 0.15
Nodes (19): POST, POST, PUT, GET, POST, GET, GET, POST (+11 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.20
Nodes (19): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+11 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.19
Nodes (15): FavoriteButton(), AccessItem, KindPicture(), TopicAccess(), LABEL, PlanItem, groupSteps(), RowStep (+7 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "classroom.ts"
Cohesion: 0.09
Nodes (48): POST, POST, ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), AssignState, createAssignment() (+40 more)

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

### Community 71 - "DashBits.tsx"
Cohesion: 0.21
Nodes (11): EditGroupPage(), metadata, metadata, NewGroupPage(), AddListPage(), metadata, AddStudentPage(), metadata (+3 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "teacher/page.tsx"
Cohesion: 0.15
Nodes (16): AdminOverview(), AdminOverviewContent(), metadata, metadata, Dashboard(), DashboardContent(), metadata, STATUS_CLS (+8 more)

### Community 75 - "DiagramBoard.tsx"
Cohesion: 0.26
Nodes (11): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), CharKeys(), PracticeCard, EditorQuestion (+3 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.23
Nodes (10): db, main(), TEMPLATES, CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary() (+2 more)

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.32
Nodes (9): Config, sleep(), SpellBoard(), submit(), ALPHABET, Letter, LETTER_STYLES, letterName() (+1 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "teacher.ts"
Cohesion: 0.27
Nodes (8): assignmentSummaries(), AssignmentSummary, groupName(), openAssignmentWhere(), recipientInclude, RecipientRow, recipientsOf(), startOfToday()

### Community 82 - "videos/[id]/edit/page.tsx"
Cohesion: 0.42
Nodes (6): EditVideo(), metadata, metadata, NewVideo(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.13
Nodes (26): ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section (+18 more)

### Community 84 - "progress/route.ts"
Cohesion: 0.27
Nodes (9): POST, POST, POST, POST, schema, finalizeAttempt(), requireStudent(), completedFrom() (+1 more)

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "i18n.tsx"
Cohesion: 0.29
Nodes (6): Ctx, Dict, EN, ES, UiLang, UiLangProvider()

### Community 89 - "ref_node_fs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "users/page.tsx"
Cohesion: 0.17
Nodes (11): CATEGORIES, ContentLibrary(), metadata, NewTopic(), metadata, ROLE_LABEL, ROLES, Schools() (+3 more)

### Community 92 - "rateLimit"
Cohesion: 0.38
Nodes (9): GET, POST, schema, speechSegments(), ensureAudio(), VoiceChoice, ttsCacheKey(), ttsProvider() (+1 more)

### Community 94 - "Button.tsx"
Cohesion: 0.32
Nodes (6): AddStudentsMenu(), buttonClass(), Size, sizes, Variant, variants

### Community 96 - "lib/review.ts"
Cohesion: 0.16
Nodes (18): metadata, ReviewWork(), metadata, ReviewPage(), OUTCOME, ReviewForm(), attemptWhere(), effective() (+10 more)

### Community 97 - "actions/review.ts"
Cohesion: 0.53
Nodes (5): decision, ReviewState, submitReview(), parseDetails(), reviewDetail()

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "settings/page.tsx"
Cohesion: 0.16
Nodes (11): AdminSettings(), metadata, Status(), AccountPage(), metadata, ROLE, SettingsForm(), updateSettings() (+3 more)

### Community 105 - "roster.ts"
Cohesion: 0.21
Nodes (15): addStudentList(), newSecret(), rand(), capitalize(), CheckedRow, checkRows(), fourDigitPin(), friendlyPassword() (+7 more)

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "DashBits.tsx"
Cohesion: 0.22
Nodes (12): AdminRowTopic, AdminTopicRow(), Kind3D(), kindLabel(), orderedKinds(), StatusPill(), TopicThumb(), LibraryPick() (+4 more)

### Community 111 - "activity.ts"
Cohesion: 0.24
Nodes (8): ACTION_GROUPS, ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf(), recentContentChanges(), Row, VERB

### Community 113 - "library/service.ts"
Cohesion: 0.17
Nodes (12): server-only, DraftPreview(), StudentActivityPage(), ResourcePreview(), BackLink(), StudentActivity(), recordActivityProgress(), openSteps() (+4 more)

## Knowledge Gaps
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `AudioField.tsx`, `layout.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `db.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `lib/videos.ts`, `PublicHeader`, `useVoiceSession.ts`, `preview/[id]/page.tsx`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `WsIcon`, `ImageField.tsx`, `session.ts`, `[slug]/page.tsx`, `autocorrect.ts`, `Players.tsx`, `GamePlayer.tsx`, `plainText`, `ImageField.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `DashBits.tsx`, `teacher/page.tsx`, `DiagramBoard.tsx`, `SpellBoard.tsx`, `ActivitySettings.tsx`, `i18n.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `DashBits.tsx`, `library/service.ts`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `Evaluación de pronunciación`, `topics/[id]/page.tsx`, `mediaUrl`, `search.ts`, `Dependencias (package.json)`, `db.ts`, `react`, `MyActivitiesBoard.tsx`, `lib/videos.ts`, `library.ts`, `PublicHeader`, `preview/[id]/page.tsx`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `WsIcon`, `Layout raíz`, `session.ts`, `[slug]/page.tsx`, `Players.tsx`, `lessonData.ts`, `gateway.ts`, `HttpError`, `TopicRow.tsx`, `classroom.ts`, `DashBits.tsx`, `teacher/page.tsx`, `videos/[id]/edit/page.tsx`, `ActivitySettings.tsx`, `progress/route.ts`, `users/page.tsx`, `rateLimit`, `Button.tsx`, `lib/review.ts`, `actions/review.ts`, `settings/page.tsx`, `next.config.ts`, `middleware.ts`, `DashBits.tsx`, `library/service.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09887005649717515 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `db.ts` to `games/service.ts`, `Evaluación de pronunciación`, `next`, `mediaUrl`, `Dependencias (package.json)`, `lib/videos.ts`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `lextro.e2e.mjs`, `lessonData.ts`, `photo-form.e2e.mjs`, `classroom.ts`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`, `users/page.tsx`, `lib/review.ts`, `actions/review.ts`, `dashboards.e2e.mjs`, `activity.ts`, `library/service.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `AudioField.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0858974358974359 - nodes in this community are weakly interconnected._