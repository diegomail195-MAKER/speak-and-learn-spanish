# Graph Report - speak-and-learn-spanish  (2026-11-19)

## Corpus Check
- 350 files · ~209,614 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2322 nodes · 7066 edges · 103 communities (90 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `414f4fe6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.ts
- tts/index.ts
- MyActivitiesBoard.tsx
- Button
- evaluate.ts
- library/types.ts
- google.ts
- topics/[id]/page.tsx
- library/service.ts
- classroom.ts
- next
- PageHeader
- audit
- MicSession
- auth.ts
- search.ts
- GameEditor.tsx
- package.json
- segments.ts
- games/service.ts
- @prisma/client
- mediaUrl
- 20261025012814_init/migration.sql
- teacher/library/page.tsx
- autocorrect.ts
- webhook.ts
- lextro.e2e.mjs
- HttpError
- parts.tsx
- plainText
- 20261113220000_laxtrospeak_library/migration.sql
- AuthLayout
- Players.tsx
- TopicHero.tsx
- useVoiceSession.ts
- teacher/videos/page.tsx
- folders.e2e.mjs
- flow.e2e.mjs
- db.ts
- plainText
- GroupForm.tsx
- preview/[id]/page.tsx
- GamePlayer.tsx
- my-activities.e2e.mjs
- photo-form.e2e.mjs
- RosterRow.tsx
- DiagramBoard.tsx
- reports.ts
- requireTeacher
- FlashcardParts.tsx
- TopicLesson.tsx
- compilerOptions
- dependencies
- templates.e2e.mjs
- verify.ts
- emails/templates.ts
- "public"."School"
- Panel
- ref_node_path
- assignments/page.tsx
- library-header.e2e.mjs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- VideoForm
- AudioPanel
- flashcards-printables.e2e.mjs
- flashcards.e2e.mjs
- "public"."MediaAsset"
- "public"."User"
- ImageField.tsx
- topic-hero.e2e.mjs
- scripts
- "public"."Game"
- ActivitySettings.tsx
- CLAUDE.md
- Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity
- email.ts
- TopicPlanEditor.tsx
- StorageDriver
- eslint.config.mjs
- "TopicPlan"
- Publicar en internet (Supabase + Vercel)
- build-accent-maps.mjs
- "public"."Topic"
- RosterRow.tsx
- app/layout.tsx
- LextroSpeak
- Student privacy & security notes
- Typography
- html-to-image
- vercel.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 125 edges
2. `HttpError` - 101 edges
3. `db` - 97 edges
4. `Button()` - 92 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 85 edges
7. `react` - 74 edges
8. `PageHeader()` - 56 edges
9. `requireTeacherPage()` - 55 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `Segment` --references--> `AudioLanguage`  [EXTRACTED]
  src/lib/text/segments.ts → src/lib/tts/voices.ts
- `MetaForm()` --indirect_call--> `updateResourceMeta()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts

## Import Cycles
- None detected.

## Communities (103 total, 13 thin omitted)

### Community 0 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 1 - "tts/index.ts"
Cohesion: 0.06
Nodes (48): vitest, GET(), maxDuration, metadata, StudentAlphabet(), poolerSafeUrl(), env, azure() (+40 more)

### Community 2 - "MyActivitiesBoard.tsx"
Cohesion: 0.05
Nodes (72): metadata, NewGame(), metadata, Search, CreateButton(), FEATURED, Oral(), TemplateGallery() (+64 more)

### Community 3 - "Button"
Cohesion: 0.14
Nodes (21): CategoriesPage(), metadata, Bar(), ClassPage(), ClassesPage(), metadata, GradeForm(), AcceptInviteForm() (+13 more)

### Community 4 - "evaluate.ts"
Cohesion: 0.10
Nodes (41): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+33 more)

### Community 5 - "library/types.ts"
Cohesion: 0.08
Nodes (47): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+39 more)

### Community 6 - "google.ts"
Cohesion: 0.16
Nodes (20): GET, PROBES, searchCommons(), searchCommonsDetailed(), b64(), googleMissing(), GooglePhoto, googleProvider() (+12 more)

### Community 7 - "topics/[id]/page.tsx"
Cohesion: 0.12
Nodes (32): ManageActivities(), metadata, AdminTopics(), metadata, GameLibraryPanel(), AddResult, LibraryPicker(), PickedResources() (+24 more)

### Community 8 - "library/service.ts"
Cohesion: 0.12
Nodes (23): StudentActivityPage(), ActivityMaterials(), metadata, StudentActivity(), TopicLessonProps, recordActivityProgress(), finishedQuestions(), SessionUser (+15 more)

### Community 9 - "classroom.ts"
Cohesion: 0.09
Nodes (44): AddListForm(), Roster, ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), createAssignment(), addStudentList() (+36 more)

### Community 10 - "next"
Cohesion: 0.13
Nodes (17): nextConfig, securityHeaders, next, zod, POST, POST, POST, body (+9 more)

### Community 11 - "PageHeader"
Cohesion: 0.14
Nodes (24): AdminHome(), metadata, metadata, TeacherAlphabet(), metadata, NewAssignment(), metadata, TopicLessonPage() (+16 more)

### Community 12 - "audit"
Cohesion: 0.14
Nodes (38): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+30 more)

### Community 13 - "MicSession"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 14 - "auth.ts"
Cohesion: 0.12
Nodes (29): ForgotPasswordPage(), metadata, dynamic, metadata, ResetPasswordPage(), ForgotPasswordForm(), Notice(), ResetPasswordForm() (+21 more)

### Community 15 - "search.ts"
Cohesion: 0.06
Nodes (53): cache, CardFace, CardPhotoForm(), LANG, Photo, SIDE, Slot, API() (+45 more)

### Community 16 - "GameEditor.tsx"
Cohesion: 0.08
Nodes (33): EditGame(), metadata, DiagramPoints(), blankItem(), Category, contentSnapshot(), editorState(), GameEditor() (+25 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 18 - "segments.ts"
Cohesion: 0.11
Nodes (29): Point, LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept() (+21 more)

### Community 19 - "games/service.ts"
Cohesion: 0.11
Nodes (39): POST, schema, GET, CARDS, GET(), maxDuration, createGame(), phrasesFor() (+31 more)

### Community 20 - "@prisma/client"
Cohesion: 0.16
Nodes (11): COLORS, db, stamp, db, main(), @prisma/client, CATEGORY, SEED_CHANT (+3 more)

### Community 21 - "mediaUrl"
Cohesion: 0.11
Nodes (31): POST, PUT, GET, POST, POST, done, POST, start (+23 more)

### Community 22 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 23 - "teacher/library/page.tsx"
Cohesion: 0.29
Nodes (9): BAND, LEGACY, LibraryPage(), metadata, GRADE_FILTERS, GradeFilter, LibraryHeader(), libraryTopics() (+1 more)

### Community 24 - "autocorrect.ts"
Cohesion: 0.10
Nodes (29): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+21 more)

### Community 25 - "webhook.ts"
Cohesion: 0.16
Nodes (18): stripe, POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), isLiveKey(), PLAN_NAME() (+10 more)

### Community 26 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 27 - "HttpError"
Cohesion: 0.14
Nodes (26): POST, POST, POST, GET, POST, GET, POST, POST (+18 more)

### Community 28 - "parts.tsx"
Cohesion: 0.11
Nodes (27): AlphabetExplorer(), BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep() (+19 more)

### Community 29 - "plainText"
Cohesion: 0.19
Nodes (19): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+11 more)

### Community 30 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 31 - "AuthLayout"
Cohesion: 0.14
Nodes (18): AdminInvitePage(), dynamic, metadata, LoginPage(), metadata, metadata, SignupPage(), dynamic (+10 more)

### Community 32 - "Players.tsx"
Cohesion: 0.17
Nodes (30): DraftPreview(), ResourcePreview(), BackLink(), Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer() (+22 more)

### Community 33 - "TopicHero.tsx"
Cohesion: 0.10
Nodes (32): TopicPage(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover() (+24 more)

### Community 34 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (22): react, Config, Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), ALPHABET (+14 more)

### Community 35 - "teacher/videos/page.tsx"
Cohesion: 0.18
Nodes (15): GamesPage(), metadata, metadata, fmt(), metadata, VideosPage(), ActivityFilters(), ActivityList() (+7 more)

### Community 36 - "folders.e2e.mjs"
Cohesion: 0.19
Nodes (8): COLORS, db, dialog(), openEdit(), saveAndWait(), stamp, tile(), tileColor()

### Community 37 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 38 - "db.ts"
Cohesion: 0.10
Nodes (35): server-only, POST, schema, Ctx, PUT, POST, metadata, MyActivities() (+27 more)

### Community 39 - "plainText"
Cohesion: 0.17
Nodes (22): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+14 more)

### Community 40 - "GroupForm.tsx"
Cohesion: 0.18
Nodes (13): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+5 more)

### Community 41 - "preview/[id]/page.tsx"
Cohesion: 0.19
Nodes (12): metadata, PlayPage(), metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename() (+4 more)

### Community 42 - "GamePlayer.tsx"
Cohesion: 0.21
Nodes (14): sleep(), SpellBoard(), submit(), GamePlayer(), needsMic(), PlayerProps, VoiceGamePlayer(), PlayerFrame() (+6 more)

### Community 44 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 45 - "RosterRow.tsx"
Cohesion: 0.07
Nodes (45): react-dom@19.1.0, react-dom, AdminLayout(), LearnLayout(), metadata, Privacy(), ClassLogin(), metadata (+37 more)

### Community 46 - "DiagramBoard.tsx"
Cohesion: 0.23
Nodes (14): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), MatchBoard(), done(), drop() (+6 more)

### Community 47 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 48 - "requireTeacher"
Cohesion: 0.12
Nodes (30): POST, Ctx, GET, PUT, POST, POST, POST, AssignState (+22 more)

### Community 49 - "FlashcardParts.tsx"
Cohesion: 0.10
Nodes (30): AudioField(), stopFaceAudio(), PhotoBox(), upload(), SearchPanel(), FaceEditor(), onPaste(), FlashcardPreview() (+22 more)

### Community 50 - "TopicLesson.tsx"
Cohesion: 0.14
Nodes (22): metadata, StudentTask(), metadata, StudentViewPage(), EyeIcon(), ICON, KindIcon(), LABEL (+14 more)

### Community 51 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 52 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+9 more)

### Community 53 - "templates.e2e.mjs"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 54 - "verify.ts"
Cohesion: 0.29
Nodes (11): acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken(), sendVerificationLink(), tokenRe, promoteVerified() (+3 more)

### Community 55 - "emails/templates.ts"
Cohesion: 0.41
Nodes (10): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, Rendered (+2 more)

### Community 56 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 57 - "Panel"
Cohesion: 0.14
Nodes (25): AddContent(), metadata, ContentList(), metadata, STATUS, AdminGrades(), metadata, Actions() (+17 more)

### Community 58 - "ref_node_path"
Cohesion: 0.08
Nodes (8): errors, NAMES, stamp, errors, stamp, db, dir, plan

### Community 59 - "assignments/page.tsx"
Cohesion: 0.29
Nodes (8): AssignmentsPage(), ICON, Kind, KINDS, metadata, recipientLabel(), DeleteAssignmentButton(), Submit()

### Community 60 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 61 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 62 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 63 - "playwright"
Cohesion: 0.15
Nodes (6): errors, stamp, resetLinkFromLog(), sleep(), stamp, playwright

### Community 64 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 65 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 66 - "VideoForm"
Cohesion: 0.26
Nodes (9): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage() (+1 more)

### Community 67 - "AudioPanel"
Cohesion: 0.08
Nodes (30): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, audioLanguages(), AudioPanel() (+22 more)

### Community 68 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 69 - "flashcards.e2e.mjs"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 70 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 71 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 72 - "ImageField.tsx"
Cohesion: 0.23
Nodes (11): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+3 more)

### Community 74 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 75 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 76 - "ActivitySettings.tsx"
Cohesion: 0.08
Nodes (35): FONT_SAMPLE, FontPreview(), ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS (+27 more)

### Community 78 - "Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity"
Cohesion: 0.20
Nodes (9): Built, not covered by automated tests, Create Activity & multilingual voice (`e2e/templates.e2e.mjs`), Hosting on Supabase + Vercel (`docs/DEPLOY.md`), Needs credentials / configuration, Next phases, Not tested yet (must be done before classroom use), Phase 2 — video library (`e2e/videos.e2e.mjs`), Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity (+1 more)

### Community 79 - "email.ts"
Cohesion: 0.52
Nodes (6): canSendEmail(), consoleDriver(), Email, emailConfigured(), randomRef(), sendEmail()

### Community 80 - "TopicPlanEditor.tsx"
Cohesion: 0.22
Nodes (5): ICON, KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 84 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 86 - ""TopicPlan""
Cohesion: 0.24
Nodes (5): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx

### Community 87 - "Publicar en internet (Supabase + Vercel)"
Cohesion: 0.25
Nodes (7): 1. Supabase, 2. Vercel, Buscar imágenes en internet (con filtro infantil), Correo para "¿Olvidaste tu contraseña?", Límites conocidos en Vercel, Publicar en internet (Supabase + Vercel), Solo el administrador sube videos

### Community 89 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "RosterRow.tsx"
Cohesion: 0.19
Nodes (15): metadata, RosterPage(), AddStudentPage(), metadata, Progress(), ROSTER_COLS, RosterHeader(), RosterRow() (+7 more)

### Community 93 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 94 - "LextroSpeak"
Cohesion: 0.33
Nodes (5): How the oral activity works, LextroSpeak, Project map, Run locally, Stack

### Community 95 - "Student privacy & security notes"
Cohesion: 0.40
Nodes (4): Implemented, Pending (needs decisions / legal review), Student privacy & security notes, Third parties that receive data (document in the school's vendor list)

### Community 96 - "Typography"
Cohesion: 0.40
Nodes (4): How it is set up, Licence status, To use authentic Century Gothic everywhere, Typography

### Community 97 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

### Community 99 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useVoiceSession.ts` to `layout.ts`, `MyActivitiesBoard.tsx`, `Button`, `library/types.ts`, `topics/[id]/page.tsx`, `library/service.ts`, `classroom.ts`, `PageHeader`, `auth.ts`, `search.ts`, `GameEditor.tsx`, `package.json`, `segments.ts`, `teacher/library/page.tsx`, `autocorrect.ts`, `parts.tsx`, `plainText`, `AuthLayout`, `Players.tsx`, `TopicHero.tsx`, `teacher/videos/page.tsx`, `db.ts`, `plainText`, `GroupForm.tsx`, `preview/[id]/page.tsx`, `GamePlayer.tsx`, `RosterRow.tsx`, `DiagramBoard.tsx`, `FlashcardParts.tsx`, `TopicLesson.tsx`, `dependencies`, `Panel`, `AudioPanel`, `ImageField.tsx`, `ActivitySettings.tsx`, `TopicPlanEditor.tsx`, `RosterRow.tsx`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062317429406037 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `tts/index.ts`, `MyActivitiesBoard.tsx`, `Button`, `library/types.ts`, `google.ts`, `topics/[id]/page.tsx`, `library/service.ts`, `classroom.ts`, `PageHeader`, `audit`, `auth.ts`, `GameEditor.tsx`, `package.json`, `games/service.ts`, `mediaUrl`, `teacher/library/page.tsx`, `webhook.ts`, `HttpError`, `AuthLayout`, `Players.tsx`, `TopicHero.tsx`, `teacher/videos/page.tsx`, `db.ts`, `GroupForm.tsx`, `preview/[id]/page.tsx`, `RosterRow.tsx`, `requireTeacher`, `TopicLesson.tsx`, `dependencies`, `verify.ts`, `Panel`, `assignments/page.tsx`, `VideoForm`, `ActivitySettings.tsx`, `TopicPlanEditor.tsx`, `RosterRow.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `tts/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058699101004759384 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `@prisma/client` to `library/service.ts`, `next`, `audit`, `package.json`, `games/service.ts`, `mediaUrl`, `webhook.ts`, `lextro.e2e.mjs`, `folders.e2e.mjs`, `db.ts`, `photo-form.e2e.mjs`, `reports.ts`, `dependencies`, `ref_node_path`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `MyActivitiesBoard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05359831376091539 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.13911290322580644 - nodes in this community are weakly interconnected._