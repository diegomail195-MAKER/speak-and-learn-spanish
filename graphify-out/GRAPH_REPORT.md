# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 401 files · ~237,510 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2538 nodes · 8024 edges · 121 communities (104 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9945b6c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parts.tsx
- db.ts
- 20261025012814_init/migration.sql
- speaker.ts
- games/service.ts
- Evaluación de pronunciación
- layout.ts
- Micrófono y detección de voz (VAD)
- next
- games/templates.ts
- topics/[id]/page.tsx
- mediaUrl
- commons.ts
- Dependencias (package.json)
- verify.ts
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
- useVoiceSession.ts
- topic-rows.e2e.mjs
- auth.ts
- Tests e2e de flashcards
- Scripts de package.json
- Button
- Dependencias de desarrollo
- GameEditor.tsx
- webhook.ts
- WsIcon
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- PublicHeader
- [slug]/page.tsx
- Configuración PostCSS
- Drivers de almacenamiento
- Script de arranque de Graphify
- autocorrect.ts
- Players.tsx
- lextro.e2e.mjs
- lessonData.ts
- tts/index.ts
- classroom.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicLesson.tsx
- ImageField.tsx
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
- AudioPanel
- videos/[id]/edit/page.tsx
- ActivitySettings.tsx
- lib/videos.ts
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- GameEditor.tsx
- requireAdminPage
- emails/templates.ts
- "public"."Topic"
- users/page.tsx
- tts/route.ts
- teacher/games/[id]/edit/page.tsx
- Button.tsx
- playwright
- lib/review.ts
- responses/route.ts
- vercel.json
- settings/page.tsx
- topic-rows-v2.e2e.mjs
- requireTeacher
- roster.ts
- my-activities.e2e.mjs
- VideoPlayer.tsx
- dashboards.e2e.mjs
- DashBits.tsx
- build-accent-maps.mjs
- admin/page.tsx
- assignments.ts
- resources/[id]/page.tsx
- 20261122000000_review_speaking_settings/migration.sql
- DiagramBoard
- vitest
- html-to-image

## God Nodes (most connected - your core abstractions)
1. `next` - 151 edges
2. `db` - 116 edges
3. `HttpError` - 106 edges
4. `audit()` - 106 edges
5. `requireTeacher()` - 95 edges
6. `Button()` - 90 edges
7. `react` - 87 edges
8. `requireTeacherPage()` - 65 edges
9. `PageHeader()` - 48 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `VoiceGamePlayer()` --indirect_call--> `DiagramBoard()`  [INFERRED]
  src/components/player/GamePlayer.tsx → src/components/player/boards/DiagramBoard.tsx
- `TopicStatusBar()` --indirect_call--> `setTopicStatus()`  [INFERRED]
  src/components/admin/TopicStatusBar.tsx → src/lib/actions/library.ts
- `TopicStatusMenu()` --indirect_call--> `setTopicStatus()`  [INFERRED]
  src/components/admin/TopicStatusMenu.tsx → src/lib/actions/library.ts

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (121 total, 17 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.12
Nodes (40): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+32 more)

### Community 1 - "db.ts"
Cohesion: 0.09
Nodes (46): AddContent(), metadata, ContentList(), metadata, STATUS, metadata, NewAssignment(), AssignmentsPage() (+38 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "speaker.ts"
Cohesion: 0.22
Nodes (8): loadBrowserVoices(), pending, pickBrowserVoice(), queued, ready, SayResult, Speaker, BROWSER_LOCALES

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (25): CARDS, GET(), maxDuration, Kinds, last, PhraseKind, PHRASES, phrasesFor() (+17 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (41): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+33 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "next"
Cohesion: 0.15
Nodes (26): POST, POST, POST, GET, PROBES, GET, POST, body (+18 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.15
Nodes (16): AdminNewGame(), metadata, CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, AUTOPLAY_OPTION (+8 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.09
Nodes (38): ManageActivities(), metadata, metadata, StudentViewPage(), metadata, stepTitle(), TaskPage(), GameLibraryPanel() (+30 more)

### Community 11 - "mediaUrl"
Cohesion: 0.08
Nodes (40): POST, PUT, POST, start, GET, POST, done, POST (+32 more)

### Community 12 - "commons.ts"
Cohesion: 0.06
Nodes (59): API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS(), fileUrl(), HEADERS (+51 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "verify.ts"
Cohesion: 0.23
Nodes (18): signInTeacher(), signUpTeacher(), acceptAdminInvite(), acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken() (+10 more)

### Community 15 - "react"
Cohesion: 0.12
Nodes (41): react, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm() (+33 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.11
Nodes (30): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+22 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.06
Nodes (63): AdminCommunityPage(), metadata, AdminMyActivitiesPage(), metadata, CommunityPage(), metadata, metadata, MyActivitiesPage() (+55 more)

### Community 18 - "guards.ts"
Cohesion: 0.11
Nodes (25): @prisma/client, server-only, zod, metadata, Home(), metadata, AccountState, createCategory() (+17 more)

### Community 19 - "stt/index.ts"
Cohesion: 0.10
Nodes (26): GET(), maxDuration, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), AlphabetExplorer(), azure() (+18 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicHero.tsx"
Cohesion: 0.14
Nodes (25): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+17 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.16
Nodes (40): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+32 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 25 - "AuthLayout"
Cohesion: 0.12
Nodes (19): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+11 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.11
Nodes (24): Config, Diagnostic, Feedback, Input, Phase, SessionOptions, TurnResult, TYPED_HELP (+16 more)

### Community 27 - "topic-rows.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 28 - "auth.ts"
Cohesion: 0.15
Nodes (18): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, resetSchema, sendResetLink(), signupSchema (+10 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.11
Nodes (18): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0 (+10 more)

### Community 31 - "Button"
Cohesion: 0.08
Nodes (46): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+38 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditor.tsx"
Cohesion: 0.15
Nodes (13): DiagramPoints(), Point, FONT_SAMPLE, FontPreview(), blankItem(), editorState(), GameEditorInner(), assign() (+5 more)

### Community 34 - "webhook.ts"
Cohesion: 0.22
Nodes (12): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+4 more)

### Community 35 - "WsIcon"
Cohesion: 0.15
Nodes (17): Error(), Error(), StatusPillClient(), TopicStatusBar(), OPTIONS, TopicStatusMenu(), DashError(), isActive() (+9 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.11
Nodes (23): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+15 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "PublicHeader"
Cohesion: 0.11
Nodes (19): LearnLayout(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), S (+11 more)

### Community 40 - "[slug]/page.tsx"
Cohesion: 0.11
Nodes (20): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), GRADE_FILTERS, GradeFilter (+12 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.10
Nodes (29): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+21 more)

### Community 50 - "Players.tsx"
Cohesion: 0.17
Nodes (32): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+24 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.25
Nodes (13): AdminTopicPreview(), metadata, TopicLessonProps, gameFor(), LessonStep, nextAssignmentHref(), previewLesson(), studentLesson() (+5 more)

### Community 53 - "tts/index.ts"
Cohesion: 0.11
Nodes (28): azure(), azureSsml(), escapeXml(), gateway(), gatewayPart(), google(), googlePart(), joinPcm() (+20 more)

### Community 54 - "classroom.ts"
Cohesion: 0.09
Nodes (37): ownClassroomStrict(), ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), createAssignment(), checkMembers(), ClassAdminState (+29 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.14
Nodes (27): PossibleAnswers(), Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf() (+19 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.16
Nodes (20): metadata, StudentTask(), StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase (+12 more)

### Community 58 - "ImageField.tsx"
Cohesion: 0.15
Nodes (19): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+11 more)

### Community 59 - "FlashcardsGame.tsx"
Cohesion: 0.15
Nodes (23): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), FlashcardsGameProps, IconArrow() (+15 more)

### Community 60 - "community.e2e.mjs"
Cohesion: 0.14
Nodes (7): animalesBefore, db, errors, signedIn(), stamp, STORAGE, watch()

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.28
Nodes (12): AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep, RowTopic, StudentTopicRow(), Thumb() (+4 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "games.ts"
Cohesion: 0.16
Nodes (21): GamesPage(), metadata, ActivitySettings(), flush(), update(), ActivityFilters(), ActivityList(), ActivitySearch (+13 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.13
Nodes (6): errors, NAMES, stamp, resetLinkFromLog(), sleep(), stamp

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "ref_node_path"
Cohesion: 0.13
Nodes (5): db, dir, plan, errors, stamp

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.15
Nodes (17): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), EditGroupPage(), metadata (+9 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "teacher/page.tsx"
Cohesion: 0.15
Nodes (24): ClassesPage(), metadata, Dashboard(), DashboardContent(), metadata, STATUS_CLS, metadata, ProgressPage() (+16 more)

### Community 75 - "lib/videos.ts"
Cohesion: 0.19
Nodes (14): POST, POST, schema, Ctx, PUT, POST, requireVideoAdmin(), isWebVtt() (+6 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.23
Nodes (10): db, main(), TEMPLATES, CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary() (+2 more)

### Community 79 - "LocalTime"
Cohesion: 0.20
Nodes (14): ActivityLog(), metadata, dayDiff(), formatLocal(), LocalTime(), ACTION_GROUPS, actionWhere(), ActivityEntry (+6 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AudioPanel"
Cohesion: 0.18
Nodes (14): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+6 more)

### Community 82 - "videos/[id]/edit/page.tsx"
Cohesion: 0.42
Nodes (6): EditVideo(), metadata, metadata, NewVideo(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.13
Nodes (18): metadata, PreviewPage(), recipientLabel(), AnswerRow(), save(), LOOK_KEYS, Section, SettingsData (+10 more)

### Community 84 - "lib/videos.ts"
Cohesion: 0.09
Nodes (22): nextConfig, securityHeaders, next, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata (+14 more)

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GameEditor.tsx"
Cohesion: 0.10
Nodes (31): TtsConfig, AudioDefaults, AudioDefaultsContext, AudioField(), MAIN, playFaceAudio(), RATE_STEPS, SAMPLE (+23 more)

### Community 88 - "requireAdminPage"
Cohesion: 0.19
Nodes (12): AdminLayout(), TeacherLayout(), VerifyBanner(), Workspace, WsLink, ADMIN_EXTRA, ADMIN_LINKS, TEACHER_EXTRA (+4 more)

### Community 89 - "emails/templates.ts"
Cohesion: 0.47
Nodes (9): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, verifyEmail() (+1 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "users/page.tsx"
Cohesion: 0.17
Nodes (17): metadata, ROLE_LABEL, ROLES, Schools(), Users(), UsersAndSchools(), AdminActionForm(), AdminState (+9 more)

### Community 92 - "tts/route.ts"
Cohesion: 0.38
Nodes (9): GET, POST, schema, speechSegments(), ensureAudio(), VoiceChoice, ttsCacheKey(), ttsProvider() (+1 more)

### Community 93 - "teacher/games/[id]/edit/page.tsx"
Cohesion: 0.27
Nodes (7): Ctx, GET, PUT, EditGame(), metadata, loadEditorGame(), readItemData()

### Community 94 - "Button.tsx"
Cohesion: 0.29
Nodes (8): AddStudentsMenu(), CommunityActions(), CopyButton(), buttonClass(), Size, sizes, Variant, variants

### Community 95 - "playwright"
Cohesion: 0.14
Nodes (6): errors, stamp, COLORS, db, stamp, playwright

### Community 96 - "lib/review.ts"
Cohesion: 0.17
Nodes (23): metadata, ReviewWork(), metadata, ReviewPage(), OUTCOME, ReviewForm(), assignmentsForTeacherWhere(), classroomAccessWhere() (+15 more)

### Community 97 - "responses/route.ts"
Cohesion: 0.14
Nodes (20): POST, POST, schema, metadata, PlayPage(), isVoice(), questionResult(), questionStatus() (+12 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "settings/page.tsx"
Cohesion: 0.13
Nodes (24): AdminSettings(), metadata, Status(), metadata, NewTopic(), AdminTopics(), metadata, AccountPage() (+16 more)

### Community 103 - "topic-rows-v2.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 104 - "requireTeacher"
Cohesion: 0.16
Nodes (20): POST, POST, POST, LT_LANG, POST, schema, POST, addToCollection() (+12 more)

### Community 105 - "roster.ts"
Cohesion: 0.23
Nodes (15): AddListForm(), Roster, addStudentList(), ListResult, capitalize(), CheckedRow, checkRows(), friendlyPassword() (+7 more)

### Community 107 - "VideoPlayer.tsx"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "DashBits.tsx"
Cohesion: 0.24
Nodes (15): CATEGORIES, ContentLibrary(), metadata, AdminRowTopic, AdminTopicRow(), Kind3D(), kindLabel(), orderedKinds() (+7 more)

### Community 110 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 111 - "admin/page.tsx"
Cohesion: 0.24
Nodes (11): AdminOverview(), AdminOverviewContent(), metadata, AutoSubmitSelect(), StatCardSkeleton(), DashLoading(), AdminTopicFilter, adminTopics() (+3 more)

### Community 112 - "assignments.ts"
Cohesion: 0.32
Nodes (6): DeleteAssignmentButton(), Submit(), AssignState, deleteAssignment(), schema, setAssignmentActive()

### Community 113 - "resources/[id]/page.tsx"
Cohesion: 0.48
Nodes (4): DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview()

### Community 118 - "DiagramBoard"
Cohesion: 0.80
Nodes (5): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep()

### Community 121 - "vitest"
Cohesion: 0.40
Nodes (3): vitest, poolerSafeUrl(), env

### Community 123 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `layout.ts`, `games/templates.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `guards.ts`, `TopicHero.tsx`, `AuthLayout`, `useVoiceSession.ts`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `WsIcon`, `ImageField.tsx`, `PublicHeader`, `[slug]/page.tsx`, `autocorrect.ts`, `Players.tsx`, `plainText`, `TopicLesson.tsx`, `ImageField.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `games.ts`, `teacher/page.tsx`, `LocalTime`, `ActivitySettings.tsx`, `lib/videos.ts`, `GameEditor.tsx`, `requireAdminPage`, `users/page.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `roster.ts`, `VideoPlayer.tsx`, `DashBits.tsx`, `admin/page.tsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11529411764705882 - nodes in this community are weakly interconnected._
- **Why does `next` connect `lib/videos.ts` to `db.ts`, `games/service.ts`, `next`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `verify.ts`, `react`, `MyActivitiesBoard.tsx`, `guards.ts`, `stt/index.ts`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `auth.ts`, `Scripts de package.json`, `Button`, `webhook.ts`, `WsIcon`, `Layout raíz`, `PublicHeader`, `[slug]/page.tsx`, `lessonData.ts`, `classroom.ts`, `TopicLesson.tsx`, `TopicRow.tsx`, `games.ts`, `DashBits.tsx`, `teacher/page.tsx`, `lib/videos.ts`, `LocalTime`, `videos/[id]/edit/page.tsx`, `ActivitySettings.tsx`, `GameEditor.tsx`, `users/page.tsx`, `tts/route.ts`, `teacher/games/[id]/edit/page.tsx`, `Button.tsx`, `lib/review.ts`, `responses/route.ts`, `settings/page.tsx`, `requireTeacher`, `roster.ts`, `DashBits.tsx`, `admin/page.tsx`, `assignments.ts`, `resources/[id]/page.tsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09216589861751152 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `guards.ts` to `games/service.ts`, `mediaUrl`, `Dependencias (package.json)`, `library.ts`, `topic-rows.e2e.mjs`, `auth.ts`, `Scripts de package.json`, `webhook.ts`, `lextro.e2e.mjs`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `ref_node_path`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `lib/videos.ts`, `library/seed.ts`, `LocalTime`, `users/page.tsx`, `playwright`, `lib/review.ts`, `responses/route.ts`, `topic-rows-v2.e2e.mjs`, `dashboards.e2e.mjs`, `admin/page.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `games/service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._