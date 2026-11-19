# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2269 nodes · 6999 edges · 106 communities (92 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `533e5f1c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Reproductor de juegos y sesión de voz
- Componentes UI y páginas de profesor
- Esquema de base de datos (migraciones)
- Editor de juegos (campos de audio/imagen)
- Servicio de juegos y feedback
- Evaluación de pronunciación
- API, guards y rate limit
- Micrófono y detección de voz (VAD)
- Acciones de aula, tareas y categorías
- Plantillas y galería de plantillas
- Sesión de usuario
- Validación y subida de medios
- Búsqueda de imágenes y filtro seguro
- Dependencias (package.json)
- Autenticación y emails
- Formularios de contraseña
- Segmentación de texto
- Almacenamiento y API de medios
- Videos (servicio y API)
- Texto a voz (TTS) y voces
- Configuración TypeScript
- Campo de texto en español
- Tests e2e de plantillas
- Páginas de login y contraseña
- Tests e2e de seguridad y videos
- Shells y layouts de profesor/alumno
- Portada, privacidad y logo
- Test e2e de videos
- Reproductor de video
- Tests e2e de flashcards
- Scripts de package.json
- Reconocimiento de voz (STT)
- Dependencias de desarrollo
- Corrector de español
- Locutor del cliente (speaker)
- Selector de alumno
- Configuración ESLint
- Generación de TTS
- Layout raíz
- Configuración Next.js
- Middleware
- Configuración PostCSS
- 20261025013059_spelling_name/migration.sql
- 20261025013801_support_and_endings/migration.sql
- 20261025014837_ends_question/migration.sql
- 20261025015628_game_language_default/migration.sql
- 20261025031956_templates_v2/migration.sql
- Drivers de almacenamiento
- Script de arranque de Graphify
- compilerOptions
- dependencies
- webhook.ts
- "public"."School"
- audit
- VideoPlayer.tsx
- games.ts
- ActivitySettings.tsx
- templates.e2e.mjs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- VideoForm.tsx
- ref_node_fs
- playwright
- preview/[id]/page.tsx
- library.e2e.mjs
- video-player.e2e.mjs
- AlphabetExplorer.tsx
- roster.ts
- automatic.ts
- "TopicPlan"
- flashcards-printables.e2e.mjs
- games/types.ts
- attempts/service.ts
- flashcards.e2e.mjs
- "public"."MediaAsset"
- "public"."User"
- appUrl
- scripts
- "public"."Game"
- library/seed.ts
- sample/route.ts
- StorageDriver
- lets-practice.e2e.mjs
- library-header.e2e.mjs
- eslint.config.mjs
- build-accent-maps.mjs
- topic-hero.e2e.mjs
- "public"."Topic"
- youtubeIdFrom
- activity-actions.e2e.mjs
- app/layout.tsx
- email.ts
- html-to-image
- templateByKey
- vercel.json
- DeleteAssignmentButton.tsx
- graphify-setup.sh
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 125 edges
2. `HttpError` - 103 edges
3. `db` - 98 edges
4. `Button()` - 90 edges
5. `requireTeacher()` - 85 edges
6. `audit()` - 85 edges
7. `react` - 69 edges
8. `PageHeader()` - 56 edges
9. `requireTeacherPage()` - 55 edges
10. `Panel()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `AssignForm()` --indirect_call--> `createAssignment()`  [INFERRED]
  src/components/teacher/AssignForm.tsx → src/lib/actions/assignments.ts
- `AddStudentForm()` --indirect_call--> `createStudent()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts
- `RosterRow()` --indirect_call--> `resetStudentPin()`  [INFERRED]
  src/components/teacher/RosterRow.tsx → src/lib/actions/classroom.ts
- `ResetPinButton()` --indirect_call--> `resetStudentPin()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts
- `RosterRow()` --indirect_call--> `updateRosterStudent()`  [INFERRED]
  src/components/teacher/RosterRow.tsx → src/lib/actions/classroom.ts

## Import Cycles
- None detected.

## Communities (106 total, 14 thin omitted)

### Community 0 - "Reproductor de juegos y sesión de voz"
Cohesion: 0.05
Nodes (67): GET(), maxDuration, GET, POST, schema, metadata, StudentAlphabet(), metadata (+59 more)

### Community 1 - "Componentes UI y páginas de profesor"
Cohesion: 0.06
Nodes (69): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+61 more)

### Community 2 - "Esquema de base de datos (migraciones)"
Cohesion: 0.09
Nodes (50): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+42 more)

### Community 3 - "Editor de juegos (campos de audio/imagen)"
Cohesion: 0.11
Nodes (41): AdminGrades(), metadata, AdminHome(), metadata, Actions(), AssignedBanner(), AssignmentResults(), fmtTime() (+33 more)

### Community 4 - "Servicio de juegos y feedback"
Cohesion: 0.12
Nodes (40): BoxesBoard(), openBox(), runReview(), sleep(), State, DiagramBoard(), drop(), finishIfDone() (+32 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (42): useVoiceSession(), audioUrlsIn(), scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH (+34 more)

### Community 6 - "API, guards y rate limit"
Cohesion: 0.08
Nodes (38): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, AudioField(), audioLanguages() (+30 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.10
Nodes (41): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+33 more)

### Community 8 - "Acciones de aula, tareas y categorías"
Cohesion: 0.11
Nodes (32): ContentList(), metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata, GameLibraryPanel() (+24 more)

### Community 9 - "Plantillas y galería de plantillas"
Cohesion: 0.10
Nodes (36): EditResource(), AddContent(), metadata, ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps() (+28 more)

### Community 10 - "Sesión de usuario"
Cohesion: 0.10
Nodes (39): POST, ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), AssignState, createAssignment(), schema (+31 more)

### Community 11 - "Validación y subida de medios"
Cohesion: 0.13
Nodes (40): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+32 more)

### Community 12 - "Búsqueda de imágenes y filtro seguro"
Cohesion: 0.09
Nodes (30): POST, El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction (+22 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.12
Nodes (24): metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata, MyVideos(), ActivityMaterials() (+16 more)

### Community 14 - "Autenticación y emails"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 15 - "Formularios de contraseña"
Cohesion: 0.11
Nodes (26): PUT, POST, GET, done, POST, start, Ctx, PUT (+18 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.15
Nodes (33): DraftPreview(), ResourcePreview(), BackLink(), Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer() (+25 more)

### Community 17 - "Almacenamiento y API de medios"
Cohesion: 0.11
Nodes (27): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+19 more)

### Community 18 - "Videos (servicio y API)"
Cohesion: 0.10
Nodes (28): metadata, stepTitle(), FavoriteButton(), KindDot(), SPEAKING_LABEL, TopicCard(), AccessItem, KindPicture() (+20 more)

### Community 19 - "Texto a voz (TTS) y voces"
Cohesion: 0.09
Nodes (31): FaceEditor(), Ctx, Dict, EN, ES, UiLang, UiLangProvider(), useUi() (+23 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.12
Nodes (29): metadata, StudentTask(), metadata, StudentViewPage(), EyeIcon(), KindIcon(), LABEL, MediaThumb() (+21 more)

### Community 21 - "Campo de texto en español"
Cohesion: 0.10
Nodes (24): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), AssignTaskPage(), metadata (+16 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.08
Nodes (28): FlashcardsGameProps, GamePlayer(), PlayerProps, postJson(), StudentPlay(), Diagnostic, Feedback, Input (+20 more)

### Community 23 - "Páginas de login y contraseña"
Cohesion: 0.16
Nodes (23): react, GradeForm(), S, StudentPicker(), ConfirmEmailForm(), Roster, GameOption, Option (+15 more)

### Community 24 - "Tests e2e de seguridad y videos"
Cohesion: 0.12
Nodes (27): POST, GET, BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED (+19 more)

### Community 25 - "Shells y layouts de profesor/alumno"
Cohesion: 0.15
Nodes (12): nextConfig, securityHeaders, next, zod, POST, body, start, LT_LANG (+4 more)

### Community 26 - "Portada, privacidad y logo"
Cohesion: 0.12
Nodes (28): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+20 more)

### Community 27 - "Test e2e de videos"
Cohesion: 0.09
Nodes (30): devDependencies, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4, tsx@^4.20.5 (+22 more)

### Community 28 - "Reproductor de video"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.14
Nodes (26): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+18 more)

### Community 30 - "Scripts de package.json"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 31 - "Reconocimiento de voz (STT)"
Cohesion: 0.08
Nodes (10): COLORS, db, stamp, db, errors, stamp, db, errors (+2 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.13
Nodes (20): DiagramPoints(), Point, RowControls(), FONT_SAMPLE, FontPreview(), blankItem(), Category, contentSnapshot() (+12 more)

### Community 33 - "Corrector de español"
Cohesion: 0.14
Nodes (17): Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), metadata (+9 more)

### Community 34 - "Locutor del cliente (speaker)"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 35 - "Selector de alumno"
Cohesion: 0.17
Nodes (21): POST, schema, metadata, PlayPage(), phrasesFor(), practiceCardClips(), practicePhraseClips(), buildPlayGame() (+13 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 37 - "Generación de TTS"
Cohesion: 0.17
Nodes (14): AdminLayout(), LearnLayout(), TeacherLayout(), NavLinks(), LINKS, TeacherShell(), VerifyBanner(), Avatar() (+6 more)

### Community 38 - "Layout raíz"
Cohesion: 0.17
Nodes (21): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+13 more)

### Community 39 - "Configuración Next.js"
Cohesion: 0.19
Nodes (17): POST, POST, GET, POST, POST, EXT, FileGroup, LIBRARY_MAX_BYTES (+9 more)

### Community 40 - "Middleware"
Cohesion: 0.12
Nodes (20): metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, PREVIEW_BG (+12 more)

### Community 41 - "Configuración PostCSS"
Cohesion: 0.16
Nodes (18): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+10 more)

### Community 42 - "20261025013059_spelling_name/migration.sql"
Cohesion: 0.22
Nodes (15): acceptAdminInvite(), acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken(), sendVerificationLink(), tokenRe (+7 more)

### Community 43 - "20261025013801_support_and_endings/migration.sql"
Cohesion: 0.17
Nodes (14): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+6 more)

### Community 44 - "20261025014837_ends_question/migration.sql"
Cohesion: 0.19
Nodes (19): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword(), resetSchema (+11 more)

### Community 45 - "20261025015628_game_language_default/migration.sql"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 46 - "20261025031956_templates_v2/migration.sql"
Cohesion: 0.22
Nodes (15): POST, POST, POST, POST, GET, GET, POST, HttpError (+7 more)

### Community 47 - "Drivers de almacenamiento"
Cohesion: 0.20
Nodes (16): b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress(), Provider (+8 more)

### Community 48 - "Script de arranque de Graphify"
Cohesion: 0.18
Nodes (13): server-only, POST, schema, requireStudent(), destroySession(), getSessionUser, hashToken(), openSteps() (+5 more)

### Community 49 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 50 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+10 more)

### Community 51 - "webhook.ts"
Cohesion: 0.21
Nodes (13): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+5 more)

### Community 52 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 53 - "audit"
Cohesion: 0.22
Nodes (15): POST, createCategory(), deleteCategory(), names, updateCategory(), addToCollection(), createCollection(), deleteCollection() (+7 more)

### Community 54 - "VideoPlayer.tsx"
Cohesion: 0.17
Nodes (12): metadata, WatchPage(), Report, StudentWatch(), fmt(), loadYouTubeApi(), ProgressReport, SPEEDS (+4 more)

### Community 55 - "games.ts"
Cohesion: 0.21
Nodes (14): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, schoolGame() (+6 more)

### Community 56 - "ActivitySettings.tsx"
Cohesion: 0.19
Nodes (16): ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section (+8 more)

### Community 57 - "templates.e2e.mjs"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 58 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 59 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 60 - "VideoForm.tsx"
Cohesion: 0.24
Nodes (10): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), VideoFormValue (+2 more)

### Community 61 - "ref_node_fs"
Cohesion: 0.13
Nodes (6): errors, NAMES, stamp, db, dir, plan

### Community 62 - "playwright"
Cohesion: 0.14
Nodes (5): stamp, resetLinkFromLog(), sleep(), stamp, playwright

### Community 63 - "preview/[id]/page.tsx"
Cohesion: 0.21
Nodes (11): metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole (+3 more)

### Community 64 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 65 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 66 - "AlphabetExplorer.tsx"
Cohesion: 0.22
Nodes (9): AlphabetExplorer(), Config, FeedbackBubble(), MicIndicator(), ALPHABET, Letter, LETTER_STYLES, letterName() (+1 more)

### Community 67 - "roster.ts"
Cohesion: 0.26
Nodes (12): addStudentList(), capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList() (+4 more)

### Community 68 - "automatic.ts"
Cohesion: 0.34
Nodes (10): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, Rendered (+2 more)

### Community 69 - ""TopicPlan""
Cohesion: 0.19
Nodes (6): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key

### Community 70 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 71 - "games/types.ts"
Cohesion: 0.17
Nodes (9): vitest, EditorGame, EditorItem, EditorQuestion, FaceData, ItemData, Lang, SpellTarget (+1 more)

### Community 72 - "attempts/service.ts"
Cohesion: 0.27
Nodes (10): isVoice(), questionResult(), questionStatus(), R, finishedQuestions(), assignmentReport(), assignmentStudents(), StudentRow (+2 more)

### Community 73 - "flashcards.e2e.mjs"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 74 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 75 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 76 - "appUrl"
Cohesion: 0.40
Nodes (8): stripe@^17.7.0, stripe, POST, POST, billingConfigured(), isLiveKey(), stripe(), appUrl()

### Community 77 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 78 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 79 - "library/seed.ts"
Cohesion: 0.27
Nodes (8): db, main(), CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary(), TOPIC_DESCRIPTION

### Community 80 - "sample/route.ts"
Cohesion: 0.24
Nodes (9): Ctx, GET, PUT, CARDS, GET(), maxDuration, saveEditorGame(), saveSchema (+1 more)

### Community 83 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 84 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 85 - "build-accent-maps.mjs"
Cohesion: 0.28
Nodes (8): dictionary-en@^4.0.0, dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-en, dictionary-fr, build(), strip(), words()

### Community 87 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 88 - "youtubeIdFrom"
Cohesion: 0.32
Nodes (7): LinkPreview(), embedFor(), fileIdsOf(), KINDS, linkRef, publicUrl(), youtubeIdFrom()

### Community 90 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 91 - "email.ts"
Cohesion: 0.52
Nodes (6): canSendEmail(), consoleDriver(), Email, emailConfigured(), randomRef(), sendEmail()

### Community 92 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 93 - "templateByKey"
Cohesion: 0.60
Nodes (4): EditGame(), metadata, GameEditor(), templateByKey()

### Community 94 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 95 - "DeleteAssignmentButton.tsx"
Cohesion: 0.67
Nodes (3): DeleteAssignmentButton(), Submit(), deleteAssignment()

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Páginas de login y contraseña` to `Reproductor de juegos y sesión de voz`, `Componentes UI y páginas de profesor`, `Esquema de base de datos (migraciones)`, `Editor de juegos (campos de audio/imagen)`, `Servicio de juegos y feedback`, `API, guards y rate limit`, `Micrófono y detección de voz (VAD)`, `Acciones de aula, tareas y categorías`, `Plantillas y galería de plantillas`, `Búsqueda de imágenes y filtro seguro`, `Dependencias (package.json)`, `Segmentación de texto`, `Almacenamiento y API de medios`, `Videos (servicio y API)`, `Texto a voz (TTS) y voces`, `Configuración TypeScript`, `Campo de texto en español`, `Tests e2e de plantillas`, `Portada, privacidad y logo`, `Test e2e de videos`, `Tests e2e de flashcards`, `Dependencias de desarrollo`, `Corrector de español`, `Generación de TTS`, `Middleware`, `Configuración PostCSS`, `Script de arranque de Graphify`, `dependencies`, `VideoPlayer.tsx`, `games.ts`, `ActivitySettings.tsx`, `VideoForm.tsx`, `preview/[id]/page.tsx`, `AlphabetExplorer.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Should `Reproductor de juegos y sesión de voz` be split into smaller, more focused modules?**
  _Cohesion score 0.0502497796062298 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Shells y layouts de profesor/alumno` to `Reproductor de juegos y sesión de voz`, `Esquema de base de datos (migraciones)`, `Editor de juegos (campos de audio/imagen)`, `Acciones de aula, tareas y categorías`, `Plantillas y galería de plantillas`, `Sesión de usuario`, `Validación y subida de medios`, `Dependencias (package.json)`, `Formularios de contraseña`, `Segmentación de texto`, `Almacenamiento y API de medios`, `Videos (servicio y API)`, `Configuración TypeScript`, `Campo de texto en español`, `Páginas de login y contraseña`, `Tests e2e de seguridad y videos`, `Test e2e de videos`, `Tests e2e de flashcards`, `Dependencias de desarrollo`, `Corrector de español`, `Selector de alumno`, `Generación de TTS`, `Layout raíz`, `Configuración Next.js`, `20261025013059_spelling_name/migration.sql`, `20261025013801_support_and_endings/migration.sql`, `20261025014837_ends_question/migration.sql`, `20261025031956_templates_v2/migration.sql`, `Script de arranque de Graphify`, `dependencies`, `webhook.ts`, `audit`, `VideoPlayer.tsx`, `games.ts`, `ActivitySettings.tsx`, `VideoForm.tsx`, `preview/[id]/page.tsx`, `appUrl`, `sample/route.ts`, `app/layout.tsx`, `templateByKey`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Should `Componentes UI y páginas de profesor` be split into smaller, more focused modules?**
  _Cohesion score 0.0645933014354067 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `Reconocimiento de voz (STT)` to `Validación y subida de medios`, `Dependencias (package.json)`, `Formularios de contraseña`, `Test e2e de videos`, `Scripts de package.json`, `Selector de alumno`, `20261025015628_game_language_default/migration.sql`, `Script de arranque de Graphify`, `dependencies`, `webhook.ts`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `ref_node_fs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `automatic.ts`, `flashcards-printables.e2e.mjs`, `attempts/service.ts`, `library/seed.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `Esquema de base de datos (migraciones)` be split into smaller, more focused modules?**
  _Cohesion score 0.08754208754208755 - nodes in this community are weakly interconnected._
- **Should `Editor de juegos (campos de audio/imagen)` be split into smaller, more focused modules?**
  _Cohesion score 0.10831586303284417 - nodes in this community are weakly interconnected._