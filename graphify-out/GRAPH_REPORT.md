# Graph Report - speak-and-learn-spanish  (2026-11-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1095 nodes · 3235 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e6d0467`
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
- Drivers de almacenamiento
- Script de arranque de Graphify

## God Nodes (most connected - your core abstractions)
1. `next` - 65 edges
2. `HttpError` - 59 edges
3. `requireTeacher()` - 52 edges
4. `Button()` - 51 edges
5. `db` - 50 edges
6. `audit()` - 43 edges
7. `react` - 38 edges
8. `requireTeacherPage()` - 35 edges
9. `PageHeader()` - 34 edges
10. `GameEditorInner()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `TeacherSignInForm()` --indirect_call--> `signInTeacher()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts
- `TeacherSignUpForm()` --indirect_call--> `signUpTeacher()`  [INFERRED]
  src/components/auth/AuthForms.tsx → src/lib/actions/auth.ts
- `AssignForm()` --indirect_call--> `createAssignment()`  [INFERRED]
  src/components/teacher/AssignForm.tsx → src/lib/actions/assignments.ts
- `AddStudentForm()` --indirect_call--> `createStudent()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts
- `ResetPinButton()` --indirect_call--> `resetStudentPin()`  [INFERRED]
  src/components/teacher/StudentForms.tsx → src/lib/actions/classroom.ts

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "Reproductor de juegos y sesión de voz"
Cohesion: 0.06
Nodes (80): react, AlphabetExplorer(), Config, Point, BoxesBoard(), openBox(), runReview(), sleep() (+72 more)

### Community 1 - "Componentes UI y páginas de profesor"
Cohesion: 0.06
Nodes (84): metadata, MyVideos(), metadata, TeacherAlphabet(), Actions(), AssignmentResults(), fmtTime(), metadata (+76 more)

### Community 2 - "Esquema de base de datos (migraciones)"
Cohesion: 0.06
Nodes (72): AcceptedAnswer_questionId_idx, Assignment_schoolId_active_idx, AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, AudioAsset_schoolId_cacheKey_key (+64 more)

### Community 3 - "Editor de juegos (campos de audio/imagen)"
Cohesion: 0.06
Nodes (57): AudioControl(), TtsConfig, AUDIO_LANGUAGES, AudioField(), AudioPanel(), previewTts(), save(), playFaceAudio() (+49 more)

### Community 4 - "Servicio de juegos y feedback"
Cohesion: 0.06
Nodes (43): Ctx, GET, PUT, metadata, MyActivities(), metadata, MyProgress(), metadata (+35 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.11
Nodes (38): scoreTurn(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters(), evaluateTyped() (+30 more)

### Community 6 - "API, guards y rate limit"
Cohesion: 0.20
Nodes (15): next, zod, schema, GET, POST, LT_LANG, schema, POST (+7 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.08
Nodes (13): vitest, ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad (+5 more)

### Community 8 - "Acciones de aula, tareas y categorías"
Cohesion: 0.11
Nodes (44): POST, POST, ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), schoolGame(), AssignState (+36 more)

### Community 9 - "Plantillas y galería de plantillas"
Cohesion: 0.10
Nodes (31): db, @prisma/client, metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery() (+23 more)

### Community 10 - "Sesión de usuario"
Cohesion: 0.39
Nodes (7): ActivityIllustration(), Home(), createSession(), destroySession(), getSessionUser, hashToken(), SessionUser

### Community 11 - "Validación y subida de medios"
Cohesion: 0.17
Nodes (22): POST, POST, GET, POST, POST, done, POST, start (+14 more)

### Community 12 - "Búsqueda de imágenes y filtro seguro"
Cohesion: 0.12
Nodes (25): GET, BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED, RANK (+17 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.10
Nodes (25): devDependencies, eslint@^9, eslint-config-next@15.5.29, tailwindcss@^4, @tailwindcss/postcss@^4, tsx@^4.20.5, @types/node@^20, @types/react@^19 (+17 more)

### Community 14 - "Autenticación y emails"
Cohesion: 0.16
Nodes (20): escapeHtml(), forgotSchema, FormState, loginSchema, requestPasswordReset(), resetSchema, sendResetLink(), signInTeacher() (+12 more)

### Community 15 - "Formularios de contraseña"
Cohesion: 0.23
Nodes (12): dynamic, metadata, ResetPasswordPage(), Notice(), ResetPasswordForm(), inputClass, Eye(), EyeOff() (+4 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.17
Nodes (19): LanguageTools(), markSelection(), ALSO_SPANISH, clearTags(), EN, ES_HINT, FR, FUNCTION_WORDS (+11 more)

### Community 17 - "Almacenamiento y API de medios"
Cohesion: 0.21
Nodes (10): server-only, GET, bodyToTempFile(), keyRole(), local, root, storage(), StorageConfigError (+2 more)

### Community 18 - "Videos (servicio y API)"
Cohesion: 0.18
Nodes (20): POST, POST, POST, POST, schema, Ctx, PUT, POST (+12 more)

### Community 19 - "Texto a voz (TTS) y voces"
Cohesion: 0.20
Nodes (15): azure(), azureSsml(), escapeXml(), google(), googlePart(), joinPcm(), synthesize(), TtsPart (+7 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "Campo de texto en español"
Cohesion: 0.14
Nodes (16): BarContext, CharButtons(), CHARS, FR_CHARS, Inserter, LANG_TONE, Props, SHORT (+8 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "Páginas de login y contraseña"
Cohesion: 0.27
Nodes (8): ForgotPasswordPage(), metadata, LoginPage(), metadata, metadata, SignupPage(), ForgotPasswordForm(), AuthLayout()

### Community 24 - "Tests e2e de seguridad y videos"
Cohesion: 0.15
Nodes (8): addImage(), fx(), stamp, resetLinkFromLog(), sleep(), stamp, playwright@^1.63.0, playwright

### Community 25 - "Shells y layouts de profesor/alumno"
Cohesion: 0.22
Nodes (11): LearnLayout(), NavLinks(), LINKS, TeacherShell(), Avatar(), AvatarKey, AVATARS, colors (+3 more)

### Community 26 - "Portada, privacidad y logo"
Cohesion: 0.32
Nodes (5): metadata, Privacy(), metadata, StudentStart(), PublicHeader()

### Community 27 - "Test e2e de videos"
Cohesion: 0.29
Nodes (3): addImage(), fx(), stamp

### Community 28 - "Reproductor de video"
Cohesion: 0.17
Nodes (12): metadata, WatchPage(), Report, StudentWatch(), fmt(), loadYouTubeApi(), ProgressReport, SPEEDS (+4 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.17
Nodes (12): dependencies, bcryptjs@^3.0.2, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0, server-only@^0.0.1 (+4 more)

### Community 31 - "Reconocimiento de voz (STT)"
Cohesion: 0.22
Nodes (10): metadata, StudentAlphabet(), azure(), google(), LETTER_HINTS, recognize(), scripted(), sttLocale() (+2 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.20
Nodes (10): scripts, build, db:migrate, db:seed, dev, lint, start, test (+2 more)

### Community 33 - "Corrector de español"
Cohesion: 0.27
Nodes (8): POST, ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 34 - "Locutor del cliente (speaker)"
Cohesion: 0.29
Nodes (7): loadBrowserVoices(), pickBrowserVoice(), Speaker, Segment, TagProposal, AppLanguage, BROWSER_LOCALES

### Community 35 - "Selector de alumno"
Cohesion: 0.36
Nodes (6): ClassLogin(), metadata, S, StudentPicker(), signInStudent(), studentLockMinutes()

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "Generación de TTS"
Cohesion: 0.48
Nodes (6): GET, ensureAudio(), VoiceChoice, ttsCacheKey(), ttsProvider(), voicesFor()

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): body, display, metadata, viewport

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Reproductor de juegos y sesión de voz` to `Componentes UI y páginas de profesor`, `Selector de alumno`, `Editor de juegos (campos de audio/imagen)`, `Plantillas y galería de plantillas`, `Sesión de usuario`, `Dependencias (package.json)`, `Formularios de contraseña`, `Campo de texto en español`, `Páginas de login y contraseña`, `Shells y layouts de profesor/alumno`, `Reproductor de video`, `Scripts de package.json`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Should `Reproductor de juegos y sesión de voz` be split into smaller, more focused modules?**
  _Cohesion score 0.05937266616878267 - nodes in this community are weakly interconnected._
- **Why does `next` connect `API, guards y rate limit` to `Componentes UI y páginas de profesor`, `Selector de alumno`, `Servicio de juegos y feedback`, `Editor de juegos (campos de audio/imagen)`, `Layout raíz`, `Configuración Next.js`, `Acciones de aula, tareas y categorías`, `Middleware`, `Sesión de usuario`, `Validación y subida de medios`, `Dependencias (package.json)`, `Autenticación y emails`, `Formularios de contraseña`, `Videos (servicio y API)`, `Shells y layouts de profesor/alumno`, `Portada, privacidad y logo`, `Reproductor de video`, `Scripts de package.json`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `Componentes UI y páginas de profesor` be split into smaller, more focused modules?**
  _Cohesion score 0.06101949025487256 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Componentes UI y páginas de profesor` to `Reproductor de juegos y sesión de voz`, `Selector de alumno`, `Editor de juegos (campos de audio/imagen)`, `Formularios de contraseña`, `Páginas de login y contraseña`, `Portada, privacidad y logo`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Esquema de base de datos (migraciones)` be split into smaller, more focused modules?**
  _Cohesion score 0.05964912280701754 - nodes in this community are weakly interconnected._
- **Should `Editor de juegos (campos de audio/imagen)` be split into smaller, more focused modules?**
  _Cohesion score 0.05837837837837838 - nodes in this community are weakly interconnected._