# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 377 files · ~224,828 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2269 nodes · 6982 edges · 102 communities (86 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af5a5201`
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
- audit
- lessonData.ts
- topics/[id]/page.tsx
- mediaUrl
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
- sttProvider
- Dependencias de desarrollo
- GameEditor.tsx
- AudioField.tsx
- server-only
- Configuración ESLint
- ImageEditor.tsx
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
- outcome.ts
- TopicLesson.tsx
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- TopicHero.tsx
- ImageField.tsx
- next
- FlashcardsGame.tsx
- photo-form.e2e.mjs
- teacher/library/page.tsx
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
- users/page.tsx
- DiagramBoard.tsx
- "public"."MediaAsset"
- "public"."User"
- library/seed.ts
- SpellBoard.tsx
- "public"."Game"
- assign/page.tsx
- CardPhotoForm.tsx
- games/types.ts
- ActivityList.tsx
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- GamePlayer.tsx
- admin/page.tsx
- ref_node_fs
- "public"."Topic"
- templateByKey
- games/[id]/edit/page.tsx
- assignments/page.tsx
- Button.tsx
- dashboards.e2e.mjs
- AudioControl
- html-to-image
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `next` - 124 edges
2. `HttpError` - 103 edges
3. `db` - 98 edges
4. `Button()` - 90 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 85 edges
7. `react` - 68 edges
8. `PageHeader()` - 56 edges
9. `requireTeacherPage()` - 55 edges
10. `Panel()` - 48 edges

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
- None detected.

## Communities (102 total, 16 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.11
Nodes (27): AlphabetExplorer(), BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep() (+19 more)

### Community 1 - "db.ts"
Cohesion: 0.09
Nodes (47): AddContent(), metadata, AdminGrades(), metadata, AdminHome(), metadata, Actions(), AssignedBanner() (+39 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "GameEditor.tsx"
Cohesion: 0.17
Nodes (20): AudioField(), playFaceAudio(), stopFaceAudio(), FaceEditor(), FlashcardPreview(), RowControls(), swapItem(), GameEditorInner() (+12 more)

### Community 4 - "games/service.ts"
Cohesion: 0.15
Nodes (17): schema, POST, PlayPage(), phrasesFor(), practiceCardClips(), practicePhraseClips(), buildPlayGame(), faceAudio (+9 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.09
Nodes (43): vitest, poolerSafeUrl(), scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH (+35 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "audit"
Cohesion: 0.10
Nodes (39): POST, POST, POST, done, POST, start, Ctx, PUT (+31 more)

### Community 9 - "lessonData.ts"
Cohesion: 0.13
Nodes (19): metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, PREVIEW_BG (+11 more)

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.11
Nodes (38): EditResource(), ContentList(), metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata (+30 more)

### Community 11 - "mediaUrl"
Cohesion: 0.20
Nodes (19): POST, POST, GET, POST, POST, maxDuration, POST, sha256File() (+11 more)

### Community 12 - "search.ts"
Cohesion: 0.05
Nodes (68): GET, CardPhotoForm(), API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+60 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 14 - "db.ts"
Cohesion: 0.06
Nodes (76): stripe@^17.7.0, stripe, POST, POST, POST(), VerifyBanner(), escapeHtml(), forgotSchema (+68 more)

### Community 15 - "Button"
Cohesion: 0.11
Nodes (48): react, ContentEditor(), listOps(), PairsEditor(), RowTools(), SheetEditor(), GradeForm(), MetaFields() (+40 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (29): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+21 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.08
Nodes (52): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+44 more)

### Community 18 - "next"
Cohesion: 0.10
Nodes (31): @prisma/client, POST, schema, metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage() (+23 more)

### Community 19 - "access.ts"
Cohesion: 0.06
Nodes (58): GET(), maxDuration, GET, POST, schema, azure(), CONTEXT, gateway() (+50 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "library/types.ts"
Cohesion: 0.09
Nodes (36): ART_OPTIONS, FilePicker(), ImagePicker(), useUpload(), LinkPreview(), Method, METHOD_LABEL, METHODS (+28 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.14
Nodes (38): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+30 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "PublicHeader"
Cohesion: 0.06
Nodes (37): AdminInvitePage(), dynamic, metadata, AdminLayout(), ForgotPasswordPage(), metadata, LearnLayout(), LoginPage() (+29 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (19): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+11 more)

### Community 27 - "ref_node_path"
Cohesion: 0.12
Nodes (6): COLORS, db, stamp, db, errors, stamp

### Community 28 - "Reproductor de video"
Cohesion: 0.21
Nodes (9): Report, fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer (+1 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+10 more)

### Community 31 - "sttProvider"
Cohesion: 0.43
Nodes (6): metadata, StudentAlphabet(), metadata, TeacherAlphabet(), sttLocale(), sttProvider()

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditor.tsx"
Cohesion: 0.11
Nodes (20): DiagramPoints(), Point, FONT_SAMPLE, FontPreview(), blankItem(), Category, contentSnapshot(), editorState() (+12 more)

### Community 34 - "AudioField.tsx"
Cohesion: 0.10
Nodes (25): TtsConfig, AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel(), ensureGenerated(), sampleVoice(), save() (+17 more)

### Community 35 - "server-only"
Cohesion: 0.15
Nodes (17): server-only, POST, PUT, POST, GET, EXT, FileGroup, LIBRARY_MAX_BYTES (+9 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageEditor.tsx"
Cohesion: 0.23
Nodes (11): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+3 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 49 - "autocorrect.ts"
Cohesion: 0.10
Nodes (29): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+21 more)

### Community 50 - "Players.tsx"
Cohesion: 0.16
Nodes (32): DraftPreview(), ResourcePreview(), BackLink(), Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer() (+24 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.13
Nodes (24): ActivityMaterials(), metadata, metadata, TopicLessonPage(), metadata, StudentViewPage(), TopicLessonProps, finishedQuestions() (+16 more)

### Community 53 - "outcome.ts"
Cohesion: 0.60
Nodes (4): isVoice(), questionResult(), questionStatus(), R

### Community 54 - "TopicLesson.tsx"
Cohesion: 0.17
Nodes (18): metadata, StudentTask(), StudentActivity(), KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase (+10 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.21
Nodes (15): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+7 more)

### Community 57 - "TopicHero.tsx"
Cohesion: 0.14
Nodes (26): TopicPage(), EyeIcon(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel() (+18 more)

### Community 58 - "ImageField.tsx"
Cohesion: 0.11
Nodes (20): cache, CardFace, LANG, Photo, PhotoBox(), upload(), SearchPanel(), SIDE (+12 more)

### Community 59 - "next"
Cohesion: 0.13
Nodes (25): next, zod, POST, POST, PROBES, GET, POST, body (+17 more)

### Community 60 - "FlashcardsGame.tsx"
Cohesion: 0.17
Nodes (21): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+13 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "teacher/library/page.tsx"
Cohesion: 0.11
Nodes (24): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), AccessItem (+16 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "classroom.ts"
Cohesion: 0.09
Nodes (42): ownedGroup(), ownedLevel(), ownedStudent(), createAssignment(), addStudentList(), checkMembers(), createClassroom(), createGroup() (+34 more)

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
Cohesion: 0.18
Nodes (12): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+4 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "users/page.tsx"
Cohesion: 0.23
Nodes (10): metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole (+2 more)

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
Cohesion: 0.26
Nodes (9): db, main(), CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary(), TOPIC_DESCRIPTION (+1 more)

### Community 79 - "SpellBoard.tsx"
Cohesion: 0.32
Nodes (9): Config, sleep(), SpellBoard(), submit(), ALPHABET, Letter, LETTER_STYLES, letterName() (+1 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "assign/page.tsx"
Cohesion: 0.32
Nodes (6): AssignTaskPage(), metadata, resourceOf(), TopicResources, libraryTopics(), TopicStep

### Community 82 - "CardPhotoForm.tsx"
Cohesion: 0.42
Nodes (6): EditVideo(), metadata, metadata, NewVideo(), requireVideoAdminPage(), videoFormOptions()

### Community 83 - "games/types.ts"
Cohesion: 0.13
Nodes (24): AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section, SettingsValues, SHORT, Voice (+16 more)

### Community 84 - "ActivityList.tsx"
Cohesion: 0.20
Nodes (15): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, schoolGame() (+7 more)

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GamePlayer.tsx"
Cohesion: 0.23
Nodes (14): MatchBoard(), done(), drop(), sleep(), GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer() (+6 more)

### Community 89 - "ref_node_fs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "templateByKey"
Cohesion: 0.26
Nodes (15): POST, CARDS, GET(), maxDuration, ActivitySettings(), flush(), update(), createGame() (+7 more)

### Community 92 - "games/[id]/edit/page.tsx"
Cohesion: 0.27
Nodes (8): Ctx, GET, PUT, EditGame(), metadata, GameEditor(), loadEditorGame(), saveSchema

### Community 93 - "assignments/page.tsx"
Cohesion: 0.33
Nodes (7): AssignmentsPage(), ICON, Kind, metadata, recipientLabel(), DeleteAssignmentButton(), Submit()

### Community 94 - "Button.tsx"
Cohesion: 0.27
Nodes (9): Bar(), ClassPage(), AddStudentsMenu(), buttonClass(), Size, sizes, Variant, variants (+1 more)

### Community 96 - "AudioControl"
Cohesion: 0.50
Nodes (5): AudioControl(), browserPreview(), generate(), previewTts(), text()

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

- **Why does `react` connect `Button` to `parts.tsx`, `db.ts`, `GameEditor.tsx`, `layout.ts`, `lessonData.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `db.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `next`, `library/types.ts`, `PublicHeader`, `useVoiceSession.ts`, `Reproductor de video`, `Scripts de package.json`, `GameEditor.tsx`, `AudioField.tsx`, `ImageEditor.tsx`, `autocorrect.ts`, `Players.tsx`, `TopicLesson.tsx`, `plainText`, `TopicHero.tsx`, `ImageField.tsx`, `FlashcardsGame.tsx`, `teacher/library/page.tsx`, `users/page.tsx`, `DiagramBoard.tsx`, `SpellBoard.tsx`, `games/types.ts`, `ActivityList.tsx`, `GamePlayer.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11260504201680673 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `audit`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `db.ts`, `Button`, `MyActivitiesBoard.tsx`, `next`, `access.ts`, `library.ts`, `PublicHeader`, `Reproductor de video`, `Scripts de package.json`, `GameEditor.tsx`, `server-only`, `Layout raíz`, `mediaUrl`, `commons.ts`, `Players.tsx`, `lessonData.ts`, `TopicLesson.tsx`, `TopicHero.tsx`, `teacher/library/page.tsx`, `classroom.ts`, `DashBits.tsx`, `users/page.tsx`, `CardPhotoForm.tsx`, `games/types.ts`, `ActivityList.tsx`, `templateByKey`, `games/[id]/edit/page.tsx`, `assignments/page.tsx`, `Button.tsx`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0855094726062468 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `next` to `db.ts`, `games/service.ts`, `audit`, `mediaUrl`, `Dependencias (package.json)`, `db.ts`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `lextro.e2e.mjs`, `next`, `photo-form.e2e.mjs`, `ref_node_fs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `Evaluación de pronunciación` be split into smaller, more focused modules?**
  _Cohesion score 0.08708272859216255 - nodes in this community are weakly interconnected._