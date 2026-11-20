# Graph Report - speak-and-learn-spanish  (2026-11-20)

## Corpus Check
- 408 files · ~240,193 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .example 1, (none) 1, .vtt 1)

## Summary
- 2576 nodes · 8125 edges · 125 communities (103 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c2829325`
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
- db.ts
- HttpError
- Configuración TypeScript
- TopicHero.tsx
- Tests e2e de plantillas
- library.ts
- flow.e2e.mjs
- AuthLayout
- library/types.ts
- topic-rows.e2e.mjs
- settings/page.tsx
- Tests e2e de flashcards
- Scripts de package.json
- topics/[id]/page.tsx
- Dependencias de desarrollo
- isPlatformAdmin
- CardPhotoForm.tsx
- WsIcon
- Configuración ESLint
- AudioField.tsx
- Layout raíz
- Button
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
- plainText
- TopicLesson.tsx
- preview/[id]/page.tsx
- webhook.ts
- community.e2e.mjs
- photo-form.e2e.mjs
- TopicRow.tsx
- "public"."School"
- audit
- ref_node_fs
- topic-lesson.e2e.mjs
- voice.e2e.mjs
- playwright
- library.e2e.mjs
- video-player.e2e.mjs
- DashBits.tsx
- "TopicPlan"
- flashcards-printables.e2e.mjs
- CommunityView.tsx
- roster.ts
- "public"."MediaAsset"
- "public"."User"
- storage/index.ts
- requireStudentPage
- "public"."Game"
- AudioField.tsx
- VideoForm
- ActivitySettings.tsx
- resources/[id]/page.tsx
- ref_node_fs
- library-header.e2e.mjs
- GameEditor.tsx
- MyActivitiesView.tsx
- ImageField.tsx
- "public"."Topic"
- DashBits.tsx
- assignments/[id]/page.tsx
- stt/index.ts
- lessonData.ts
- admin/page.tsx
- lib/review.ts
- next
- vercel.json
- teacher/page.tsx
- voices.ts
- activity/page.tsx
- package.json
- my-activities.e2e.mjs
- VideoPlayer.tsx
- dashboards.e2e.mjs
- learn/layout.tsx
- spanish-check.ts
- gateway.ts
- LocalTime
- next.config.ts
- 20261122000000_review_speaking_settings/migration.sql
- video-protect.e2e.mjs
- middleware.ts
- checkout/route.ts
- actions/tasks.ts
- generate.ts
- eslint@^9
- @types/react-dom@^19

## God Nodes (most connected - your core abstractions)
1. `next` - 151 edges
2. `db` - 116 edges
3. `HttpError` - 106 edges
4. `audit()` - 105 edges
5. `requireTeacher()` - 94 edges
6. `Button()` - 90 edges
7. `react` - 87 edges
8. `requireTeacherPage()` - 65 edges
9. `Input()` - 48 edges
10. `FormError()` - 44 edges

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

## Communities (125 total, 22 thin omitted)

### Community 0 - "parts.tsx"
Cohesion: 0.07
Nodes (58): AlphabetExplorer(), Config, BoxesBoard(), openBox(), runReview(), sleep(), State, DiagramBoard() (+50 more)

### Community 1 - "db.ts"
Cohesion: 0.11
Nodes (37): AddContent(), metadata, metadata, NewAssignment(), AssignmentsPage(), ICON, Kind, metadata (+29 more)

### Community 2 - "20261025012814_init/migration.sql"
Cohesion: 0.15
Nodes (28): AssignmentRecipient_assignmentId_idx, AssignmentRecipient_classroomId_idx, AssignmentRecipient_groupId_idx, AssignmentRecipient_levelId_idx, AssignmentRecipient_studentId_idx, Classroom_code_key, Classroom_schoolId_idx, Classroom_teacherId_idx (+20 more)

### Community 3 - "useVoiceSession.ts"
Cohesion: 0.13
Nodes (19): Status, Coach, CoachLine, Diagnostic, Input, SessionOptions, TurnResult, TYPED_HELP (+11 more)

### Community 4 - "games/service.ts"
Cohesion: 0.12
Nodes (28): Ctx, GET, PUT, CARDS, GET(), maxDuration, metadata, phrasesFor() (+20 more)

### Community 5 - "Evaluación de pronunciación"
Cohesion: 0.10
Nodes (41): vitest, scoreTurn(), env, say(), AnswerSpec, CARRIERS, cleanTyped(), ENGLISH (+33 more)

### Community 6 - "layout.ts"
Cohesion: 0.05
Nodes (76): SettingsData, ActivityStrip(), saveRename(), StripAssignment, StripRole, DownloadIcon(), GearIcon(), icon (+68 more)

### Community 7 - "Micrófono y detección de voz (VAD)"
Cohesion: 0.10
Nodes (11): ListenOutcome, MicSession, Utterance, DEFAULT_VAD, rmsDb(), run(), Vad, VadConfig (+3 more)

### Community 8 - "PublicHeader"
Cohesion: 0.15
Nodes (14): Home(), metadata, Privacy(), ClassLogin(), metadata, metadata, StudentStart(), S (+6 more)

### Community 9 - "games/templates.ts"
Cohesion: 0.14
Nodes (15): AdminNewGame(), metadata, metadata, NewGame(), TemplateGallery(), AUTOPLAY_OPTION, Board, DEFAULT_CATEGORIES (+7 more)

### Community 10 - "activityTypes.ts"
Cohesion: 0.21
Nodes (19): ActivityTypeIcon(), Gallery(), Sort, TypeCard(), ACTIVITY_TYPES, activityDescription(), activityIconSrc(), activityIconSrcSet() (+11 more)

### Community 11 - "mediaUrl"
Cohesion: 0.14
Nodes (25): POST, POST, GET, POST, POST, done, POST, start (+17 more)

### Community 12 - "search.ts"
Cohesion: 0.12
Nodes (26): GET, BLOCKED_WORDS, hasBlockedWords(), isSafeAnnotation(), Likelihood, normalize(), NORMALIZED, RANK (+18 more)

### Community 13 - "Dependencias (package.json)"
Cohesion: 0.11
Nodes (19): devDependencies, dictionary-en@^4.0.0, dictionary-es@^4.0.0, playwright@^1.63.0, tailwindcss@^4, @tailwindcss/postcss@^4, tsx@^4.20.5, @types/node@^20 (+11 more)

### Community 14 - "auth.ts"
Cohesion: 0.12
Nodes (38): escapeHtml(), forgotSchema, FormState, hashToken(), loginSchema, requestPasswordReset(), resetPassword(), resetSchema (+30 more)

### Community 15 - "react"
Cohesion: 0.14
Nodes (30): react, GradeForm(), MetaFields(), NewResourceForm(), ForgotPasswordForm(), Notice(), ResetPasswordForm(), AcceptInviteForm() (+22 more)

### Community 16 - "Segmentación de texto"
Cohesion: 0.12
Nodes (28): LANG_TONE, LanguageTools(), markSelection(), Props, SHORT, SpanishField(), accept(), check() (+20 more)

### Community 17 - "MyActivitiesBoard.tsx"
Cohesion: 0.15
Nodes (31): boardHref(), Drag, FolderDialog(), FolderGlyph(), FolderShape(), Menu(), MenuItem(), MenuLink() (+23 more)

### Community 18 - "db.ts"
Cohesion: 0.11
Nodes (22): @prisma/client, server-only, Ctx, PUT, POST, AccountState, names, schema (+14 more)

### Community 19 - "HttpError"
Cohesion: 0.10
Nodes (41): POST, GET, PROBES, POST, HttpError, API(), CommonsPhoto, CommonsStats (+33 more)

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
Cohesion: 0.09
Nodes (48): db, main(), addLibraryContent(), addResourcesToGame(), addResourcesToTopic(), addToTopic(), archiveResource(), createGrade() (+40 more)

### Community 24 - "flow.e2e.mjs"
Cohesion: 0.08
Nodes (14): errors, stamp, addGroup(), addLevel(), addStudent(), addImage(), fx(), stamp (+6 more)

### Community 25 - "AuthLayout"
Cohesion: 0.11
Nodes (22): AdminInvitePage(), dynamic, metadata, ForgotPasswordPage(), metadata, LoginPage(), metadata, dynamic (+14 more)

### Community 26 - "library/types.ts"
Cohesion: 0.08
Nodes (43): ART_OPTIONS, ContentEditor(), FilePicker(), ImagePicker(), listOps(), PairsEditor(), RowTools(), SheetEditor() (+35 more)

### Community 27 - "topic-rows.e2e.mjs"
Cohesion: 0.11
Nodes (5): errors, stamp, db, errors, stamp

### Community 28 - "settings/page.tsx"
Cohesion: 0.10
Nodes (28): AdminLayout(), AdminSettings(), metadata, Status(), AdminTopicPreview(), metadata, NewTopic(), TeacherLayout() (+20 more)

### Community 29 - "Tests e2e de flashcards"
Cohesion: 0.18
Nodes (3): addPicture(), fx(), stamp

### Community 30 - "Scripts de package.json"
Cohesion: 0.10
Nodes (21): dependencies, @breezystack/lamejs@1.2.7, @fontsource/playwrite-mx@^5.3.0, html-to-image@1.11.13, jspdf@4.2.1, next@15.5.29, prisma@^6.16.2, @prisma/client@^6.16.2 (+13 more)

### Community 31 - "topics/[id]/page.tsx"
Cohesion: 0.13
Nodes (31): ContentList(), metadata, STATUS, ManageActivities(), metadata, EditGame(), metadata, stepTitle() (+23 more)

### Community 32 - "Dependencias de desarrollo"
Cohesion: 0.18
Nodes (11): scripts, admin:grant, build, db:migrate, db:seed, dev, lint, start (+3 more)

### Community 34 - "CardPhotoForm.tsx"
Cohesion: 0.14
Nodes (20): cache, CardFace, CardPhotoForm(), LANG, Photo, PhotoBox(), upload(), SearchPanel() (+12 more)

### Community 35 - "WsIcon"
Cohesion: 0.18
Nodes (15): Error(), Error(), StatusPillClient(), TopicStatusBar(), DashError(), isActive(), useDismiss(), UserMenu() (+7 more)

### Community 36 - "Configuración ESLint"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 37 - "AudioField.tsx"
Cohesion: 0.14
Nodes (28): TtsConfig, AudioField(), audioLanguages(), AudioPanel(), ensureGenerated(), previewTts(), sampleVoice(), save() (+20 more)

### Community 38 - "Layout raíz"
Cohesion: 0.29
Nodes (4): gothic, metadata, montessori, viewport

### Community 39 - "Button"
Cohesion: 0.35
Nodes (10): EditResource(), Bar(), ClassPage(), DeleteButton(), MetaForm(), PublishButton(), AddStudentsMenu(), CoTeacherForm() (+2 more)

### Community 40 - "lessonData.ts"
Cohesion: 0.10
Nodes (24): BAND, LEGACY, LibraryPage(), metadata, metadata, TopicLessonPage(), AssignTaskPage(), metadata (+16 more)

### Community 49 - "autocorrect.ts"
Cohesion: 0.14
Nodes (22): El, SHORTCUTS, skipKey(), useAutocorrect(), AccentMap, afterInput(), Correction, detectLang() (+14 more)

### Community 50 - "Players.tsx"
Cohesion: 0.21
Nodes (28): Celebrate(), ConnectSheet(), Done, FlashcardsPlayer(), GamePlayer(), Instructions(), ListenGame(), ListeningPlayer() (+20 more)

### Community 51 - "lextro.e2e.mjs"
Cohesion: 0.09
Nodes (17): ADMIN_EMAIL, assert(), check(), confirmEmail(), consoleErrors, db, desktop, emails() (+9 more)

### Community 52 - "create-activity.e2e.mjs"
Cohesion: 0.16
Nodes (12): addImage(), assert(), createEach(), db, errors, fillFirstItem(), fx(), log() (+4 more)

### Community 53 - "tts/index.ts"
Cohesion: 0.16
Nodes (21): azure(), azureSsml(), escapeXml(), gateway(), gatewayPart(), google(), googlePart(), joinPcm() (+13 more)

### Community 54 - "classroom.ts"
Cohesion: 0.09
Nodes (41): classroomAccessWhere(), ownedClassroom(), ownedGroup(), ownedLevel(), ownedStudent(), AssignState, createAssignment(), deleteAssignment() (+33 more)

### Community 55 - "20261113220000_laxtrospeak_library/migration.sql"
Cohesion: 0.14
Nodes (24): ActivityProgress_activityId_studentId_idx, ActivityProgress_studentId_idx, AdminInvite_email_idx, AssignmentActivity_assignmentId_idx, AssignmentActivity_resourceId_idx, EmailLog_userId_idx, EmailVerificationToken_userId_idx, LibraryFile_storageKey_key (+16 more)

### Community 56 - "plainText"
Cohesion: 0.11
Nodes (40): CardsBoard(), advance(), play(), clockText(), Face(), FlashcardsGame(), IconArrow(), IconFull() (+32 more)

### Community 57 - "TopicLesson.tsx"
Cohesion: 0.21
Nodes (17): KindIcon(), LABEL, MediaThumb(), MyAssignments(), Phase, TopicLesson(), useLessonVoice(), postJson() (+9 more)

### Community 58 - "preview/[id]/page.tsx"
Cohesion: 0.29
Nodes (10): POST, metadata, PlayPage(), metadata, PreviewPage(), recipientLabel(), finishedQuestions(), buildPlayGame() (+2 more)

### Community 59 - "webhook.ts"
Cohesion: 0.14
Nodes (24): POST(), EmailPlan, idOf(), planBillingEmail(), subscriptionIdOfInvoice(), PLAN_NAME(), verifyWebhook(), processStripeEvent() (+16 more)

### Community 60 - "community.e2e.mjs"
Cohesion: 0.14
Nodes (7): animalesBefore, db, errors, signedIn(), stamp, STORAGE, watch()

### Community 61 - "photo-form.e2e.mjs"
Cohesion: 0.13
Nodes (13): assert(), backOf(), box(), db, errors, fake, form(), item() (+5 more)

### Community 62 - "TopicRow.tsx"
Cohesion: 0.20
Nodes (15): FavoriteButton(), KindDot(), TopicCard(), AccessItem, KindPicture(), TopicAccess(), groupSteps(), RowStep (+7 more)

### Community 63 - ""public"."School""
Cohesion: 0.18
Nodes (15): Assignment_schoolId_active_idx, AuditLog_schoolId_createdAt_idx, Category_schoolId_parentId_idx, "public"."Assignment", "public"."AuditLog", "public"."Category", "public"."School", "public"."Video" (+7 more)

### Community 64 - "audit"
Cohesion: 0.09
Nodes (43): POST, POST, ownClassroomStrict(), schoolGame(), AdminState, createSchool(), endSessions(), GRANT_MESSAGE (+35 more)

### Community 65 - "ref_node_fs"
Cohesion: 0.22
Nodes (3): errors, NAMES, stamp

### Community 66 - "topic-lesson.e2e.mjs"
Cohesion: 0.14
Nodes (10): addImage(), assert(), db, desktop, errors, fx(), page, playStep() (+2 more)

### Community 67 - "voice.e2e.mjs"
Cohesion: 0.16
Nodes (8): assert(), db, errors, getGame(), newGame(), putGame(), stamp, tts()

### Community 68 - "playwright"
Cohesion: 0.10
Nodes (9): COLORS, db, stamp, resetLinkFromLog(), sleep(), stamp, errors, stamp (+1 more)

### Community 69 - "library.e2e.mjs"
Cohesion: 0.15
Nodes (7): ADMIN_EMAIL, check(), consoleErrors, db, log(), results, stamp

### Community 70 - "video-player.e2e.mjs"
Cohesion: 0.15
Nodes (6): ADMIN_EMAIL, check(), consoleErrors, db, log(), results

### Community 71 - "DashBits.tsx"
Cohesion: 0.13
Nodes (19): EditGroupPage(), metadata, metadata, NewGroupPage(), metadata, PrintAccess(), metadata, RosterPage() (+11 more)

### Community 72 - ""TopicPlan""
Cohesion: 0.13
Nodes (10): AssignmentActivity_gameId_idx, "TopicPlan", TopicPlan_teacherId_topicId_key, "TopicFavorite", TopicFavorite_topicId_idx, TopicPlan_teacherId_topicId_classroomId_key, "ClassroomTeacher", ClassroomTeacher_teacherId_idx (+2 more)

### Community 73 - "flashcards-printables.e2e.mjs"
Cohesion: 0.09
Nodes (10): COLORS, db, errors, stamp, db, dir, plan, build() (+2 more)

### Community 74 - "CommunityView.tsx"
Cohesion: 0.22
Nodes (12): react-dom@19.1.0, react-dom, AdminCommunityPage(), metadata, CommunityPage(), metadata, CommunityActions(), CopyButton() (+4 more)

### Community 75 - "roster.ts"
Cohesion: 0.26
Nodes (12): addStudentList(), capitalize(), CheckedRow, checkRows(), friendlyPassword(), key(), ListRow, parseStudentList() (+4 more)

### Community 76 - ""public"."MediaAsset""
Cohesion: 0.18
Nodes (12): AcceptedAnswer_questionId_idx, AudioAsset_schoolId_cacheKey_key, GameItem_gameId_position_idx, MediaAsset_schoolId_kind_idx, MediaAsset_schoolId_sha256_idx, MediaAsset_storageKey_key, "public"."AcceptedAnswer", "public"."AudioAsset" (+4 more)

### Community 77 - ""public"."User""
Cohesion: 0.20
Nodes (11): "public"."Session", "public"."User", Session_expiresAt_idx, Session_userId_idx, User_email_key, User_schoolId_role_idx, PasswordResetToken_userId_idx, "public"."PasswordResetToken" (+3 more)

### Community 78 - "storage/index.ts"
Cohesion: 0.13
Nodes (19): PUT, GET, POST, GET, communityWhere, copyGameTo(), isCommunityImage(), remapJson() (+11 more)

### Community 79 - "requireStudentPage"
Cohesion: 0.14
Nodes (19): metadata, MyActivities(), metadata, MyProgress(), StudentActivityPage(), metadata, WatchPage(), metadata (+11 more)

### Community 80 - ""public"."Game""
Cohesion: 0.24
Nodes (10): Game_schoolId_status_idx, Game_teacherId_idx, "public"."Game", "public"."GameTemplate", "public"."Teacher", Teacher_schoolId_idx, Teacher_userId_key, ActivityFolder_teacherId_parentId_idx (+2 more)

### Community 81 - "AudioField.tsx"
Cohesion: 0.16
Nodes (12): AudioDefaults, loadBrowserVoices(), pending, pickBrowserVoice(), pump(), queued, ready, SayResult (+4 more)

### Community 82 - "VideoForm"
Cohesion: 0.26
Nodes (9): EditVideo(), metadata, metadata, NewVideo(), parseYouTubeId(), VideoForm(), save(), requireVideoAdminPage() (+1 more)

### Community 83 - "ActivitySettings.tsx"
Cohesion: 0.15
Nodes (17): FONT_SAMPLE, FontPreview(), ActivitySettings(), flush(), update(), AnswerRow(), save(), LOOK_KEYS (+9 more)

### Community 84 - "resources/[id]/page.tsx"
Cohesion: 0.48
Nodes (4): DraftPreview(), ResourcePreview(), BackLink(), resourceForPreview()

### Community 86 - "library-header.e2e.mjs"
Cohesion: 0.25
Nodes (3): errors, head(), pressed()

### Community 87 - "GameEditor.tsx"
Cohesion: 0.09
Nodes (27): AudioControl(), browserPreview(), generate(), AudioDefaultsContext, DiagramPoints(), Point, swapItem(), blankItem() (+19 more)

### Community 88 - "MyActivitiesView.tsx"
Cohesion: 0.23
Nodes (10): AdminMyActivitiesPage(), metadata, metadata, MyActivitiesPage(), BoardActivity, BoardFolder, BoardSort, MyActivitiesBase (+2 more)

### Community 89 - "ImageField.tsx"
Cohesion: 0.09
Nodes (23): Ctx, Dict, EN, ES, UiLang, EditStep, ico, Icons (+15 more)

### Community 90 - ""public"."Topic""
Cohesion: 0.36
Nodes (7): "public"."Topic", Topic_slug_key, GameResource_resourceId_idx, Grade_nameKey_key, "public"."GameResource", "public"."Grade", Topic_gradeId_idx

### Community 91 - "DashBits.tsx"
Cohesion: 0.20
Nodes (17): CATEGORIES, ContentLibrary(), metadata, AdminRowTopic, AdminTopicRow(), OPTIONS, TopicStatusMenu(), Kind3D() (+9 more)

### Community 92 - "assignments/[id]/page.tsx"
Cohesion: 0.18
Nodes (18): Actions(), AssignedBanner(), AssignmentResults(), fmtTime(), metadata, VideoResults(), isVoice(), questionResult() (+10 more)

### Community 93 - "stt/index.ts"
Cohesion: 0.16
Nodes (16): metadata, StudentAlphabet(), metadata, TeacherAlphabet(), azure(), CONTEXT, gateway(), GATEWAY_MODELS (+8 more)

### Community 94 - "lessonData.ts"
Cohesion: 0.18
Nodes (16): metadata, metadata, StudentTask(), metadata, StudentViewPage(), EyeIcon(), TopicLessonProps, gameFor() (+8 more)

### Community 95 - "admin/page.tsx"
Cohesion: 0.19
Nodes (14): AdminOverview(), AdminOverviewContent(), metadata, AdminTopics(), metadata, AutoSubmitSelect(), StatCard(), StatCardSkeleton() (+6 more)

### Community 96 - "lib/review.ts"
Cohesion: 0.14
Nodes (25): metadata, ReviewWork(), metadata, ReviewPage(), ReviewForm(), assignmentsForTeacherWhere(), decision, ReviewState (+17 more)

### Community 97 - "next"
Cohesion: 0.12
Nodes (26): next, zod, POST, POST, schema, POST, POST, body (+18 more)

### Community 98 - "vercel.json"
Cohesion: 0.40
Nodes (4): claude/natural-voice, git, deploymentEnabled, $schema

### Community 102 - "teacher/page.tsx"
Cohesion: 0.13
Nodes (32): metadata, ROLE_LABEL, ROLES, Schools(), Users(), UsersAndSchools(), ClassesPage(), metadata (+24 more)

### Community 103 - "voices.ts"
Cohesion: 0.14
Nodes (12): Kinds, last, PhraseKind, PHRASES, AUDIO_LANGUAGE_CODES, AUDIO_LANGUAGE_LABELS, EXTRA_AUDIO_LANGUAGES, ExtraAudioLanguage (+4 more)

### Community 104 - "activity/page.tsx"
Cohesion: 0.24
Nodes (11): ActivityLog(), metadata, ACTION_GROUPS, actionWhere(), ActivityEntry, ADMIN_ACTION_PREFIXES, describeActivity(), metaOf() (+3 more)

### Community 105 - "package.json"
Cohesion: 0.14
Nodes (13): dictionary-fr@^3.0.0, eslint-config-next@15.5.29, nspell@^2.1.5, @types/react@^19, name, prisma, seed, private (+5 more)

### Community 107 - "VideoPlayer.tsx"
Cohesion: 0.17
Nodes (15): ProtectedAudio(), protectedMediaProps(), STUDENT_MAX_RATE, useNoSeekAhead(), watchedToEnd(), Report, StudentWatch(), fmt() (+7 more)

### Community 108 - "dashboards.e2e.mjs"
Cohesion: 0.15
Nodes (7): db, errors, signedIn(), stamp, watch(), bcryptjs@^3.0.2, bcryptjs

### Community 109 - "learn/layout.tsx"
Cohesion: 0.26
Nodes (7): LearnLayout(), NavLinks(), Avatar(), AvatarKey, AVATARS, colors, Logo()

### Community 110 - "spanish-check.ts"
Cohesion: 0.23
Nodes (10): LT_LANG, POST, schema, ALWAYS, applyAll(), checkSpanish(), ESTAR, matchCase() (+2 more)

### Community 111 - "gateway.ts"
Cohesion: 0.36
Nodes (8): GET(), maxDuration, GatewayError, gatewaySpeech(), GatewaySpeechRequest, gatewayTranscribe(), sniff(), token()

### Community 112 - "LocalTime"
Cohesion: 0.31
Nodes (8): AccountPage(), metadata, ROLE, dayDiff(), formatLocal(), LocalTime(), ProfileForm(), updateProfile()

### Community 118 - "video-protect.e2e.mjs"
Cohesion: 0.22
Nodes (5): desktop, errors, stamp, state(), vid()

### Community 120 - "checkout/route.ts"
Cohesion: 0.57
Nodes (5): POST, POST, billingConfigured(), isLiveKey(), stripe()

### Community 121 - "actions/tasks.ts"
Cohesion: 0.36
Nodes (5): createTopicTask(), TaskResult, taskSchema, dedupeRecipients(), GroupInfo

### Community 122 - "generate.ts"
Cohesion: 0.33
Nodes (6): GET, speechSegments(), gatewayAvailable(), VoiceChoice, ttsProvider(), voicesFor()

## Knowledge Gaps
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `parts.tsx`, `db.ts`, `useVoiceSession.ts`, `layout.ts`, `PublicHeader`, `activityTypes.ts`, `Segmentación de texto`, `MyActivitiesBoard.tsx`, `db.ts`, `TopicHero.tsx`, `AuthLayout`, `library/types.ts`, `settings/page.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `CardPhotoForm.tsx`, `WsIcon`, `AudioField.tsx`, `Button`, `lessonData.ts`, `autocorrect.ts`, `Players.tsx`, `plainText`, `TopicLesson.tsx`, `TopicRow.tsx`, `audit`, `DashBits.tsx`, `requireStudentPage`, `ActivitySettings.tsx`, `GameEditor.tsx`, `ImageField.tsx`, `DashBits.tsx`, `admin/page.tsx`, `teacher/page.tsx`, `package.json`, `VideoPlayer.tsx`, `LocalTime`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Should `parts.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07367641614216956 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `games/service.ts`, `layout.ts`, `PublicHeader`, `mediaUrl`, `auth.ts`, `react`, `MyActivitiesBoard.tsx`, `db.ts`, `HttpError`, `TopicHero.tsx`, `library.ts`, `AuthLayout`, `library/types.ts`, `settings/page.tsx`, `Scripts de package.json`, `topics/[id]/page.tsx`, `WsIcon`, `Layout raíz`, `Button`, `lessonData.ts`, `classroom.ts`, `TopicLesson.tsx`, `preview/[id]/page.tsx`, `webhook.ts`, `TopicRow.tsx`, `audit`, `DashBits.tsx`, `CommunityView.tsx`, `storage/index.ts`, `requireStudentPage`, `VideoForm`, `ActivitySettings.tsx`, `resources/[id]/page.tsx`, `GameEditor.tsx`, `MyActivitiesView.tsx`, `DashBits.tsx`, `assignments/[id]/page.tsx`, `lessonData.ts`, `admin/page.tsx`, `lib/review.ts`, `teacher/page.tsx`, `activity/page.tsx`, `package.json`, `VideoPlayer.tsx`, `learn/layout.tsx`, `spanish-check.ts`, `gateway.ts`, `LocalTime`, `next.config.ts`, `middleware.ts`, `checkout/route.ts`, `actions/tasks.ts`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10857142857142857 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `db.ts` to `games/service.ts`, `library.ts`, `flow.e2e.mjs`, `topic-rows.e2e.mjs`, `Scripts de package.json`, `lextro.e2e.mjs`, `create-activity.e2e.mjs`, `webhook.ts`, `community.e2e.mjs`, `photo-form.e2e.mjs`, `topic-lesson.e2e.mjs`, `voice.e2e.mjs`, `playwright`, `library.e2e.mjs`, `video-player.e2e.mjs`, `flashcards-printables.e2e.mjs`, `storage/index.ts`, `assignments/[id]/page.tsx`, `admin/page.tsx`, `lib/review.ts`, `teacher/page.tsx`, `activity/page.tsx`, `package.json`, `dashboards.e2e.mjs`, `actions/tasks.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `20261025012814_init/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14532019704433496 - nodes in this community are weakly interconnected._
- **Should `useVoiceSession.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._