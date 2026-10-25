# Student privacy & security notes

Status: engineering design notes. **Not legal advice — needs review by the school district's counsel
before use with students.**

## Implemented

- **Data minimization**: students have first name, last initial, optional full name (only for the
  "Spell Your Name" activity), avatar color, hashed 4-digit PIN, class and groups. No email, birth
  date, photo or address.
- **No voice storage**: audio is captured only while an oral activity runs (visible "mic on"
  indicator + stop button), streamed to the recognizer, and discarded. Only the text transcript and
  scoring data are stored.
- **Tenant isolation**: every row is scoped to a school; teacher queries are filtered by school and,
  for classes/students, by the owning teacher (`src/lib/access.ts`). Students only see assignments
  that target them (directly, their class, level or group). Verified by the e2e test (other group →
  404, other school → 404, students → 401 on teacher APIs).
- **Auth**: bcrypt-hashed passwords and PINs; random 256-bit session tokens stored only as SHA-256;
  httpOnly, SameSite=Lax, Secure (in production) cookies; student sessions last one school day;
  student accounts lock for 5 min after 5 wrong PINs; teacher sign-in is rate limited.
- **Files**: uploads validated by magic bytes (PNG/JPEG/GIF/WebP, ≤5 MB, SVG refused), stored
  outside the public folder, served only to signed-in users of the same school with `nosniff`.
- **Headers**: CSP, `Permissions-Policy: microphone=(self)`, no framing, HSTS.
- **Secrets**: provider keys only in server env vars; the browser never receives them.
- **Audit log**: sign-ups, class/student/group changes, PIN resets, publish, assign, delete.
- **No advertising**, no third-party analytics.

## Third parties that receive data (document in the school's vendor list)

| Service | When | Data |
|---|---|---|
| Microsoft Azure Speech | if `STT_PROVIDER=azure` | student voice audio per answer (not retained by us) |
| Google Cloud Speech-to-Text | if `STT_PROVIDER=google` | student voice audio per answer |
| Google (Chrome Web Speech API) | if no server STT is configured | student voice audio, sent by Chrome |
| Azure / Google TTS | when teachers generate audio | teacher-written text only |
| LanguageTool | if `LANGUAGETOOL_API_URL` set | teacher-written text only |

Prefer a server provider with a signed data processing agreement over the Chrome fallback for
classroom use.

## Pending (needs decisions / legal review)

- COPPA: the school-authorization exception requires a written agreement with each school and a
  direct notice; parental access/deletion workflow to be built (Phase 5).
- FERPA: designate the platform as a "school official" in the district contract; define the
  records-request process.
- Retention: default policy not yet enforced automatically (proposal: transcripts deleted 1 year
  after the school year ends; a teacher-triggered "delete student and all data" exists via cascade
  but needs a UI with confirmation).
- State laws (e.g. California SOPIPA, New York Ed Law 2-d) and each provider's DPA.
- Multi-instance rate limiting needs a shared store (currently in-memory for teacher login/TTS/STT).
