# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 393 files · ~233,733 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2504 nodes · 7902 edges · 122 communities (105 shown, 17 thin omitted)
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
- webhook.ts
- react
- Segmentación de texto
- MyActivitiesBoard.tsx
- actions/videos.ts
- tts/index.ts
- Configuración TypeScript
- TopicLesson.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- useVoiceSession.ts
- ref_node_path
- preview/[id]/page.tsx
- Tests e2e de flashcards
- Scripts de package.json
- Button
- Dependencias de desarrollo
- GameEditor.tsx
- PublicHeader
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
- auth.ts
- stt/index.ts
- 20261113220000_laxtrospeak_library/migration.sql
- plainText
- gateway.ts
- CardPhotoForm.tsx
- HttpError
- commons.ts
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
- google.ts
- "TopicPlan"
- flashcards-printables.e2e.mjs
- teacher/page.tsx
- DiagramBoard
- "public"."MediaAsset"
- "public"."User"
- library/types.ts
- verify.ts
- "public"."Game"
- VideoPlayer.tsx
- VideoForm.tsx
- games.ts
- admin/page.tsx
- ref_node_fs
- library-header.e2e.mjs
- speaker.ts
- admin/page.tsx
- emails/templates.ts
- "public"."Topic"
- users/page.tsx
- rateLimit
- roster/page.tsx
- Button.tsx
- dashboards.e2e.mjs
- lib/review.ts
- spanish-check.ts
- vercel.json
- settings/page.tsx
- reports.ts
- vitest
- roster.ts
- video-protect.e2e.mjs
- safety.ts
- dashboards.e2e.mjs
- DashBits.tsx
- photoQuery.ts
- activity.ts
- checkout/route.ts
- TopicHero.tsx
- 20261122000000_review_speaking_settings/migration.sql
- email.ts
- States.tsx
- assign/page.tsx
- html-to-image

## God Nodes (most connected - your core abstractions)
1. `next` - 148 edges
2. `db` - 113 edges
3. `HttpError` - 104 edges
4. `audit()` - 103 edges
5. `requireTeacher()` - 92 edges
6. `Button()` - 90 edges
7. `react` - 87 edges
8. `requireTeacherPage()` - 63 edges
9. `Input()` - 48 edges
10. `PageHeader()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `seedLibrary()`  [EXTRACTED]
  prisma/seed.ts → src/lib/library/seed.ts
- `POST` --calls--> `requireTeacher()`  [EXTRACTED]
  src/app/api/text/keep/route.ts → src/lib/auth/guards.ts
- `GradeForm()` --indirect_call--> `createGrade()`  [INFERRED]
  src/components/admin/GradeForm.tsx → src/lib/actions/library.ts
- `NewResourceForm()` --indirect_call--> `addLibraryContent()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts
- `MetaForm()` --indirect_call--> `updateResourceMeta()`  [INFERRED]
  src/components/admin/ResourceForms.tsx → src/lib/actions/library.ts

## Import Cycles
- 2-file cycle: `src/components/library/Players.tsx -> src/components/library/SpeakingPlayer.tsx -> src/components/library/Players.tsx`

## Communities (122 total, 17 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.10
Nodes (43): BoxesBoard(), openBox(), runReview(), sleep(), State, MatchBoard(), done(), drop() (+35 more)

### Community 1 - "db.ts"
Cohesion: 0.09
Nodes (49): AddContent(), metadata, ContentList(), metadata, TeacherAlphabet(), Actions(), AssignedBanner(), AssignmentResults() (+41 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "AudioField.tsx"
Cohesion: 0.11
Nodes (29): AudioControl(), browserPreview(), generate(), TtsConfig, AudioDefaults, AudioDefaultsContext, AudioField(), audioLanguages() (+21 more)

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (34): POST, Ctx, GET, PUT, CARDS, GET(), maxDuration, EditGame() (+26 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.11
Nodes (40): scoreTurn(), say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH, evaluateAnswer(), evaluateLetters() (+32 more)

### Community 6 - "layout.ts"
Cohesion: 0.06
Nodes (71): DownloadIcon(), GearIcon(), icon, PER_PAGE, PER_PAGE_DEFAULT, PrintablesViewer(), PrinterIcon(), Scaled() (+63 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.09
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "next"
Cohesion: 0.07
Nodes (32): nextConfig, securityHeaders, next, @prisma/client, zod, schema, body, POST (+24 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.25
Nodes (7): AUTOPLAY_OPTION, Board, DEFAULT_CATEGORIES, DEFAULT_MAX_ITEMS, FONT_OPTION, OptionDef, TemplateKey

### Community 10 - "topics/[id]/page.tsx"
Cohesion: 0.09
Nodes (39): metadata, STATUS, ManageActivities(), metadata, metadata, stepTitle(), TaskPage(), GameLibraryPanel() (+31 more)

### Community 11 - "mediaUrl"
Cohesion: 0.10
Nodes (30): POST, PUT, POST, start, done, start, maxDuration, POST (+22 more)

### Community 12 - "search.ts"
Cohesion: 0.18
Nodes (17): searchCommons(), download(), fetchSafeImage(), ImageResult, ImageSize, pixabay(), PIXABAY_HOSTS, PixabayHit (+9 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.08
Nodes (36): devDependencies, dictionary-en@^4.0.0, dictionary-es@^4.0.0, dictionary-fr@^3.0.0, eslint@^9, eslint-config-next@15.5.29, nspell@^2.1.5, playwright@^1.63.0 (+28 more)

### Community 14 - "webhook.ts"
Cohesion: 0.18
Nodes (16): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+8 more)

### Community 15 - "react"
Cohesion: 0.10
Nodes (47): react, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), TeacherSignInForm() (+39 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (27): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, check(), SettingsValues, ALSO_SPANISH (+19 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.05
Nodes (71): db, main(), metadata, NewGame(), metadata, MyActivitiesPage(), Search, CreateButton() (+63 more)

### Community 18 - "actions/videos.ts"
Cohesion: 0.42
Nodes (8): addToCollection(), deleteCollection(), deleteVideo(), moveInCollection(), removeFromCollection(), schoolCollection(), schoolVideo(), setVideoStatus()

### Community 19 - "tts/index.ts"
Cohesion: 0.11
Nodes (28): azure(), azureSsml(), escapeXml(), gateway(), gatewayPart(), google(), googlePart(), joinPcm() (+20 more)

### Community 20 - "Configuración TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "TopicLesson.tsx"
Cohesion: 0.11
Nodes (35): AdminTopicPreview(), metadata, metadata, StudentTask(), metadata, StudentViewPage(), EyeIcon(), KindIcon() (+27 more)

### Community 22 - "Tests e2e de plantillas"
Cohesion: 0.14
Nodes (5): addImage(), fx(), publish(), saved(), stamp

### Community 23 - "library.ts"
Cohesion: 0.14
Nodes (39): addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade(), createResource(), createTopic() (+31 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthLayout"
Cohesion: 0.12
Nodes (19): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+11 more)

### Community 26 - "useVoiceSession.ts"
Cohesion: 0.08
Nodes (32): AlphabetExplorer(), Config, Done, SpeakingPlayer(), Status, FeedbackBubble(), MicIndicator(), Diagnostic (+24 more)

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
Cohesion: 0.12
Nodes (16): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2, react@19.1.0, react-dom@19.1.0 (+8 more)

### Community 31 - "Button"
Cohesion: 0.17
Nodes (23): EditResource(), ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools() (+15 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 33 - "GameEditor.tsx"
Cohesion: 0.11
Nodes (24): DiagramPoints(), Point, RowControls(), FONT_SAMPLE, FontPreview(), blankItem(), Category, contentSnapshot() (+16 more)

### Community 34 - "PublicHeader"
Cohesion: 0.15
Nodes (12): LearnLayout(), metadata, Privacy(), metadata, StudentStart(), NavLinks(), PublicHeader(), Avatar() (+4 more)

### Community 35 - "WsIcon"
Cohesion: 0.13
Nodes (21): AdminLayout(), TeacherLayout(), StatusPillClient(), TopicStatusBar(), VerifyBanner(), isActive(), useDismiss(), UserMenu() (+13 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "ImageField.tsx"
Cohesion: 0.09
Nodes (28): Ctx, Dict, EN, ES, UiLang, useUi(), EditStep, ico (+20 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "session.ts"
Cohesion: 0.39
Nodes (5): Home(), destroySession(), getSessionUser, hashToken(), SessionUser

### Community 40 - "[slug]/page.tsx"
Cohesion: 0.17
Nodes (16): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), GRADE_FILTERS, GradeFilter (+8 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.17
Nodes (30): DraftPreview(), ResourcePreview(), BackLink(), Celebrate(), ConnectSheet(), FlashcardsPlayer(), GamePlayer(), Instructions() (+22 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "lessonData.ts"
Cohesion: 0.09
Nodes (36): server-only, POST, POST, POST, POST, schema, metadata, MyActivities() (+28 more)

### Community 53 - "auth.ts"
Cohesion: 0.15
Nodes (16): ClassLogin(), metadata, S, StudentPicker(), escapeHtml(), forgotSchema, FormState, hashToken() (+8 more)

### Community 54 - "stt/index.ts"
Cohesion: 0.17
Nodes (15): metadata, StudentAlphabet(), azure(), CONTEXT, gateway(), GATEWAY_MODELS, google(), LETTER_HINTS (+7 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.09
Nodes (45): PossibleAnswers(), CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), FlashcardsGameProps (+37 more)

### Community 57 - "gateway.ts"
Cohesion: 0.28
Nodes (10): @vercel/oidc@4.0.5, @vercel/oidc, GET(), maxDuration, GatewayError, gatewaySpeech(), GatewaySpeechRequest, gatewayTranscribe() (+2 more)

### Community 58 - "CardPhotoForm.tsx"
Cohesion: 0.19
Nodes (13): cache, CardFace, LANG, Photo, PhotoBox(), upload(), SearchPanel(), SIDE (+5 more)

### Community 59 - "HttpError"
Cohesion: 0.12
Nodes (32): POST, GET, PROBES, GET, POST, GET, POST, GET (+24 more)

### Community 60 - "commons.ts"
Cohesion: 0.18
Nodes (19): API(), CommonsPhoto, CommonsStats, dropReason(), fetchCommonsImage(), FILE_HOSTS(), fileUrl(), HEADERS (+11 more)

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.13
Nodes (17): FavoriteButton(), AccessItem, KindPicture(), TopicAccess(), KindIcon(), LABEL, PlanItem, TopicPlanEditor() (+9 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "classroom.ts"
Cohesion: 0.09
Nodes (51): POST, metadata, classroomAccessWhere(), ownClassroomStrict(), ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent() (+43 more)

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

### Community 71 - "google.ts"
Cohesion: 0.20
Nodes (16): b64(), fetchGoogleImage(), googleMissing(), GooglePhoto, googleProvider(), httpsUrl(), privateAddress(), Provider (+8 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.15
Nodes (8): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.15
Nodes (4): COLORS, db, errors, stamp

### Community 74 - "teacher/page.tsx"
Cohesion: 0.14
Nodes (25): ClassesPage(), metadata, Dashboard(), DashboardContent(), metadata, STATUS_CLS, metadata, ProgressPage() (+17 more)

### Community 75 - "DiagramBoard"
Cohesion: 0.80
Nodes (5): DiagramBoard(), drop(), finishIfDone(), submitTyped(), sleep()

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "library/types.ts"
Cohesion: 0.09
Nodes (25): LinkPreview(), LinkPlayer(), ContentFor, contentSchemas, DOCX_MIME, embedFor(), fileIdsOf(), fileRef (+17 more)

### Community 79 - "verify.ts"
Cohesion: 0.26
Nodes (11): acceptSchema, confirmEmail(), VerifyState, grantAdmin(), hashToken(), sendVerificationLink(), tokenRe, adminEmails() (+3 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "VideoPlayer.tsx"
Cohesion: 0.22
Nodes (12): ProtectedAudio(), protectedMediaProps(), STUDENT_MAX_RATE, useNoSeekAhead(), watchedToEnd(), fmt(), loadYouTubeApi(), ProgressReport (+4 more)

### Community 82 - "VideoForm.tsx"
Cohesion: 0.21
Nodes (11): EditVideo(), metadata, metadata, NewVideo(), SpanishField(), parseYouTubeId(), VideoForm(), save() (+3 more)

### Community 83 - "games.ts"
Cohesion: 0.29
Nodes (10): AnswerRow(), save(), schoolGame(), deleteGame(), langCode, saveAcceptedAnswers(), saveActivitySettings(), setGameFont() (+2 more)

### Community 84 - "admin/page.tsx"
Cohesion: 0.23
Nodes (11): AdminOverview(), AdminOverviewContent(), metadata, metadata, AutoSubmitSelect(), StatCard(), AdminTopicFilter, adminTopics() (+3 more)

### Community 85 - "ref_node_fs"
Cohesion: 0.12
Nodes (8): errors, stamp, db, dir, plan, build(), strip(), words()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "speaker.ts"
Cohesion: 0.19
Nodes (10): loadBrowserVoices(), pending, pickBrowserVoice(), preloadAudio(), pump(), queued, ready, SayResult (+2 more)

### Community 88 - "admin/page.tsx"
Cohesion: 0.14
Nodes (6): resetLinkFromLog(), sleep(), stamp, errors, stamp, playwright

### Community 89 - "emails/templates.ts"
Cohesion: 0.41
Nodes (10): adminInviteEmail(), billingEmail(), button(), escapeHtml(), formatMoney(), layout(), Money, Rendered (+2 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "users/page.tsx"
Cohesion: 0.18
Nodes (15): metadata, ROLE_LABEL, ROLES, Users(), AdminActionForm(), AdminState, createSchool(), endSessions() (+7 more)

### Community 92 - "rateLimit"
Cohesion: 0.38
Nodes (9): GET, POST, schema, speechSegments(), ensureAudio(), VoiceChoice, ttsCacheKey(), ttsProvider() (+1 more)

### Community 93 - "roster/page.tsx"
Cohesion: 0.35
Nodes (8): metadata, RosterPage(), RosterRow(), Row, AddStudentForm(), PinNotice(), ResetPinButton(), resetStudentPin()

### Community 94 - "Button.tsx"
Cohesion: 0.27
Nodes (9): Bar(), ClassPage(), AddStudentsMenu(), CoTeacherForm(), buttonClass(), Size, sizes, Variant (+1 more)

### Community 96 - "lib/review.ts"
Cohesion: 0.14
Nodes (25): metadata, ReviewWork(), metadata, ReviewPage(), dayDiff(), formatLocal(), LocalTime(), ReviewForm() (+17 more)

### Community 97 - "spanish-check.ts"
Cohesion: 0.25
Nodes (9): accept(), ALWAYS, applyAll(), applySuggestion(), checkSpanish(), ESTAR, matchCase(), QUESTION_WORDS (+1 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "settings/page.tsx"
Cohesion: 0.19
Nodes (18): AdminSettings(), metadata, Status(), metadata, NewTopic(), AdminTopics(), Schools(), UsersAndSchools() (+10 more)

### Community 103 - "reports.ts"
Cohesion: 0.29
Nodes (9): isVoice(), questionResult(), questionStatus(), R, assignmentReport(), assignmentStudents(), StudentRow, videoAssignmentReport() (+1 more)

### Community 104 - "vitest"
Cohesion: 0.18
Nodes (7): vitest, poolerSafeUrl(), env, openSteps(), SequenceStep, dedupeRecipients(), GroupInfo

### Community 105 - "roster.ts"
Cohesion: 0.21
Nodes (15): addStudentList(), newSecret(), rand(), capitalize(), CheckedRow, checkRows(), fourDigitPin(), friendlyPassword() (+7 more)

### Community 106 - "video-protect.e2e.mjs"
Cohesion: 0.22
Nodes (5): desktop, errors, stamp, state(), vid()

### Community 107 - "safety.ts"
Cohesion: 0.29
Nodes (8): BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED, RANK, SafeSearchAnnotation

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "DashBits.tsx"
Cohesion: 0.18
Nodes (19): CATEGORIES, ContentLibrary(), metadata, AdminRowTopic, AdminTopicRow(), OPTIONS, TopicStatusMenu(), Kind3D() (+11 more)

### Community 110 - "photoQuery.ts"
Cohesion: 0.42
Nodes (6): CardPhotoForm(), categoryContext(), CONTEXT, googleImagesUrl(), searchTerm(), withContext()

### Community 111 - "activity.ts"
Cohesion: 0.24
Nodes (11): ActivityLog(), metadata, ACTION_GROUPS, actionWhere(), ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf() (+3 more)

### Community 112 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

### Community 113 - "TopicHero.tsx"
Cohesion: 0.13
Nodes (27): TopicPage(), StudentActivity(), Branch(), Carousel(), onKey(), page(), Categories(), CategoryPanel() (+19 more)

### Community 118 - "email.ts"
Cohesion: 0.52
Nodes (6): canSendEmail(), consoleDriver(), Email, emailConfigured(), randomRef(), sendEmail()

### Community 119 - "States.tsx"
Cohesion: 0.60
Nodes (3): Error(), Error(), DashError()

### Community 120 - "assign/page.tsx"
Cohesion: 0.47
Nodes (5): AssignTaskPage(), metadata, resourceOf(), TopicResources, AssignTaskWizard()

### Community 121 - "html-to-image"
Cohesion: 0.40
Nodes (5): html-to-image@1.11.13, jspdf@4.2.1, html-to-image, jspdf, downloadPdf()

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `AudioField.tsx`, `layout.ts`, `topics/[id]/page.tsx`, `Dependencias (package.json)`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `TopicLesson.tsx`, `AuthLayout`, `useVoiceSession.ts`, `preview/[id]/page.tsx`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `WsIcon`, `ImageField.tsx`, `session.ts`, `[slug]/page.tsx`, `autocorrect.ts`, `Players.tsx`, `lessonData.ts`, `auth.ts`, `plainText`, `CardPhotoForm.tsx`, `TopicRow.tsx`, `teacher/page.tsx`, `VideoPlayer.tsx`, `VideoForm.tsx`, `admin/page.tsx`, `users/page.tsx`, `roster/page.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `DashBits.tsx`, `TopicHero.tsx`, `States.tsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10412299091544375 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `topics/[id]/page.tsx`, `mediaUrl`, `Dependencias (package.json)`, `webhook.ts`, `react`, `MyActivitiesBoard.tsx`, `actions/videos.ts`, `TopicLesson.tsx`, `library.ts`, `AuthLayout`, `preview/[id]/page.tsx`, `Scripts de package.json`, `Button`, `GameEditor.tsx`, `PublicHeader`, `WsIcon`, `Layout raíz`, `session.ts`, `[slug]/page.tsx`, `Players.tsx`, `lessonData.ts`, `auth.ts`, `gateway.ts`, `HttpError`, `TopicRow.tsx`, `classroom.ts`, `teacher/page.tsx`, `verify.ts`, `VideoForm.tsx`, `games.ts`, `admin/page.tsx`, `users/page.tsx`, `rateLimit`, `roster/page.tsx`, `Button.tsx`, `lib/review.ts`, `settings/page.tsx`, `DashBits.tsx`, `activity.ts`, `checkout/route.ts`, `TopicHero.tsx`, `States.tsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09226190476190477 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `next` to `games/service.ts`, `Dependencias (package.json)`, `webhook.ts`, `MyActivitiesBoard.tsx`, `library.ts`, `flow.e2e.mjs`, `ref_node_path`, `Scripts de package.json`, `lextro.e2e.mjs`, `lessonData.ts`, `HttpError`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `admin/page.tsx`, `ref_node_fs`, `users/page.tsx`, `lib/review.ts`, `reports.ts`, `dashboards.e2e.mjs`, `activity.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `AudioField.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._