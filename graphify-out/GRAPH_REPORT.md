# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 399 files · ~237,053 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2533 nodes · 8010 edges · 124 communities (105 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b260e3a9`
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
- verify.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- db.ts
- tts/index.ts
- Configuración TypeScript
- TopicHero.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- useVoiceSession.ts
- ref_node_path
- auth.ts
- Tests e2e de flashcards
- Scripts de package.json
- Button
- Dependencias de desarrollo
- GameEditor.tsx
- webhook.ts
- WsIcon
- Configuración ESLint
- FlashcardParts.tsx
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
- commons.ts
- classroom.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicLesson.tsx
- ImageField.tsx
- google.ts
- community.e2e.mjs
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- requireTeacher
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
- CommunityView.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- MyActivitiesView.tsx
- "public"."Game"
- AudioPanel
- videos/[id]/edit/page.tsx
- ActivitySettings.tsx
- lib/videos.ts
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- i18n.tsx
- TemplatePreview.tsx
- emails/templates.ts
- "public"."Topic"
- users/page.tsx
- createStudent
- RosterRow.tsx
- Button.tsx
- dashboards.e2e.mjs
- lib/review.ts
- reports.ts
- vercel.json
- settings/page.tsx
- next.config.ts
- appUrl
- roster.ts
- middleware.ts
- VideoPlayer.tsx
- dashboards.e2e.mjs
- DashBits.tsx
- learn/layout.tsx
- admin/page.tsx
- actions/tasks.ts
- resources/[id]/page.tsx
- 20261122000000_review_speaking_settings/migration.sql
- Art
- spanish-check.ts
- safety.ts
- vitest
- States.tsx
- html-to-image

## God Nodes (most connected - your core abstractions)
1. `next` - 151 edges
2. `db` - 116 edges
3. `audit()` - 106 edges
4. `HttpError` - 106 edges
5. `requireTeacher()` - 95 edges
6. `Button()` - 90 edges
7. `react` - 87 edges
8. `requireTeacherPage()` - 65 edges
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
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (124 total, 19 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.08
Nodes (54): BoxesBoard(), openBox(), runReview(), sleep(), State, DiagramBoard(), drop(), finishIfDone() (+46 more)

### Community 1 - "db.ts"
Cohesion: 0.08
Nodes (57): AddContent(), metadata, Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults() (+49 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "AudioField.tsx"
Cohesion: 0.09
Nodes (28): TtsConfig, AudioDefaults, AudioDefaultsContext, MAIN, RATE_STEPS, SAMPLE, SHORT(), loadBrowserVoices() (+20 more)

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (34): POST, POST, Ctx, GET, PUT, CARDS, GET(), maxDuration (+26 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.11
Nodes (39): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+31 more)

### Community 6 - "layout.ts"
Cohesion: 0.05
Nodes (77): SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole, DownloadIcon(), GearIcon(), icon (+69 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "next"
Cohesion: 0.13
Nodes (26): next, zod, POST, schema, POST, POST, POST, body (+18 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.14
Nodes (17): metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, PREVIEW_BG (+9 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.13
Nodes (30): ContentList(), metadata, STATUS, ManageActivities(), metadata, GameLibraryPanel(), AddResult, LibraryPicker() (+22 more)

### Community 11 - "mediaUrl"
Cohesion: 0.11
Nodes (35): POST, PUT, POST, GET, POST, POST, done, POST (+27 more)

### Community 12 - "search.ts"
Cohesion: 0.15
Nodes (20): GET, hasBlockedWords(), isSafeAnnotation(), download(), fetchSafeImage(), ImageResult, imageSearchEnabled(), ImageSize (+12 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (36): devDependencies, dictionary-en@^4.0.0, dictionary-es@^4.0.0, dictionary-fr@^3.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0 (+28 more)

### Community 14 - "verify.ts"
Cohesion: 0.18
Nodes (22): VerifyBanner(), resetPassword(), signInTeacher(), signUpTeacher(), acceptAdminInvite(), acceptSchema, confirmEmail(), resendVerification() (+14 more)

### Community 15 - "react"
Cohesion: 0.15
Nodes (32): react, GradeForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm(), TeacherSignUpForm(), S (+24 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (28): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+20 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.14
Nodes (33): boardHref(), Drag, FolderDialog(), FolderGlyph(), FolderShape(), Menu(), MenuItem(), MenuLink() (+25 more)

### Community 18 - "db.ts"
Cohesion: 0.11
Nodes (23): @prisma/client, AdminLayout(), Ctx, PUT, POST, TeacherLayout(), metadata, WorkspaceShell() (+15 more)

### Community 19 - "tts/index.ts"
Cohesion: 0.06
Nodes (56): POST, GET(), maxDuration, GET, POST, schema, metadata, StudentAlphabet() (+48 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicHero.tsx"
Cohesion: 0.15
Nodes (23): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+15 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.08
Nodes (61): POST, AdminState, createSchool(), endSessions(), GRANT_MESSAGE, inviteAdmin(), mergeSchool(), moveUser() (+53 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthLayout"
Cohesion: 0.12
Nodes (19): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+11 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.10
Nodes (28): Config, Coach, CoachLine, Diagnostic, Input, SessionOptions, TurnResult, TYPED_HELP (+20 more)

### Community 27 - "ref_node_path"
Cohesion: 0.10
Nodes (10): COLORS, db, stamp, resetLinkFromLog(), sleep(), stamp, db, errors (+2 more)

### Community 28 - "auth.ts"
Cohesion: 0.15
Nodes (20): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetSchema, sendResetLink() (+12 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.12
Nodes (16): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0 (+8 more)

### Community 31 - "Button"
Cohesion: 0.08
Nodes (48): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+40 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditor.tsx"
Cohesion: 0.13
Nodes (20): DiagramPoints(), Point, blankItem(), Category, contentSnapshot(), editorState(), GameEditor(), GameEditorInner() (+12 more)

### Community 34 - "webhook.ts"
Cohesion: 0.18
Nodes (15): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+7 more)

### Community 35 - "WsIcon"
Cohesion: 0.21
Nodes (13): isActive(), useDismiss(), UserMenu(), Workspace, WorkspaceFrame(), WORKSPACES, WorkspaceSwitcher(), WsLink (+5 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "FlashcardParts.tsx"
Cohesion: 0.12
Nodes (27): AudioField(), playFaceAudio(), stopFaceAudio(), upload(), FaceEditor(), onPaste(), FlashcardPreview(), RowControls() (+19 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "PublicHeader"
Cohesion: 0.19
Nodes (9): Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), PublicHeader() (+1 more)

### Community 40 - "[slug]/page.tsx"
Cohesion: 0.07
Nodes (29): server-only, BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), metadata (+21 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.18
Nodes (31): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+23 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.11
Nodes (26): AdminTopicPreview(), metadata, metadata, StudentTask(), ActivityMaterials(), metadata, metadata, PlayPage() (+18 more)

### Community 53 - "commons.ts"
Cohesion: 0.17
Nodes (19): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+11 more)

### Community 54 - "classroom.ts"
Cohesion: 0.12
Nodes (20): ownClassroomStrict(), checkMembers(), ClassAdminState, createClassroom(), createGroupWithMembers(), defaultLevel(), GroupResult, groupSchema (+12 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.11
Nodes (40): PossibleAnswers(), CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow() (+32 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.20
Nodes (17): KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), TopicLessonProps, useLessonVoice() (+9 more)

### Community 58 - "ImageField.tsx"
Cohesion: 0.18
Nodes (16): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), SearchPanel(), SIDE (+8 more)

### Community 59 - "google.ts"
Cohesion: 0.20
Nodes (16): b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress(), Provider (+8 more)

### Community 60 - "community.e2e.mjs"
Cohesion: 0.14
Nodes (7): animalesBefore, db, errors, signedIn(), stamp, STORAGE, watch()

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.22
Nodes (13): FavoriteButton(), AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep, RowTopic, StudentTopicRow() (+5 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "requireTeacher"
Cohesion: 0.12
Nodes (29): POST, POST, ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), schoolGame(), AssignState (+21 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.16
Nodes (6): errors, NAMES, stamp, build(), strip(), words()

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "ref_node_path"
Cohesion: 0.11
Nodes (3): stamp, errors, stamp

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.21
Nodes (10): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+2 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "teacher/page.tsx"
Cohesion: 0.13
Nodes (24): ClassesPage(), metadata, Dashboard(), DashboardContent(), metadata, STATUS_CLS, metadata, ProgressPage() (+16 more)

### Community 75 - "CommunityView.tsx"
Cohesion: 0.26
Nodes (10): AdminCommunityPage(), metadata, CommunityPage(), metadata, CommunityActions(), CopyButton(), CommunitySearch, CommunityView() (+2 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.23
Nodes (10): db, main(), TEMPLATES, CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary() (+2 more)

### Community 79 - "MyActivitiesView.tsx"
Cohesion: 0.23
Nodes (10): AdminMyActivitiesPage(), metadata, metadata, MyActivitiesPage(), BoardActivity, BoardFolder, BoardSort, MyActivitiesBase (+2 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AudioPanel"
Cohesion: 0.21
Nodes (12): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+4 more)

### Community 82 - "videos/[id]/edit/page.tsx"
Cohesion: 0.29
Nodes (8): EditVideo(), metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.15
Nodes (17): FONT_SAMPLE, FontPreview(), ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS (+9 more)

### Community 84 - "lib/videos.ts"
Cohesion: 0.14
Nodes (21): POST, schema, metadata, MyActivities(), metadata, MyProgress(), metadata, WatchPage() (+13 more)

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "i18n.tsx"
Cohesion: 0.14
Nodes (16): Ctx, Dict, EN, ES, UiLang, EditStep, ico, Icons (+8 more)

### Community 88 - "TemplatePreview.tsx"
Cohesion: 0.36
Nodes (12): Boxes(), C, Diagram(), Flashcards(), Generic(), ImageSpeak(), ListenRepeat(), Match() (+4 more)

### Community 89 - "emails/templates.ts"
Cohesion: 0.41
Nodes (10): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, Rendered (+2 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "users/page.tsx"
Cohesion: 0.19
Nodes (20): ActivityLog(), metadata, AdminTopics(), metadata, metadata, ROLE_LABEL, ROLES, Schools() (+12 more)

### Community 92 - "createStudent"
Cohesion: 0.18
Nodes (9): db, dir, plan, createStudent(), newSecret(), rand(), slug(), updateRosterStudent() (+1 more)

### Community 93 - "RosterRow.tsx"
Cohesion: 0.35
Nodes (8): AddStudentPage(), metadata, RosterRow(), Row, AddStudentForm(), PinNotice(), ResetPinButton(), resetStudentPin()

### Community 94 - "Button.tsx"
Cohesion: 0.32
Nodes (6): AddStudentsMenu(), buttonClass(), Size, sizes, Variant, variants

### Community 96 - "lib/review.ts"
Cohesion: 0.18
Nodes (22): metadata, ReviewWork(), OUTCOME, ReviewForm(), assignmentsForTeacherWhere(), classroomAccessWhere(), submitReview(), teacherStats() (+14 more)

### Community 97 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "settings/page.tsx"
Cohesion: 0.15
Nodes (19): AdminSettings(), metadata, Status(), metadata, NewTopic(), AccountPage(), metadata, ROLE (+11 more)

### Community 104 - "appUrl"
Cohesion: 0.38
Nodes (8): stripe@^17.7.0, stripe, POST, POST, billingConfigured(), isLiveKey(), stripe(), appUrl()

### Community 105 - "roster.ts"
Cohesion: 0.26
Nodes (12): addStudentList(), capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList() (+4 more)

### Community 107 - "VideoPlayer.tsx"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "DashBits.tsx"
Cohesion: 0.16
Nodes (22): CATEGORIES, ContentLibrary(), metadata, AdminRowTopic, AdminTopicRow(), StatusPillClient(), TopicStatusBar(), OPTIONS (+14 more)

### Community 110 - "learn/layout.tsx"
Cohesion: 0.33
Nodes (6): LearnLayout(), NavLinks(), Avatar(), AvatarKey, AVATARS, colors

### Community 111 - "admin/page.tsx"
Cohesion: 0.15
Nodes (17): AdminOverview(), AdminOverviewContent(), metadata, AutoSubmitSelect(), ACTION_GROUPS, ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity() (+9 more)

### Community 112 - "actions/tasks.ts"
Cohesion: 0.42
Nodes (6): StudentActivityPage(), StudentActivity(), recordActivityProgress(), TaskResult, taskSchema, activityForStudent()

### Community 113 - "resources/[id]/page.tsx"
Cohesion: 0.48
Nodes (4): DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview()

### Community 118 - "Art"
Cohesion: 0.33
Nodes (7): KindDot(), TopicCard(), Art(), Pinita(), ART, ArtApi, artSvg()

### Community 119 - "spanish-check.ts"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 120 - "safety.ts"
Cohesion: 0.32
Nodes (7): BLOCKED_WORDS, blockedWord(), Likelihood, normalize(), NORMALIZED, RANK, SafeSearchAnnotation

### Community 121 - "vitest"
Cohesion: 0.40
Nodes (3): vitest, poolerSafeUrl(), env

### Community 122 - "States.tsx"
Cohesion: 0.60
Nodes (3): Error(), Error(), DashError()

### Community 123 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `AudioField.tsx`, `layout.ts`, `games/templates.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `verify.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `useVoiceSession.ts`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `WsIcon`, `FlashcardParts.tsx`, `[slug]/page.tsx`, `autocorrect.ts`, `Players.tsx`, `plainText`, `TopicLesson.tsx`, `ImageField.tsx`, `TopicRow.tsx`, `teacher/page.tsx`, `CommunityView.tsx`, `ActivitySettings.tsx`, `lib/videos.ts`, `i18n.tsx`, `users/page.tsx`, `RosterRow.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `VideoPlayer.tsx`, `DashBits.tsx`, `admin/page.tsx`, `actions/tasks.ts`, `States.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08173076923076923 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `layout.ts`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `verify.ts`, `react`, `MyActivitiesBoard.tsx`, `db.ts`, `tts/index.ts`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `auth.ts`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `webhook.ts`, `WsIcon`, `Layout raíz`, `PublicHeader`, `[slug]/page.tsx`, `lessonData.ts`, `commons.ts`, `classroom.ts`, `TopicLesson.tsx`, `TopicRow.tsx`, `requireTeacher`, `DashBits.tsx`, `teacher/page.tsx`, `CommunityView.tsx`, `MyActivitiesView.tsx`, `ActivitySettings.tsx`, `lib/videos.ts`, `users/page.tsx`, `RosterRow.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `next.config.ts`, `appUrl`, `middleware.ts`, `DashBits.tsx`, `learn/layout.tsx`, `admin/page.tsx`, `actions/tasks.ts`, `resources/[id]/page.tsx`, `States.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07960014809329878 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `db.ts` to `games/service.ts`, `mediaUrl`, `Dependencias (package.json)`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `webhook.ts`, `[slug]/page.tsx`, `lextro.e2e.mjs`, `lessonData.ts`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`, `lib/videos.ts`, `users/page.tsx`, `createStudent`, `lib/review.ts`, `reports.ts`, `dashboards.e2e.mjs`, `admin/page.tsx`, `actions/tasks.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `AudioField.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._