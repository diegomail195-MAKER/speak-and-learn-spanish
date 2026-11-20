# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 404 files · ~238,335 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2556 nodes · 8077 edges · 120 communities (100 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8381bdd6`
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
- PublicHeader
- games/templates.ts
- activityTypes.ts
- mediaUrl
- search.ts
- Dependencias (package.json)
- auth.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- next
- google.ts
- Configuración TypeScript
- TopicHero.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- library/types.ts
- topic-rows.e2e.mjs
- ContentEditor.tsx
- Tests e2e de flashcards
- Scripts de package.json
- topics/[id]/page.tsx
- Dependencias de desarrollo
- users/page.tsx
- CardPhotoForm.tsx
- DashBits.tsx
- Configuración ESLint
- ImageField.tsx
- Layout raíz
- react
- lessonData.ts
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
- games/types.ts
- TopicLesson.tsx
- preview/[id]/page.tsx
- FlashcardsGame.tsx
- community.e2e.mjs
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- audit
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- ref_node_path
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- CommunityView.tsx
- roster.ts
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- commons.ts
- "public"."Game"
- AudioField.tsx
- videos/new/page.tsx
- GameEditor.tsx
- resources/[id]/page.tsx
- ref_node_fs
- library-header.e2e.mjs
- GameEditorInner
- MyActivitiesView.tsx
- ImageEditor.tsx
- "public"."Topic"
- AudioPanel
- safety.ts
- ActivityList.tsx
- TopicPlanEditor.tsx
- playwright
- lib/review.ts
- attempts/service.ts
- vercel.json
- requireTeacherPage
- topic-rows-v2.e2e.mjs
- actions/videos.ts
- build-accent-maps.mjs
- my-activities.e2e.mjs
- VideoPlayer.tsx
- dashboards.e2e.mjs
- i18n.tsx
- spanish-check.ts
- StudentPlay.tsx
- assignments.ts
- next.config.ts
- 20261122000000_review_speaking_settings/migration.sql
- db-url.ts
- middleware.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 151 edges
2. `db` - 116 edges
3. `HttpError` - 106 edges
4. `audit()` - 105 edges
5. `requireTeacher()` - 94 edges
6. `Button()` - 90 edges
7. `react` - 86 edges
8. `requireTeacherPage()` - 65 edges
9. `Input()` - 48 edges
10. `PageHeader()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `saveRename()` --calls--> `renameGame()`  [EXTRACTED]
  src/components/player/flashcards/ActivityStrip.tsx → src/lib/actions/games.ts
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `TopicLessonProps` --references--> `LessonStep`  [EXTRACTED]
  src/components/library/TopicLesson.tsx → src/lib/library/lessonData.ts
- `ForgotPasswordForm()` --indirect_call--> `requestPasswordReset()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (120 total, 20 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.12
Nodes (43): BoxesBoard(), openBox(), runReview(), sleep(), State, DiagramBoard(), drop(), finishIfDone() (+35 more)

### Community 1 - "db.ts"
Cohesion: 0.10
Nodes (40): AddContent(), metadata, Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults() (+32 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "useVoiceSession.ts"
Cohesion: 0.07
Nodes (35): AlphabetExplorer(), Config, SpeakingPlayer(), Status, CoachLine, Diagnostic, Feedback, Input (+27 more)

### Community 4 - "games/service.ts"
Cohesion: 0.09
Nodes (45): POST, schema, POST, Ctx, GET, PUT, GET, POST (+37 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (42): vitest, scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer() (+34 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.10
Nodes (7): MicSession, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig, VadEvent

### Community 8 - "PublicHeader"
Cohesion: 0.13
Nodes (15): LearnLayout(), Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart() (+7 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.17
Nodes (13): AdminNewGame(), metadata, metadata, NewGame(), TemplateGallery(), AUTOPLAY_OPTION, Board, DEFAULT_MAX_ITEMS (+5 more)

### Community 10 - "activityTypes.ts"
Cohesion: 0.21
Nodes (19): ActivityTypeIcon(), Gallery(), Sort, TypeCard(), ACTIVITY_TYPES, activityDescription(), activityIconSrc(), activityIconSrcSet() (+11 more)

### Community 11 - "mediaUrl"
Cohesion: 0.07
Nodes (62): POST, PROBES, GET, POST, POST, PUT, GET, POST (+54 more)

### Community 12 - "search.ts"
Cohesion: 0.18
Nodes (17): searchCommons(), download(), fetchSafeImage(), ImageResult, ImageSize, pixabay(), PIXABAY_HOSTS, PixabayHit (+9 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "auth.ts"
Cohesion: 0.06
Nodes (72): stripe@^17.7.0, stripe, POST, POST, POST(), VerifyBanner(), escapeHtml(), forgotSchema (+64 more)

### Community 15 - "react"
Cohesion: 0.12
Nodes (31): GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm(), TeacherSignUpForm() (+23 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.13
Nodes (24): LanguageTools(), markSelection(), check(), ALSO_SPANISH, clearTags(), EN, ES_HINT, FR (+16 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.14
Nodes (33): boardHref(), CommunityIcon(), Drag, FolderDialog(), FolderGlyph(), FolderShape(), Menu(), MenuItem() (+25 more)

### Community 18 - "next"
Cohesion: 0.06
Nodes (56): next, @prisma/client, server-only, zod, AdminLayout(), body, POST, LT_LANG (+48 more)

### Community 19 - "google.ts"
Cohesion: 0.16
Nodes (18): GET, b64(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress(), Provider (+10 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicHero.tsx"
Cohesion: 0.16
Nodes (22): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+14 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.15
Nodes (37): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+29 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 25 - "AuthLayout"
Cohesion: 0.12
Nodes (20): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+12 more)

### Community 26 - "library/types.ts"
Cohesion: 0.10
Nodes (26): LinkPreview(), LinkPlayer(), ContentFor, contentSchemas, DOCX_MIME, embedFor(), fileRef, FileRef (+18 more)

### Community 27 - "topic-rows.e2e.mjs"
Cohesion: 0.12
Nodes (6): db, dir, plan, db, errors, stamp

### Community 28 - "ContentEditor.tsx"
Cohesion: 0.17
Nodes (23): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+15 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.11
Nodes (19): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, html-to-image@1.11.13, jspdf@4.2.1, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2 (+11 more)

### Community 31 - "topics/[id]/page.tsx"
Cohesion: 0.14
Nodes (29): ContentList(), metadata, STATUS, ManageActivities(), metadata, GameLibraryPanel(), AddResult, LibraryPicker() (+21 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "users/page.tsx"
Cohesion: 0.17
Nodes (16): metadata, ROLE_LABEL, ROLES, AdminActionForm(), AdminState, createSchool(), endSessions(), GRANT_MESSAGE (+8 more)

### Community 34 - "CardPhotoForm.tsx"
Cohesion: 0.18
Nodes (16): cache, CardFace, CardPhotoForm(), LANG, Photo, SIDE, Slot, searchCommonsDetailed() (+8 more)

### Community 35 - "DashBits.tsx"
Cohesion: 0.05
Nodes (66): Error(), AdminOverview(), AdminOverviewContent(), metadata, AdminTopics(), metadata, Error(), AdminRowTopic (+58 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.12
Nodes (27): AudioField(), playFaceAudio(), stopFaceAudio(), PhotoBox(), upload(), SearchPanel(), FaceEditor(), onPaste() (+19 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "react"
Cohesion: 0.16
Nodes (15): react, Bar(), ClassPage(), S, StudentPicker(), AddStudentsMenu(), CoTeacherForm(), Row (+7 more)

### Community 40 - "lessonData.ts"
Cohesion: 0.08
Nodes (38): AdminTopicPreview(), metadata, metadata, StudentTask(), BAND, LEGACY, LibraryPage(), metadata (+30 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.22
Nodes (27): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+19 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "create-activity.e2e.mjs"
Cohesion: 0.16
Nodes (12): addImage(), assert(), createEach(), db, errors, fillFirstItem(), fx(), log() (+4 more)

### Community 53 - "tts/index.ts"
Cohesion: 0.06
Nodes (53): GET(), maxDuration, metadata, StudentAlphabet(), metadata, TeacherAlphabet(), azure(), CONTEXT (+45 more)

### Community 54 - "classroom.ts"
Cohesion: 0.09
Nodes (36): ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), createAssignment(), checkMembers(), ClassAdminState, createClassroom() (+28 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "games/types.ts"
Cohesion: 0.09
Nodes (36): LOOK_KEYS, PossibleAnswers(), Section, SettingsValues, SHORT, Voice, VOICE_KEYS, Clips (+28 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.16
Nodes (19): StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), TopicLessonProps (+11 more)

### Community 58 - "preview/[id]/page.tsx"
Cohesion: 0.24
Nodes (8): metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole

### Community 59 - "FlashcardsGame.tsx"
Cohesion: 0.16
Nodes (22): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), FlashcardsGameProps, IconArrow() (+14 more)

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

### Community 64 - "audit"
Cohesion: 0.16
Nodes (28): POST, POST, AnswerRow(), save(), ownClassroomStrict(), schoolGame(), createCategory(), deleteCategory() (+20 more)

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
Cohesion: 0.14
Nodes (17): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+9 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "CommunityView.tsx"
Cohesion: 0.24
Nodes (10): react-dom@19.1.0, react-dom, AdminCommunityPage(), metadata, CommunityPage(), metadata, CommunityActions(), CopyButton() (+2 more)

### Community 75 - "roster.ts"
Cohesion: 0.26
Nodes (12): addStudentList(), capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList() (+4 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/seed.ts"
Cohesion: 0.26
Nodes (9): db, main(), CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary(), TOPIC_DESCRIPTION (+1 more)

### Community 79 - "commons.ts"
Cohesion: 0.21
Nodes (13): API(), CommonsPhoto, CommonsStats, dropReason(), FILE_HOSTS(), fileUrl(), HEADERS, Info (+5 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AudioField.tsx"
Cohesion: 0.13
Nodes (19): TtsConfig, AudioDefaults, AudioDefaultsContext, MAIN, RATE_STEPS, SAMPLE, SHORT(), loadBrowserVoices() (+11 more)

### Community 82 - "videos/new/page.tsx"
Cohesion: 0.53
Nodes (5): EditVideo(), metadata, NewVideo(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "GameEditor.tsx"
Cohesion: 0.14
Nodes (14): DiagramPoints(), Point, FONT_SAMPLE, FontPreview(), Category, contentSnapshot(), LANG_SHORT, LibrarySlots (+6 more)

### Community 84 - "resources/[id]/page.tsx"
Cohesion: 0.48
Nodes (4): DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview()

### Community 85 - "ref_node_fs"
Cohesion: 0.13
Nodes (5): errors, stamp, resetLinkFromLog(), sleep(), stamp

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GameEditorInner"
Cohesion: 0.27
Nodes (9): blankItem(), editorState(), GameEditorInner(), assign(), doPublish(), finishEditing(), publish(), newKey() (+1 more)

### Community 88 - "MyActivitiesView.tsx"
Cohesion: 0.23
Nodes (10): AdminMyActivitiesPage(), metadata, metadata, MyActivitiesPage(), BoardActivity, BoardFolder, BoardSort, MyActivitiesBase (+2 more)

### Community 89 - "ImageEditor.tsx"
Cohesion: 0.23
Nodes (11): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+3 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "AudioPanel"
Cohesion: 0.21
Nodes (12): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+4 more)

### Community 92 - "safety.ts"
Cohesion: 0.27
Nodes (9): BLOCKED_WORDS, blockedWord(), hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED, RANK (+1 more)

### Community 93 - "ActivityList.tsx"
Cohesion: 0.42
Nodes (7): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded

### Community 94 - "TopicPlanEditor.tsx"
Cohesion: 0.25
Nodes (4): KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 95 - "playwright"
Cohesion: 0.14
Nodes (6): errors, stamp, COLORS, db, stamp, playwright

### Community 96 - "lib/review.ts"
Cohesion: 0.11
Nodes (34): AssignmentsPage(), ICON, Kind, metadata, recipientLabel(), OUTCOME, ReviewForm(), assignmentsForTeacherWhere() (+26 more)

### Community 97 - "attempts/service.ts"
Cohesion: 0.30
Nodes (9): POST, POST, isVoice(), questionResult(), questionStatus(), R, finalizeAttempt(), finishedQuestions() (+1 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "requireTeacherPage"
Cohesion: 0.10
Nodes (46): ActivityLog(), metadata, CATEGORIES, ContentLibrary(), metadata, AdminSettings(), metadata, Status() (+38 more)

### Community 103 - "topic-rows-v2.e2e.mjs"
Cohesion: 0.22
Nodes (3): db, errors, stamp

### Community 104 - "actions/videos.ts"
Cohesion: 0.36
Nodes (9): addToCollection(), createCollection(), deleteCollection(), deleteVideo(), moveInCollection(), removeFromCollection(), schoolCollection(), schoolVideo() (+1 more)

### Community 105 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 107 - "VideoPlayer.tsx"
Cohesion: 0.21
Nodes (9): Report, fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer (+1 more)

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "i18n.tsx"
Cohesion: 0.25
Nodes (7): GameEditor(), Ctx, Dict, EN, ES, UiLang, UiLangProvider()

### Community 110 - "spanish-check.ts"
Cohesion: 0.27
Nodes (8): POST, ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 111 - "StudentPlay.tsx"
Cohesion: 0.60
Nodes (4): GamePlayer(), postJson(), StudentPlay(), TurnResult

### Community 112 - "assignments.ts"
Cohesion: 0.32
Nodes (6): DeleteAssignmentButton(), Submit(), AssignState, deleteAssignment(), schema, setAssignmentActive()

## Knowledge Gaps
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `useVoiceSession.ts`, `layout.ts`, `activityTypes.ts`, `Dependencias (package.json)`, `auth.ts`, `react`, `MyActivitiesBoard.tsx`, `next`, `TopicHero.tsx`, `AuthLayout`, `ContentEditor.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `users/page.tsx`, `CardPhotoForm.tsx`, `DashBits.tsx`, `ImageField.tsx`, `lessonData.ts`, `autocorrect.ts`, `Players.tsx`, `games/types.ts`, `TopicLesson.tsx`, `preview/[id]/page.tsx`, `FlashcardsGame.tsx`, `TopicRow.tsx`, `DashBits.tsx`, `AudioField.tsx`, `GameEditor.tsx`, `ImageEditor.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `lib/review.ts`, `requireTeacherPage`, `VideoPlayer.tsx`, `i18n.tsx`, `StudentPlay.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11611030478955008 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `PublicHeader`, `mediaUrl`, `Dependencias (package.json)`, `auth.ts`, `react`, `MyActivitiesBoard.tsx`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `ContentEditor.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `users/page.tsx`, `DashBits.tsx`, `Layout raíz`, `react`, `lessonData.ts`, `tts/index.ts`, `classroom.ts`, `games/types.ts`, `TopicLesson.tsx`, `preview/[id]/page.tsx`, `TopicRow.tsx`, `audit`, `DashBits.tsx`, `CommunityView.tsx`, `GameEditor.tsx`, `resources/[id]/page.tsx`, `MyActivitiesView.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `lib/review.ts`, `attempts/service.ts`, `requireTeacherPage`, `actions/videos.ts`, `VideoPlayer.tsx`, `assignments.ts`, `next.config.ts`, `middleware.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10105580693815988 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `next` to `db.ts`, `games/service.ts`, `mediaUrl`, `Dependencias (package.json)`, `auth.ts`, `library.ts`, `topic-rows.e2e.mjs`, `Scripts de package.json`, `users/page.tsx`, `DashBits.tsx`, `lextro.e2e.mjs`, `create-activity.e2e.mjs`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`, `playwright`, `lib/review.ts`, `attempts/service.ts`, `topic-rows-v2.e2e.mjs`, `dashboards.e2e.mjs`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `useVoiceSession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07312925170068027 - nodes in this community are weakly interconnected._