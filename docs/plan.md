# Implementation plan

Companion to [spec.md](spec.md). The spec says _what_; this document says _how_ and _in which order_. Where the plan deviates from or sharpens the spec, the item is marked **(spec deviation)** and listed again under _Open decisions_.

# Architecture decisions

## Stack

- Next.js 16 App Router, React 19, TypeScript. Server Components for pages, server actions for all mutations, client components only where interactivity requires (autosave forms, menus, editor).
- Prisma 8 with `@prisma/adapter-pg` on PostgreSQL. Prisma 8 is at release-candidate stage as of writing; use it per spec, and fall back to the latest 7.x only if a blocker appears (the schema and client API are the same).
- Bootstrap 5.3 (SCSS) and react-bootstrap. No Tailwind.
- `@con2/components` at the newest tag (v5.x; larpit-fi is on v3.1.0, kompassi-v2-frontend on v5.1.0), via `transpilePackages`.
- Zod for server action input validation.
- Node's built-in `crypto` for all cryptography. No crypto dependencies.
- Vitest for unit and integration tests, following the larpit-fi `*.integration.test.ts` and `globalSetup` migrate convention.
- Prettier, ESLint (`eslint-config-next`), husky and lint-staged, as in larpit-fi.

## Localization

Translations are TypeScript objects in `src/translations/en.tsx` (defines the `Translations` type) and `src/translations/fi.tsx` (typed against it), exactly as in larpit-fi. Components from `@con2/components` get `messages` sliced from these.

Unlike larpit-fi there is no `[locale]` route segment and no `next-intl`: the UI language is deployment configuration (`EVENT_LOCALE`, default `fi`). `getTranslations()` takes no argument and reads the configured locale. Finnish is the only language the first event will see, so English translations double as the key schema and must still be complete.

## Routing

No locale prefix. Pages are server components; each mutating page has a colocated `actions.ts`.

| Path                           | View                                       | Access             |
| ------------------------------ | ------------------------------------------ | ------------------ |
| `/`                            | Redirect: signed out → larpit.fi, else `/signup` | everyone     |
| `/i/[token]`                   | Sign In; after sign-in, Accept Invitation if needed, else redirect to `/signup` | everyone |
| `/signup`                      | Sign Up                                    | accepted invitees  |
| `/flagging`                    | Flagging                                   | see access control |
| `/practical`                   | Practical                                  | see access control |
| `/privacy`                     | Privacy and Danger Zone                    | accepted invitees  |
| `/profile/password`            | Change Password                            | accepted invitees  |
| `/players`                     | Players table                              | GM                 |
| `/players/invite`              | Create invites                             | GM                 |
| `/players/flags`               | Flags matrix                               | GM                 |
| `/players/flags/[userId]`      | One person's inbound and outbound flags    | GM                 |
| `/structure/vetting`           | Structure: vetting survey editor           | GM                 |
| `/structure/practical`         | Structure: practical survey editor         | GM                 |
| `/structure/choices`           | Structure: character group and fee choices | GM                 |
| `/structure/timeline`          | Structure: phase timestamps                | GM                 |
| `/structure/privacy-policy`    | Structure: privacy policy Markdown         | GM                 |
| `/api/health`                  | Health probe                               | everyone           |
| `/signout` (action)            | Clears the session cookie                  | signed in          |

Every page calls `cookies()` and is therefore dynamic; nothing with personal data is ever statically rendered or cached.

# Cryptography

All primitives come from Node `crypto`. Every stored ciphertext is prefixed with a one-byte format version so algorithms can be rotated later.

| Purpose                               | Primitive                                                        |
| ------------------------------------- | ---------------------------------------------------------------- |
| Password → key encryption key (KEK)   | Argon2id (`crypto.argon2`, available in Node 24); per-user random 16-byte salt; parameters stored next to the salt. Fall back to scrypt if Argon2 proves unavailable in the deployed runtime. |
| User key pair                         | X25519                                                           |
| Private key at rest                   | AES-256-GCM under the KEK                                        |
| Seal to a public key ("SELF" wrap)    | Ephemeral X25519 ECDH with the recipient's public key → HKDF-SHA256 → AES-256-GCM. Output: ephemeral public key, nonce, ciphertext, tag. |
| Audience keys (INVITEE, GM), data keys, recovery key | Random 32 bytes                                   |
| Wrap under a symmetric key            | AES-256-GCM with random 12-byte nonce                            |
| Record content                        | JSON → UTF-8 → AES-256-GCM under the record's data key, with the record id as additional authenticated data so ciphertexts cannot be swapped between rows |
| Invitation token                      | 32 random bytes, base64url, in the URL. Only its SHA-256 is stored. |
| Session cookie                        | JSON payload encrypted with AES-256-GCM under `SESSION_SECRET`; `HttpOnly`, `Secure`, `SameSite=Lax`, path `/` |

Password verification is implicit: the password is correct if and only if the private key decrypts (GCM tag verifies). There is no separate password hash.

## Module: `src/crypto/`

- `primitives.ts` – thin, tested wrappers: `deriveKek`, `generateKeyPair`, `seal`/`open` (to public key), `wrap`/`unwrap` (symmetric), `encryptJson`/`decryptJson`.
- `records.ts` – `readRecord(kind, ownerId, keys)` and `writeRecord(kind, ownerId, content, audiences, keys)`: unwraps the data key using whichever wrap the caller's keys can open (SELF, INVITEE, GM, in that order), decrypts; on write, reuses the existing data key if the caller can open it, otherwise creates one, and produces the wraps for the requested audiences.
- `session.ts` – `createSession(user, password)` (derive KEK, decrypt private key, unwrap audience keys, encrypt cookie), `readSession()`, `refreshSession()`, `destroySession()`.
- `recovery.ts` – unlocking audience keys with the recovery key (CLI only).

The session payload holds: `userId`, the user's X25519 private key, the INVITEE audience key, the GM audience key if present, `issuedAt`, `expiresAt`. About 150 bytes before encoding. Sessions last 12 hours; `proxy.ts` (Next middleware) re-issues the cookie on any request when it is more than 30 minutes old, which gives the sliding expiry.

# Data model

## Plaintext tables

```prisma
enum UserStatus { INVITED REVOKED ENTERED WITHDRAWN }

model User {
  id                  String     @id @default(uuid(4)) @db.Uuid
  invitationTokenHash Bytes      @unique
  status              UserStatus @default(INVITED)
  isGm                Boolean    @default(false)
  passwordPending     Boolean    @default(true)   // true after invite and after GM-led reset
  publicKey           Bytes
  encryptedPrivateKey Bytes                       // AES-GCM under KEK
  kdfSalt             Bytes
  kdfParams           Json
  inviteeKeyWrap      Bytes                       // INVITEE audience key sealed to publicKey
  gmKeyWrap           Bytes?                      // GM audience key sealed to publicKey; null unless isGm
  failedSignIns       Int        @default(0)
  lockedUntil         DateTime?
  createdAt, updatedAt
  records             EncryptedRecord[]
}

enum RecordKind { VETTING_RESPONSE FLAGS PRACTICAL_RESPONSE PLAYER_ATTRIBUTES CASTING_RESULT }

model EncryptedRecord {
  id              String     @id @default(uuid(4)) @db.Uuid
  kind            RecordKind
  ownerId         String     @db.Uuid
  owner           User       @relation(onDelete: Cascade)
  ciphertext      Bytes
  inviteeKeyWrap  Bytes?     // data key wrapped under INVITEE audience key
  gmKeyWrap       Bytes?     // data key wrapped under GM audience key
  selfKeyWrap     Bytes?     // data key sealed to owner's public key
  createdAt, updatedAt
  @@unique([kind, ownerId])
}

model Event {           // singleton row
  id                        Int      @id @default(1)
  signupStartsAt, previewStartsAt, signupEndsAt    DateTime?
  flaggingStartsAt, flaggingEndsAt                 DateTime?
  practicalStartsAt, practicalEndsAt               DateTime?
  castingCompletedAt        DateTime?
  privacyPolicy             String   @default("")
  characterGroups           Json     // Choice[]
  feeCategories             Json     // Choice[]
  inviteeKeyRecoveryWrap    Bytes    // audience keys wrapped under the recovery key
  gmKeyRecoveryWrap         Bytes
}

enum SurveySlug { vetting practical }

model Survey {
  slug    SurveySlug @id
  fields  Json       // Field[]
  updatedAt
}
```

## Record contents and audiences

| Kind                 | Content (JSON)                                                                 | Wraps        |
| -------------------- | ------------------------------------------------------------------------------ | ------------ |
| `VETTING_RESPONSE`   | `{ values, completed: boolean }`; `values.name`, `values.discord_handle` magical | INVITEE    |
| `FLAGS`              | `{ flags: { [targetUserId]: "RED" \| "YELLOW" \| "GREEN" }, completed }`; NEUTRAL is absence | SELF, GM |
| `PRACTICAL_RESPONSE` | `{ values, completed }`                                                        | SELF, GM     |
| `PLAYER_ATTRIBUTES`  | `{ castingDecision: "SELECTED" \| "NOT_SELECTED" \| null, characterName, characterGroup, feeCategory, feePaid }` | GM |
| `CASTING_RESULT`     | `{ result: "SELECTED" \| "NOT_SELECTED", mutualGreens: userId[] }`             | SELF, GM     |

**(spec deviation)** The spec lists SELECTED and NOT SELECTED among the plaintext-looking invitee statuses and puts the "user record" under the GM audience. Here the plaintext `status` column carries only the four low-sensitivity states, and the casting decision lives in the GM-only `PLAYER_ATTRIBUTES` record. Casting completion copies it into a `CASTING_RESULT` record readable by the subject. This means casting choices are never in plaintext, while the plaintext status still lets the server do access control (withdrawn? accepted?) in any session without decrypting other users' records, which an invitee's session could not do. The Players view presents the combined six-state status exactly as the spec describes; the UI is unchanged.

What remains in plaintext about a person is a UUID, four coarse states, GM flag, public key material and timestamps. Correlating a UUID with a person requires decrypting a response.

# Access control

`src/auth/viewer.ts` exposes `getViewer()` which reads the session, loads the `User` row, loads the `Event` row and computes `phase`, and loads the viewer's own `CASTING_RESULT` if casting is completed. All pages and actions start by calling it and then one of the predicates in `src/auth/permissions.ts`:

- `canSeeSignup`, `canEditSignup` (ENTERED, sign-up period open)
- `canSeeFlagging` (own vetting response completed, preview started, not WITHDRAWN; after casting completion, selected players see others, non-selected see names-only mode)
- `canEditFlags` (flagging period open, ENTERED, own response completed)
- `canSeePractical`, `canEditPractical`
- `isGm`

Phases are derived purely from `Event` timestamps and `now`, in `src/models/phase.ts`, with unit tests covering the matrix. Casting completion is a separate boolean dimension.

Actions re-check permissions server-side; the UI only hides what the predicates deny.

# Survey builder port

Port from `kompassi-v2-frontend/src/components/forms/` into `src/components/forms/`. Field types kept: `StaticText`, `SingleLineText`, `MultiLineText`, `MarkdownText`, `NumberField`, `SingleSelect`, `MultiSelect`, `RadioMatrix`. Removed: Divider, Spacer, SingleCheckbox, Tristate, FileUpload, Decimal, Date, Time, DateTime, MultiItemField and all Dimension types; `encryptTo`, `isKeyField`, `summaryTitle`, annotation and dimension propagation props, the promote-to-dimension action, `AutosaveSchemaForm` and draft files (we autosave server-side instead), `AnonymityNotice`, `AlsoAvailableInLanguage`, `ProfileResponsesTable`.

Files to port and strip: `models.ts`, `SchemaForm.tsx`, `SchemaFormField.tsx`, `SchemaFormInput.tsx`, `Heading.tsx`, `processFormData.ts`, `FormEditor.tsx`, `FormEditorWrapper.tsx`, `FormEditorControls.tsx`, `formEditorLogic.ts`, `newField.ts`, `AddFieldDropdown.tsx`, `EditFieldModal.tsx`, `editFieldForm.ts`, `LegacyModal.tsx`, `FormEditor.scss`.

Added:

- `SchemaFormResponse.tsx` – the readable read-only representation the spec asks for: definition-list style, `Linebreaks` for multiline, `Markdown` for Markdown text, choice titles rather than slugs, a table for radio matrix.
- `AutosaveSchemaForm.tsx` (new meaning) – client wrapper that debounces `input`/`change` events (about 1 s, with a flush on blur and on `beforeunload`), posts `FormData` to a server action, and renders a Saving/Saved/Error indicator. Used by Sign Up and Practical.
- `validateRequired(fields, values)` – returns missing required slugs, used for the COMPLETED-with-missing-fields warning.
- The editor warns when the vetting survey lacks `name` or `discord_handle`.

The form builder stays in the app, not in `@con2/components`, per that library's guidance.

# Contributions to `@con2/components`

- `PasswordStrengthMeter` (feat): a progress bar plus label driven by `@zxcvbn-ts/core` with the `en` and `fi` language packs, lazily imported on the client so the dictionaries do not land in the initial bundle. `messages` prop for the five strength labels. Demo page and tests per the library's rules; Conventional Commit `feat:` so a release is cut.

Everything else (theme switch, app bar, flag buttons) has a single caller and stays in the app.

# Command line

`src/bin/`, run with `tsx`:

- `init.ts` – refuses to run if `Event` exists. Generates audience keys and recovery key, writes `Event` (recovery wraps, empty timeline), seeds both `Survey` rows (vetting with `name` and `discord_handle` fields), creates the first GM user. Prints the invitation link, initial password and recovery key once.
- `add-gm.ts` – `--token <invite token> --password` (prompted) for an existing GM, or `RECOVERY_KEY` from the environment. Either `--discord-handle <handle>` to create a new GM invite, or `--promote <userId>` to set `isGm` and add `gmKeyWrap` to an existing invitee.
- `seed-dev.ts` – development only: init plus a few dozen fake invitees in various states, with known passwords, so every view has data.

# Views: implementation notes

- **App bar**: react-bootstrap `Navbar` as in larpit-fi `Navigation.tsx`. Links shown based on `getViewer()` predicates. Profile menu title is `values.name` from the viewer's own vetting response. Theme switch sets a `theme` cookie (`dark`, `light`, `system`); the root layout sets `data-bs-theme` from it, and a tiny inline script resolves `system` before paint. Default dark.
- **Casting result banner**: rendered by the root layout above `children` whenever the viewer has a `CASTING_RESULT`; WITHDRAWN shows its own banner.
- **Sign In** (`/i/[token]`): hash the token, find the user, check `lockedUntil`, attempt `createSession`; on failure increment `failedSignIns` and set `lockedUntil` with exponential backoff after five failures. REVOKED is reported after a successful decrypt and no session is issued.
- **Accept Invitation**: same URL, shown when `passwordPending`. Sets name into the vetting response (if `name` empty or first acceptance), re-encrypts the private key under the new password, clears `passwordPending`, sets INVITED → ENTERED. Shows the Discord handle, the bookmark instruction and the "this is not yet a sign-up" notice.
- **Sign Up**: `AutosaveSchemaForm` over the vetting survey; completion switch is its own small action; required-fields warning; read-only outside the period via `SchemaFormResponse`.
- **Flagging**: one card per other COMPLETED, non-withdrawn invitee with `SchemaFormResponse` and a four-way `ToggleButtonGroup`; flag changes save per target through a debounced action that rewrites the viewer's `FLAGS` blob; completion switch; mutual green badge from `CASTING_RESULT`.
- **Practical**: as Sign Up, with `PRACTICAL_RESPONSE`.
- **Privacy**: `Markdown` of `Event.privacyPolicy`; Danger Zone with a confirm modal (`ModalButton`) calling `withdraw()`.
- **Players**: server component decrypts all users' vetting responses, attributes and survey completion flags (about 60 rows, in memory) and renders `DataTable`; filters via search params. Editable cells are small client components posting to actions (`AutoSubmitForm` from the library where it fits). Status select maps the six-state UI status onto `status` plus `castingDecision`. Header: casting toggle with confirm both ways, link to invite creation, link to Flags.
- **Create invites**: textarea of Discord handles; action creates users and pre-seeded vetting responses; result table with handle, link, initial password and `CopyButton`s; a notice that passwords are shown once.
- **Flags**: matrix with `ColorBadge`-style cells and totals row; per-person page with inbound and outbound lists. Decrypts every `FLAGS` blob in the GM session.
- **Structure**: `ServerTabs`; survey tabs mount `FormEditorWrapper` whose `onChange` action saves `Survey.fields`; choices tab edits `Event.characterGroups`/`feeCategories` as `slug: title` lines like the Kompassi choice editor; timeline tab uses `DateTimeInput` for each timestamp in the event time zone; privacy policy tab uses `MarkdownEditor`.

# Mutations with side effects

- `completeCasting()` – GM only. Decrypts all `FLAGS` and `PLAYER_ATTRIBUTES`; for each ENTERED user with a casting decision writes `CASTING_RESULT` (mutual greens only between SELECTED); sets `castingCompletedAt`. Runs in one transaction. `revertCasting()` deletes all `CASTING_RESULT` rows and clears the timestamp.
- `resetPassword(userId)` – GM only. New key pair and initial password; `passwordPending = true`; re-seal `inviteeKeyWrap` (and `gmKeyWrap`); for every record of that owner with a `selfKeyWrap`, unwrap the data key via `gmKeyWrap` and re-seal it. Returns the initial password for one-time display.
- `withdraw()` – self. Sets WITHDRAWN. No data changes.
- `deleteUser(userId)` – GM only, WITHDRAWN only. In one transaction: rewrite every other user's `FLAGS` blob without the target, rewrite `CASTING_RESULT` blobs dropping the target from `mutualGreens`, delete the user (records cascade).
- `changePassword()` – self. Re-encrypts the private key; re-issues the session.

# Logging and errors

Server actions throw typed errors with translation keys and never include request payloads in messages. No request logging middleware. Health endpoint logs nothing.

# Testing

- Unit: `src/crypto/primitives.test.ts` (round trips, tamper detection, wrong password), `records.test.ts` (wrap selection, re-wrap), `phase.test.ts`, `permissions.test.ts` (status × phase × completion matrix), `formEditorLogic.test.ts`, `processFormData.test.ts`, `SchemaFormResponse.test.tsx`.
- Integration (Postgres via `TEST_DATABASE_URL`): full lifecycle in `src/models/lifecycle.integration.test.ts`: init → invite → accept → respond → preview visibility → flag → cast → derive mutual greens → reset password keeps data → withdraw → delete scrubs flags → revert casting.
- Manual: `seed-dev.ts` plus a checklist in `docs/manual-test.md` walked through once per milestone.

# Deployment

- `Dockerfile` as in larpit-fi: `deps`, `builder` (also used as the migration init container image), `runner` (standalone output).
- `chart/`: a minimal Helm chart modelled on `kompassi/chart`: `Chart.yaml`, `values.yaml` (placeholders), `values-production.yaml` (`hostname: hardwood.larpit.fi`), templates for Deployment (with `migrate` init container running `prisma migrate deploy`), Service, Gateway with http and https listeners and cert-manager annotation, HTTPRoutes (https redirect and app), and a Secret template skipped when `existingSecretName` is set. Health probes on `/api/health`.
- Environment: `DATABASE_URL`, `SESSION_SECRET` (secret); `PUBLIC_URL`, `EVENT_NAME`, `EVENT_LOCALE`, `EVENT_TIMEZONE`, `LARPIT_URL` (config map).
- `.github/workflows/cicd.yaml`: lint, test, build image to `ghcr.io`, `helm upgrade --install hardwood chart --namespace hardwood-production`. One environment only; a staging namespace can be added by adding a values file.
- Production bring-up: deploy, then `kubectl exec` into the pod and run `init.ts`; store the recovery key offline; hand the GM link to the admin.

# Milestones

Each milestone ends with `npm run lint`, `npm test`, a manual walk-through and a commit. Rough effort in focused days.

## M0 – Scaffold (1)

- Create the Next.js app in the repo root, copy tooling conventions from larpit-fi (tsconfig, eslint, prettier, husky, Dockerfile, scripts).
- Prisma 8 setup, `prisma.ts`, `config.ts`, `/api/health`.
- Translations skeleton with `getTranslations()`; `en.tsx` and `fi.tsx` with app bar and sign-in keys.
- Root layout, app bar shell, theme cookie and `data-bs-theme`, Bootstrap SCSS, dark default.
- `CLAUDE.md` for the repo (commands, conventions, worktree port note).

## M1 – Crypto, users, sessions (3)

- `src/crypto/*` with unit tests.
- Prisma schema and first migration.
- `init.ts`, `add-gm.ts`.
- Sign In, Accept Invitation, Change Password, Sign Out, session refresh in `proxy.ts`, rate limiting.
- Players view skeleton listing users with status only (no decryption yet), so the GM can see the invite worked.
- Acceptance: a GM created by `init.ts` signs in, sets a password, signs out and in again; a wrong password locks after five tries.

## M2 – Survey builder and Structure (3)

- Port and strip the form components; `SchemaFormResponse`; unit tests.
- Structure view with all five tabs; `Survey`, `Event` choices, timeline, privacy policy actions.
- Acceptance: a GM edits the vetting survey, adds each field type, reorders, removes, and sees the `name`/`discord_handle` warning when deleting those.

## M3 – Sign Up and phases (2)

- `phase.ts`, `permissions.ts` with tests.
- `AutosaveSchemaForm`, Sign Up view, completion switch, required warning, read-only mode.
- Acceptance: an invitee's edits persist across reloads; nothing saves after `signupEndsAt`.

## M4 – Players and invites (3)

- Create invites with pre-seeded Discord handles; one-time credentials table.
- Full Players table with decrypted columns, filters, editable attributes, status select, copy link, reset password, delete.
- `completeCasting`/`revertCasting` (derivation of `CASTING_RESULT` without mutual greens until M5).
- `seed-dev.ts`.
- Acceptance: reset password on a user with a vetting response, accept again, response intact. Delete a withdrawn user, row gone.

## M5 – Flagging and Flags (3)

- Flagging view with preview mode, flag controls, completion, names-only mode after casting.
- GM Flags matrix and per-person page.
- Mutual green derivation added to `completeCasting`; badges in Flagging; deletion scrubs flags.
- Lifecycle integration test.
- Acceptance: two selected players who green each other see the badge after casting; a third does not.

## M6 – Practical, Privacy, result banner (1.5)

- Practical view, Privacy view with withdraw, casting result and WITHDRAWN banners.
- Acceptance: withdrawn user sees only read-only own data and Privacy.

## M7 – Polish, components release, deployment (2.5)

- `PasswordStrengthMeter` in `@con2/components`, release, bump dependency.
- Finnish translation review; no-email notices; empty states; narrow-screen app bar.
- Helm chart, CI workflow, production deploy, `init.ts` in production, recovery key stored offline.
- `docs/operations.md`: init, adding GMs, password resets, backups, what the recovery key does.

Total: roughly 19 focused days.

# Open decisions

1. **Casting decision in GM-only attributes, plaintext status reduced to four states (spec deviation).** Recommended as described above. If declined, SELECTED/NOT SELECTED go into the plaintext `status` column.
2. **Prisma 8 release candidate.** Use it; fall back to 7.x if blocked.
3. **No `next-intl`, no locale segment.** Translations architecture otherwise identical to larpit-fi.
4. **Password strength via `@zxcvbn-ts`** (lazy-loaded, ~400 kB of dictionaries) versus a simple length-and-class heuristic with no dependency. Recommended: zxcvbn, since the meter is advisory and the dictionaries load only on the Accept Invitation and Change Password pages.
5. **Gateway API vs Ingress.** The chart follows kompassi's Gateway API and Traefik middleware pattern, assuming hardwood gets its own Gateway in its namespace. If the cluster convention has moved on, swap to whatever `infrastructure/` currently prescribes.

# Risks

- Casting completion and deletion rewrite many records in one transaction while the GM's request is in flight. At 60 users this is milliseconds; the code should still be written as a single Prisma transaction so a failure leaves no half-derived state.
- Argon2 in Node is new; the primitives module isolates it so swapping to scrypt is one function.
- Autosave of encrypted blobs is last-write-wins; two tabs editing the same survey can overwrite each other. Acceptable for this audience; the Saved indicator shows the server state.
- The invitation URL is the only identifier a user has. If they lose both bookmark and Discord message, a GM copies the link again from Players. Document this for GMs.
