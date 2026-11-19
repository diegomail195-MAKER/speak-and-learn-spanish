# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 387 files · ~231,519 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2417 nodes · 7448 edges · 118 communities (99 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e126fbfa`
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
- requireTeacher
- lessonData.ts
- topics/[id]/page.tsx
- mediaUrl
- search.ts
- Dependencias (package.json)
- db.ts
- react
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
- Button
- Dependencias de desarrollo
- GameEditorInner
- voices.ts
- admin/library/page.tsx
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- next
- [slug]/page.tsx
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
- ImageField.tsx
- guards.ts
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
- @prisma/client
- teacher/page.tsx
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- SpellBoard.tsx
- "public"."Game"
- AssignTaskWizard.tsx
- VideoForm
- ActivitySettings.tsx
- ActivityList.tsx
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- google.ts
- admin/page.tsx
- ref_node_fs
- "public"."Topic"
- audit
- rateLimit
- DeleteAssignmentButton.tsx
- Button.tsx
- dashboards.e2e.mjs
- lib/review.ts
- html-to-image
- vercel.json
- settings/page.tsx
- actions/folders.ts
- actions/tasks.ts
- roster.ts
- roster/page.tsx
- TemplatePreview.tsx
- dashboards.e2e.mjs
- teacher/library/page.tsx
- spanish-check.ts
- activity.ts
- topic-rows-v2.e2e.mjs
- requireAdminPage
- 20261122000000_review_speaking_settings/migration.sql

## God Nodes (most connected - your core abstractions)
1. `next` - 136 edges
2. `db` - 110 edges
3. `HttpError` - 103 edges
4. `audit()` - 97 edges
5. `Button()` - 90 edges
6. `requireTeacher()` - 87 edges
7. `react` - 75 edges
8. `requireTeacherPage()` - 61 edges
9. `PageHeader()` - 54 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `MetaForm()` --indirect_call--> `updateResourceMeta()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `PublishButton()` --indirect_call--> `publishResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `DeleteButton()` --indirect_call--> `deleteResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `ReviewForm()` --indirect_call--> `submitReview()`  [INFERRED]
  src/components/teacher/ReviewForm.tsx → src/lib/actions/review.ts

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (118 total, 19 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.14
Nodes (24): BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep(), COLORS (+16 more)

### Community 1 - "db.ts"
Cohesion: 0.10
Nodes (46): ContentList(), metadata, STATUS, AdminGrades(), metadata, AdminHome(), metadata, Actions() (+38 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "GameEditor.tsx"
Cohesion: 0.10
Nodes (39): TtsConfig, AudioDefaultsContext, AudioField(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+31 more)

### Community 4 - "games/service.ts"
Cohesion: 0.10
Nodes (41): POST, schema, POST, POST, Ctx, GET, PUT, CARDS (+33 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.11
Nodes (40): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+32 more)

### Community 6 - "layout.ts"
Cohesion: 0.05
Nodes (77): SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole, DownloadIcon(), GearIcon(), icon (+69 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "requireTeacher"
Cohesion: 0.12
Nodes (27): zod, LT_LANG, POST, schema, POST, schoolGame(), createCategory(), deleteCategory() (+19 more)

### Community 9 - "lessonData.ts"
Cohesion: 0.12
Nodes (21): db, main(), metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery() (+13 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.13
Nodes (29): ManageActivities(), metadata, NewTopic(), AdminTopics(), metadata, metadata, stepTitle(), TaskPage() (+21 more)

### Community 11 - "mediaUrl"
Cohesion: 0.10
Nodes (38): POST, PUT, POST, start, POST, GET, POST, POST (+30 more)

### Community 12 - "search.ts"
Cohesion: 0.06
Nodes (52): vitest, poolerSafeUrl(), API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+44 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "db.ts"
Cohesion: 0.06
Nodes (70): POST(), VerifyBanner(), ADMIN_LINKS, TEACHER_EXTRA, TEACHER_LINKS, WorkspaceShell(), escapeHtml(), forgotSchema (+62 more)

### Community 15 - "react"
Cohesion: 0.14
Nodes (27): react, GradeForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm(), TeacherSignUpForm(), S (+19 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.13
Nodes (25): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, check(), ALSO_SPANISH, clearTags() (+17 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.15
Nodes (22): metadata, MyActivitiesPage(), Search, BoardActivity, BoardFolder, BoardSort, Drag, FolderDialog() (+14 more)

### Community 18 - "next"
Cohesion: 0.10
Nodes (28): server-only, POST, schema, Ctx, PUT, POST, metadata, MyProgress() (+20 more)

### Community 19 - "access.ts"
Cohesion: 0.07
Nodes (45): GET(), maxDuration, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), azure(), CONTEXT (+37 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "library/types.ts"
Cohesion: 0.08
Nodes (29): LinkPreview(), Done, LinkPlayer(), Status, ContentFor, contentSchemas, DOCX_MIME, embedFor() (+21 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.14
Nodes (38): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+30 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 25 - "PublicHeader"
Cohesion: 0.07
Nodes (31): AdminInvitePage(), dynamic, metadata, AdminLayout(), ForgotPasswordPage(), metadata, LearnLayout(), LoginPage() (+23 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.09
Nodes (23): postJson(), StudentPlay(), Diagnostic, Input, SessionOptions, TurnResult, TYPED_HELP, MicState (+15 more)

### Community 27 - "ref_node_path"
Cohesion: 0.13
Nodes (7): resetLinkFromLog(), sleep(), stamp, db, errors, stamp, playwright

### Community 28 - "Reproductor de video"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.10
Nodes (20): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+12 more)

### Community 31 - "Button"
Cohesion: 0.14
Nodes (29): EditResource(), AddContent(), metadata, ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps() (+21 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditorInner"
Cohesion: 0.13
Nodes (17): AudioControl(), browserPreview(), generate(), DiagramPoints(), Point, blankItem(), contentSnapshot(), editorState() (+9 more)

### Community 34 - "voices.ts"
Cohesion: 0.10
Nodes (20): AudioDefaults, loadBrowserVoices(), pending, pickBrowserVoice(), pump(), queued, ready, SayResult (+12 more)

### Community 35 - "admin/library/page.tsx"
Cohesion: 0.13
Nodes (12): CATEGORIES, metadata, metadata, metadata, ROLE, metadata, ReviewWork(), metadata (+4 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.09
Nodes (24): Ctx, Dict, EN, ES, UiLang, UiLangProvider(), EditStep, ico (+16 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "next"
Cohesion: 0.18
Nodes (8): nextConfig, securityHeaders, next, Home(), destroySession(), getSessionUser, hashToken(), config

### Community 40 - "[slug]/page.tsx"
Cohesion: 0.13
Nodes (17): metadata, TopicLessonPage(), TopicPage(), EyeIcon(), KindIcon(), LABEL, PlanItem, TopicPlanEditor() (+9 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.13
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.22
Nodes (27): Celebrate(), ConnectSheet(), FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer(), MatchGame() (+19 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.16
Nodes (19): metadata, StudentTask(), ActivityMaterials(), metadata, metadata, StudentViewPage(), TopicLessonProps, assignmentForStudent() (+11 more)

### Community 53 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 54 - "TopicLesson.tsx"
Cohesion: 0.25
Nodes (14): KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), useLessonVoice(), LESSON (+6 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.14
Nodes (24): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+16 more)

### Community 57 - "TopicHero.tsx"
Cohesion: 0.15
Nodes (23): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+15 more)

### Community 58 - "ImageField.tsx"
Cohesion: 0.15
Nodes (16): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+8 more)

### Community 59 - "guards.ts"
Cohesion: 0.17
Nodes (21): POST, POST, POST, POST, body, POST, GET, GET (+13 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.16
Nodes (24): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), FlashcardsGameProps, IconArrow() (+16 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.19
Nodes (15): metadata, MyActivities(), FavoriteButton(), AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep (+7 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "classroom.ts"
Cohesion: 0.10
Nodes (35): ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), AssignState, createAssignment(), schema, checkMembers() (+27 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.22
Nodes (3): errors, NAMES, stamp

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
Cohesion: 0.16
Nodes (14): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+6 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 73 - "@prisma/client"
Cohesion: 0.08
Nodes (11): COLORS, db, errors, stamp, COLORS, db, stamp, db (+3 more)

### Community 74 - "teacher/page.tsx"
Cohesion: 0.13
Nodes (16): Dashboard(), DashboardContent(), metadata, STATUS_CLS, Backup, UnsavedDrafts(), assignmentSummaries(), AssignmentSummary (+8 more)

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
Cohesion: 0.43
Nodes (5): CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, TOPIC_DESCRIPTION

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.18
Nodes (15): AlphabetExplorer(), Config, sleep(), SpellBoard(), submit(), FeedbackBubble(), ListenBlocked(), MicIndicator() (+7 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AssignTaskWizard.tsx"
Cohesion: 0.24
Nodes (9): AssignTaskPage(), metadata, resourceOf(), TopicResources, AssignTaskWizard(), ClassData, TopicData, GRADE_LABEL (+1 more)

### Community 82 - "VideoForm"
Cohesion: 0.22
Nodes (10): EditVideo(), metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), adminEmails(), isPlatformAdmin() (+2 more)

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.16
Nodes (17): FONT_SAMPLE, FontPreview(), ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS (+9 more)

### Community 84 - "ActivityList.tsx"
Cohesion: 0.42
Nodes (7): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "google.ts"
Cohesion: 0.17
Nodes (19): POST, GET, PROBES, b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider() (+11 more)

### Community 89 - "ref_node_fs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "audit"
Cohesion: 0.17
Nodes (17): metadata, ROLE_LABEL, ROLES, Schools(), Users(), UsersAndSchools(), AdminState, createSchool() (+9 more)

### Community 92 - "rateLimit"
Cohesion: 0.20
Nodes (16): GET, POST, GET, POST, schema, imageSearchEnabled(), hashKey(), memory (+8 more)

### Community 93 - "DeleteAssignmentButton.tsx"
Cohesion: 0.67
Nodes (3): DeleteAssignmentButton(), Submit(), deleteAssignment()

### Community 94 - "Button.tsx"
Cohesion: 0.27
Nodes (9): Bar(), ClassPage(), AddStudentsMenu(), buttonClass(), Size, sizes, Variant, variants (+1 more)

### Community 96 - "lib/review.ts"
Cohesion: 0.19
Nodes (18): ReviewPage(), decision, ReviewState, submitReview(), attemptWhere(), effective(), nameOf(), parseDetails() (+10 more)

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "settings/page.tsx"
Cohesion: 0.18
Nodes (12): AdminSettings(), metadata, Status(), dynamic, metadata, SignupPage(), AccountPage(), SettingsForm() (+4 more)

### Community 103 - "actions/folders.ts"
Cohesion: 0.24
Nodes (16): moveTo(), run(), color, createFolder(), deleteFolder(), done(), emptyBin(), moveFolder() (+8 more)

### Community 104 - "actions/tasks.ts"
Cohesion: 0.25
Nodes (9): StudentActivityPage(), StudentActivity(), createTopicTask(), recordActivityProgress(), TaskResult, taskSchema, activityForStudent(), dedupeRecipients() (+1 more)

### Community 105 - "roster.ts"
Cohesion: 0.26
Nodes (12): addStudentList(), capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList() (+4 more)

### Community 106 - "roster/page.tsx"
Cohesion: 0.26
Nodes (9): metadata, RosterPage(), AddStudentPage(), metadata, RosterRow(), Row, AddStudentForm(), PinNotice() (+1 more)

### Community 107 - "TemplatePreview.tsx"
Cohesion: 0.36
Nodes (12): Boxes(), C, Diagram(), Flashcards(), Generic(), ImageSpeak(), ListenRepeat(), Match() (+4 more)

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.18
Nodes (5): db, errors, signedIn(), stamp, watch()

### Community 109 - "teacher/library/page.tsx"
Cohesion: 0.30
Nodes (9): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), libraryTopics() (+1 more)

### Community 110 - "spanish-check.ts"
Cohesion: 0.25
Nodes (9): accept(), ALWAYS, applyAll(), applySuggestion(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS (+1 more)

### Community 111 - "activity.ts"
Cohesion: 0.24
Nodes (8): ACTION_GROUPS, ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf(), recentContentChanges(), Row, VERB

### Community 112 - "topic-rows-v2.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 113 - "requireAdminPage"
Cohesion: 0.36
Nodes (6): DraftPreview(), ContentLibrary(), ResourcePreview(), BackLink(), requireAdminPage(), resourceForPreview()

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `GameEditor.tsx`, `layout.ts`, `lessonData.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `db.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `next`, `library/types.ts`, `PublicHeader`, `useVoiceSession.ts`, `Reproductor de video`, `Scripts de package.json`, `Button`, `GameEditorInner`, `admin/library/page.tsx`, `ImageField.tsx`, `next`, `[slug]/page.tsx`, `autocorrect.ts`, `Players.tsx`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `ImageField.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `DashBits.tsx`, `teacher/page.tsx`, `DiagramBoard.tsx`, `SpellBoard.tsx`, `AssignTaskWizard.tsx`, `ActivitySettings.tsx`, `ActivityList.tsx`, `Button.tsx`, `settings/page.tsx`, `actions/tasks.ts`, `roster/page.tsx`, `teacher/library/page.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13978494623655913 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `GameEditor.tsx`, `games/service.ts`, `layout.ts`, `requireTeacher`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `db.ts`, `react`, `MyActivitiesBoard.tsx`, `next`, `access.ts`, `library.ts`, `PublicHeader`, `Scripts de package.json`, `Button`, `admin/library/page.tsx`, `Layout raíz`, `[slug]/page.tsx`, `lessonData.ts`, `TopicLesson.tsx`, `TopicHero.tsx`, `guards.ts`, `TopicRow.tsx`, `classroom.ts`, `DashBits.tsx`, `teacher/page.tsx`, `AssignTaskWizard.tsx`, `ActivitySettings.tsx`, `ActivityList.tsx`, `google.ts`, `audit`, `rateLimit`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `actions/folders.ts`, `actions/tasks.ts`, `roster/page.tsx`, `teacher/library/page.tsx`, `requireAdminPage`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10112994350282486 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `@prisma/client` to `games/service.ts`, `lessonData.ts`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `db.ts`, `next`, `library.ts`, `ref_node_path`, `Scripts de package.json`, `lextro.e2e.mjs`, `reports.ts`, `guards.ts`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `library/seed.ts`, `audit`, `lib/review.ts`, `actions/tasks.ts`, `dashboards.e2e.mjs`, `activity.ts`, `topic-rows-v2.e2e.mjs`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `GameEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1026827012025902 - nodes in this community are weakly interconnected._