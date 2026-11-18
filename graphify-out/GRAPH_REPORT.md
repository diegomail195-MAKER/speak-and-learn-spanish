# Graph Report - speak-and-learn-spanish  (2026-11-18)

## Corpus Check
- 335 files · ~199,320 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2232 nodes · 6834 edges · 111 communities (98 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52a5dafd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.ts
- tts/index.ts
- MyActivitiesBoard.tsx
- Button
- evaluate.ts
- library/types.ts
- commons.ts
- topics/[id]/page.tsx
- library/service.ts
- classroom.ts
- next
- PageHeader
- audit
- MicSession
- voices.ts
- search.ts
- GameEditor.tsx
- package.json
- segments.ts
- games/service.ts
- lib/videos.ts
- mediaUrl
- 20261025012814_init/migration.sql
- FlashcardParts.tsx
- autocorrect.ts
- verify.ts
- lextro.e2e.mjs
- HttpError
- parts.tsx
- plainText
- 20261113220000_laxtrospeak_library/migration.sql
- AuthLayout
- Players.tsx
- TopicHero.tsx
- useVoiceSession.ts
- storage/index.ts
- assignments/page.tsx
- flow.e2e.mjs
- db.ts
- ActivitySettings.tsx
- FlashcardsGame.tsx
- auth.ts
- session.ts
- SpellBoard.tsx
- photo-form.e2e.mjs
- TeacherShell.tsx
- games/templates.ts
- games/types.ts
- requireTeacher
- CardPhotoForm.tsx
- TopicLesson.tsx
- compilerOptions
- dependencies
- @prisma/client
- ResourcePlayer
- preview/[id]/page.tsx
- "public"."School"
- Badge
- ref_node_fs
- ref_node_path
- templates.e2e.mjs
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
- ImageEditor.tsx
- emails/templates.ts
- scripts
- "public"."Game"
- library/seed.ts
- teacher/videos/page.tsx
- Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity
- ActivityList.tsx
- TopicPlanEditor.tsx
- VideoPlayer.tsx
- StorageDriver
- image-editor.e2e.mjs
- eslint.config.mjs
- spanish-check.ts
- "TopicPlan"
- Publicar en internet (Supabase + Vercel)
- my-activities.e2e.mjs
- build-accent-maps.mjs
- "public"."Topic"
- classes/[id]/page.tsx
- actions/tasks.ts
- app/layout.tsx
- LextroSpeak
- Student privacy & security notes
- Typography
- html-to-image
- MatchBoard.tsx
- vercel.json
- next.config.ts
- middleware.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 120 edges
2. `HttpError` - 99 edges
3. `db` - 95 edges
4. `Button()` - 90 edges
5. `audit()` - 85 edges
6. `requireTeacher()` - 83 edges
7. `react` - 66 edges
8. `PageHeader()` - 58 edges
9. `requireTeacherPage()` - 53 edges
10. `Panel()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GameEditorInner()` --indirect_call--> `swapItem()`  [INFERRED]
  src/components/editor/GameEditor.tsx → src/components/editor/FlashcardParts.tsx
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts
- `DeleteButton()` --indirect_call--> `deleteResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `PublishButton()` --indirect_call--> `publishResource()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts

## Import Cycles
- None detected.

## Communities (111 total, 13 thin omitted)

### Community 0 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 1 - "tts/index.ts"
Cohesion: 0.06
Nodes (52): @vercel/oidc@4.0.5, @vercel/oidc, GET(), maxDuration, GET, metadata, StudentAlphabet(), metadata (+44 more)

### Community 2 - "MyActivitiesBoard.tsx"
Cohesion: 0.07
Nodes (56): metadata, MyActivitiesPage(), Search, Boxes(), C, Diagram(), Flashcards(), Generic() (+48 more)

### Community 3 - "Button"
Cohesion: 0.12
Nodes (43): react, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm() (+35 more)

### Community 4 - "evaluate.ts"
Cohesion: 0.09
Nodes (44): vitest, poolerSafeUrl(), scoreTurn(), env, say(), AnswerSpec, CARRIERS, cleanTyped() (+36 more)

### Community 5 - "library/types.ts"
Cohesion: 0.08
Nodes (45): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+37 more)

### Community 6 - "commons.ts"
Cohesion: 0.09
Nodes (39): GET, PROBES, API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS() (+31 more)

### Community 7 - "topics/[id]/page.tsx"
Cohesion: 0.12
Nodes (33): metadata, STATUS, ManageActivities(), metadata, AdminTopics(), metadata, LibraryPage(), metadata (+25 more)

### Community 8 - "library/service.ts"
Cohesion: 0.09
Nodes (31): metadata, StudentTask(), metadata, TopicLessonPage(), TopicPage(), metadata, StudentViewPage(), AssignTaskPage() (+23 more)

### Community 9 - "classroom.ts"
Cohesion: 0.09
Nodes (37): AddListForm(), Roster, ownedClassroom(), addStudentList(), checkMembers(), createClassroom(), createGroup(), createGroupWithMembers() (+29 more)

### Community 10 - "next"
Cohesion: 0.13
Nodes (18): next, server-only, zod, schema, POST, POST, Ctx, start (+10 more)

### Community 11 - "PageHeader"
Cohesion: 0.15
Nodes (28): AddContent(), metadata, ContentList(), AdminGrades(), metadata, AdminHome(), metadata, metadata (+20 more)

### Community 12 - "audit"
Cohesion: 0.17
Nodes (38): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+30 more)

### Community 13 - "MicSession"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 14 - "voices.ts"
Cohesion: 0.09
Nodes (29): TtsConfig, AudioDefaults, AudioDefaultsContext, MAIN, RATE_STEPS, SAMPLE, SHORT(), loadBrowserVoices() (+21 more)

### Community 15 - "search.ts"
Cohesion: 0.12
Nodes (27): POST, GET, BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED (+19 more)

### Community 16 - "GameEditor.tsx"
Cohesion: 0.09
Nodes (26): DiagramPoints(), Point, FONT_SAMPLE, FontPreview(), blankItem(), Category, contentSnapshot(), editorState() (+18 more)

### Community 17 - "package.json"
Cohesion: 0.08
Nodes (32): devDependencies, dictionary-en@^4.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4 (+24 more)

### Community 18 - "segments.ts"
Cohesion: 0.12
Nodes (29): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+21 more)

### Community 19 - "games/service.ts"
Cohesion: 0.14
Nodes (29): CARDS, GET(), maxDuration, EditGame(), metadata, createGame(), phrasesFor(), practicePhraseClips() (+21 more)

### Community 20 - "lib/videos.ts"
Cohesion: 0.13
Nodes (23): POST, metadata, MyActivities(), metadata, MyProgress(), metadata, WatchPage(), metadata (+15 more)

### Community 21 - "mediaUrl"
Cohesion: 0.16
Nodes (21): POST, POST, POST, schema, POST, done, POST, start (+13 more)

### Community 22 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 23 - "FlashcardParts.tsx"
Cohesion: 0.13
Nodes (23): AudioField(), stopFaceAudio(), FaceEditor(), FlashcardPreview(), RowControls(), swapItem(), useUi(), AddImagePanel() (+15 more)

### Community 24 - "autocorrect.ts"
Cohesion: 0.13
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 25 - "verify.ts"
Cohesion: 0.17
Nodes (21): acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken(), sendVerificationLink(), tokenRe, promoteVerified() (+13 more)

### Community 26 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 27 - "HttpError"
Cohesion: 0.16
Nodes (21): POST, POST, POST, POST, POST, GET, GET, POST (+13 more)

### Community 28 - "parts.tsx"
Cohesion: 0.14
Nodes (22): BoxesBoard(), openBox(), runReview(), sleep(), State, SequenceBoard(), sleep(), COLORS (+14 more)

### Community 29 - "plainText"
Cohesion: 0.15
Nodes (24): Clips, LetsPractice(), begin(), go(), lineFor(), loaded, pickOf(), sayBoth() (+16 more)

### Community 30 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 31 - "AuthLayout"
Cohesion: 0.13
Nodes (18): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+10 more)

### Community 32 - "Players.tsx"
Cohesion: 0.23
Nodes (24): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), MatchGame() (+16 more)

### Community 33 - "TopicHero.tsx"
Cohesion: 0.15
Nodes (23): Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel(), Cover(), fmt() (+15 more)

### Community 34 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (19): Diagnostic, Input, SessionOptions, TYPED_HELP, useVoiceSession(), MicState, audioUrlsIn(), EngineResult (+11 more)

### Community 35 - "storage/index.ts"
Cohesion: 0.15
Nodes (17): POST, PUT, GET, POST, EXT, FileGroup, LIBRARY_MAX_BYTES, sniffLibraryFile() (+9 more)

### Community 36 - "assignments/page.tsx"
Cohesion: 0.12
Nodes (20): AssignmentsPage(), ICON, Kind, KINDS, metadata, recipientLabel(), metadata, stepTitle() (+12 more)

### Community 37 - "flow.e2e.mjs"
Cohesion: 0.12
Nodes (11): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+3 more)

### Community 38 - "db.ts"
Cohesion: 0.18
Nodes (14): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), AddListPage(), metadata (+6 more)

### Community 39 - "ActivitySettings.tsx"
Cohesion: 0.15
Nodes (21): ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS, PossibleAnswers(), Section (+13 more)

### Community 40 - "FlashcardsGame.tsx"
Cohesion: 0.17
Nodes (21): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+13 more)

### Community 41 - "auth.ts"
Cohesion: 0.18
Nodes (20): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword(), resetSchema (+12 more)

### Community 42 - "session.ts"
Cohesion: 0.16
Nodes (14): Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), StudentPicker() (+6 more)

### Community 43 - "SpellBoard.tsx"
Cohesion: 0.18
Nodes (15): AlphabetExplorer(), Config, sleep(), SpellBoard(), submit(), CharKeys(), FeedbackBubble(), ListenBlocked() (+7 more)

### Community 44 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 45 - "TeacherShell.tsx"
Cohesion: 0.20
Nodes (12): AdminLayout(), LearnLayout(), NavLinks(), LINKS, TeacherShell(), VerifyBanner(), Avatar(), AvatarKey (+4 more)

### Community 46 - "games/templates.ts"
Cohesion: 0.14
Nodes (17): metadata, NewGame(), CreateButton(), FEATURED, Oral(), TemplateGallery(), WIDE, PREVIEW_BG (+9 more)

### Community 47 - "games/types.ts"
Cohesion: 0.21
Nodes (16): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep(), GamePlayer(), needsMic(), PlayerProps (+8 more)

### Community 48 - "requireTeacher"
Cohesion: 0.19
Nodes (18): POST, GET, PUT, GET, POST, POST, PUT, addToCollection() (+10 more)

### Community 49 - "CardPhotoForm.tsx"
Cohesion: 0.16
Nodes (16): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+8 more)

### Community 50 - "TopicLesson.tsx"
Cohesion: 0.21
Nodes (16): ICON, KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), TopicLessonProps (+8 more)

### Community 51 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 52 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.2, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0 (+10 more)

### Community 53 - "@prisma/client"
Cohesion: 0.20
Nodes (13): @prisma/client, POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook() (+5 more)

### Community 54 - "ResourcePlayer"
Cohesion: 0.20
Nodes (13): DraftPreview(), StudentActivityPage(), ResourcePreview(), BackLink(), LinkPlayer(), noop(), ResourcePlayer(), useInBrowser() (+5 more)

### Community 55 - "preview/[id]/page.tsx"
Cohesion: 0.18
Nodes (13): metadata, PlayPage(), metadata, PreviewPage(), recipientLabel(), SettingsData, ActivityStrip(), saveRename() (+5 more)

### Community 56 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 57 - "Badge"
Cohesion: 0.24
Nodes (14): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), PrintButton(), Badge() (+6 more)

### Community 58 - "ref_node_fs"
Cohesion: 0.13
Nodes (5): errors, stamp, resetLinkFromLog(), sleep(), stamp

### Community 59 - "ref_node_path"
Cohesion: 0.12
Nodes (6): db, dir, plan, errors, stamp, slug()

### Community 60 - "templates.e2e.mjs"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 61 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 62 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 63 - "playwright"
Cohesion: 0.14
Nodes (6): errors, stamp, COLORS, db, stamp, playwright

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
Cohesion: 0.20
Nodes (13): AudioControl(), browserPreview(), generate(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice() (+5 more)

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

### Community 72 - "ImageEditor.tsx"
Cohesion: 0.23
Nodes (11): EditStep, ico, Icons, ImageEditor(), apply(), moveBox(), Op, Rect (+3 more)

### Community 73 - "emails/templates.ts"
Cohesion: 0.41
Nodes (10): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, Rendered (+2 more)

### Community 74 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 75 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 76 - "library/seed.ts"
Cohesion: 0.27
Nodes (8): db, main(), TEMPLATES, CATEGORY, SEED_CHANT, SEED_TOPICS, SEED_VOCAB, seedLibrary()

### Community 77 - "teacher/videos/page.tsx"
Cohesion: 0.33
Nodes (7): metadata, TeacherWatch(), fmt(), metadata, VideosPage(), adminEmails(), isPlatformAdmin()

### Community 78 - "Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity"
Cohesion: 0.20
Nodes (9): Built, not covered by automated tests, Create Activity & multilingual voice (`e2e/templates.e2e.mjs`), Hosting on Supabase + Vercel (`docs/DEPLOY.md`), Needs credentials / configuration, Next phases, Not tested yet (must be done before classroom use), Phase 2 — video library (`e2e/videos.e2e.mjs`), Status — Phase 1 (oral activity, section 19) + Phase 2 (video library) + Create Activity (+1 more)

### Community 79 - "ActivityList.tsx"
Cohesion: 0.36
Nodes (8): GamesPage(), metadata, ActivityFilters(), ActivityList(), ActivitySearch, loadActivities(), Loaded, duplicateGame()

### Community 80 - "TopicPlanEditor.tsx"
Cohesion: 0.22
Nodes (5): ICON, KindIcon(), LABEL, PlanItem, TopicPlanEditor()

### Community 81 - "VideoPlayer.tsx"
Cohesion: 0.24
Nodes (7): fmt(), loadYouTubeApi(), ProgressReport, SPEEDS, VideoPlayer(), Window, YTPlayer

### Community 83 - "image-editor.e2e.mjs"
Cohesion: 0.22
Nodes (3): errors, NAMES, stamp

### Community 84 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 85 - "spanish-check.ts"
Cohesion: 0.31
Nodes (7): ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS, Suggestion

### Community 86 - ""TopicPlan""
Cohesion: 0.29
Nodes (3): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key

### Community 87 - "Publicar en internet (Supabase + Vercel)"
Cohesion: 0.25
Nodes (7): 1. Supabase, 2. Vercel, Buscar imágenes en internet (con filtro infantil), Correo para "¿Olvidaste tu contraseña?", Límites conocidos en Vercel, Publicar en internet (Supabase + Vercel), Solo el administrador sube videos

### Community 89 - "build-accent-maps.mjs"
Cohesion: 0.32
Nodes (7): dictionary-es@^4.0.0, dictionary-fr@^3.0.0, dictionary-es, dictionary-fr, build(), strip(), words()

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "classes/[id]/page.tsx"
Cohesion: 0.43
Nodes (6): Bar(), ClassPage(), AddStudentsMenu(), buttonClass(), deleteGroup(), classTasks()

### Community 92 - "actions/tasks.ts"
Cohesion: 0.36
Nodes (5): createTopicTask(), TaskResult, taskSchema, dedupeRecipients(), GroupInfo

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

### Community 98 - "MatchBoard.tsx"
Cohesion: 0.70
Nodes (4): MatchBoard(), done(), drop(), sleep()

### Community 99 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Button` to `layout.ts`, `MyActivitiesBoard.tsx`, `library/types.ts`, `topics/[id]/page.tsx`, `classroom.ts`, `PageHeader`, `voices.ts`, `GameEditor.tsx`, `package.json`, `segments.ts`, `lib/videos.ts`, `FlashcardParts.tsx`, `autocorrect.ts`, `parts.tsx`, `plainText`, `AuthLayout`, `Players.tsx`, `TopicHero.tsx`, `useVoiceSession.ts`, `ActivitySettings.tsx`, `FlashcardsGame.tsx`, `session.ts`, `SpellBoard.tsx`, `TeacherShell.tsx`, `games/templates.ts`, `games/types.ts`, `CardPhotoForm.tsx`, `TopicLesson.tsx`, `dependencies`, `ResourcePlayer`, `preview/[id]/page.tsx`, `ImageEditor.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `VideoPlayer.tsx`, `classes/[id]/page.tsx`, `MatchBoard.tsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062317429406037 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `tts/index.ts`, `MyActivitiesBoard.tsx`, `Button`, `library/types.ts`, `commons.ts`, `topics/[id]/page.tsx`, `library/service.ts`, `classroom.ts`, `PageHeader`, `audit`, `search.ts`, `GameEditor.tsx`, `package.json`, `games/service.ts`, `lib/videos.ts`, `mediaUrl`, `verify.ts`, `HttpError`, `AuthLayout`, `TopicHero.tsx`, `storage/index.ts`, `assignments/page.tsx`, `db.ts`, `ActivitySettings.tsx`, `auth.ts`, `session.ts`, `TeacherShell.tsx`, `requireTeacher`, `TopicLesson.tsx`, `dependencies`, `@prisma/client`, `ResourcePlayer`, `preview/[id]/page.tsx`, `Badge`, `VideoForm`, `teacher/videos/page.tsx`, `ActivityList.tsx`, `TopicPlanEditor.tsx`, `classes/[id]/page.tsx`, `actions/tasks.ts`, `app/layout.tsx`, `next.config.ts`, `middleware.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `tts/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06009615384615385 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `@prisma/client` to `library/service.ts`, `next`, `audit`, `package.json`, `games/service.ts`, `lib/videos.ts`, `mediaUrl`, `verify.ts`, `lextro.e2e.mjs`, `db.ts`, `photo-form.e2e.mjs`, `dependencies`, `Badge`, `ref_node_path`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `playwright`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `library/seed.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `MyActivitiesBoard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07117255504352278 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.12406015037593984 - nodes in this community are weakly interconnected._