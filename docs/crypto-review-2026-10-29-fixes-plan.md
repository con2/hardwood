# Hardwood cryptography review fixes

## Context

The 2026-10-29 adversarial review (assessed in `docs/crypto-review-2026-10-29.md`, commit 30d9bfa)
found that a database writer can harvest every data key by swapping `Event.gmPublicKey` (F1),
that sessions cannot be revoked (F4), that ciphertext length leaks flag counts and colours (F5),
that flags can be forged or re-owned (F6), and that backup security equals the weakest GM
password (F7). Decisions: fix F1, F4, F6, F5, F7, then F8 (rotation) and F9 (docs); accept F2
and F3 as documented tradeoffs; enforce password strength by role (zxcvbn score 2 for invitees,
3 for GMs; spec and plan already updated).

Production holds a live test run with real records. The database must survive: every format
change is two-step (server tolerates old and new, a recovery-key CLI converts, a follow-up
commit drops the old format). Real sign-ups start on Sunday; re-initialising then is the
fallback, not the plan.

Work on `main`, Conventional Commits, one commit per phase below. The owner pushes.

## Phase 1: F1, root the GM public key outside the database

**Principle.** Nothing seals to a public key read from the database without verifying it.

- `src/config.ts`: add `gmPublicKey = secretEnv("GM_PUBLIC_KEY", "")` style value: required
  in production, optional in development and tests (empty means "trust the Event row", which
  only `production === false` may do).
- `src/crypto/records.ts`: replace `getGmPublicKey(q)` with `gmPublicKeyFor(keys, q)`:
  - if `keys.gmKey` is set, return `publicKeyFromPrivate(keys.gmKey)` (GM sessions and the
    CLI never trust the row);
  - else return the pinned `gmPublicKey` from config; in non-production with no pin, fall
    back to the Event row.
    Use it in `writeRecord` for the GM wrap. Delete the duplicate `getGmPublicKey` in
    `src/models/user.ts` (`createInvite` holds `gmKey`, so it derives the key).
- User key binding: new nullable column `user.public_key_binding` (text) =
  `wrap(publicKey, bindingKey, aad = userId)` where `bindingKey = HKDF(inviteeKey,
"hardwood-key-binding-v1")`. `wrap`/`unwrap` in `primitives.ts` gain an optional `aad`.
  - Written by `createInvite` and `resetPassword` (`src/models/user.ts`), and by `signIn`
    when the row has none (self-heal: the session proved it holds the private key matching
    `publicKey`, and holds `inviteeKey`).
  - `getUserPublicKey` in `records.ts` and `promoteToGm` verify the binding before sealing.
    Transition rule: a missing binding is tolerated with a `console.warn` (no PII; user id is
    fine) until phase 8 makes it a hard `CannotDecrypt`-style error (`UnboundKey`). A present
    but wrong binding is always an error.
  - Callers passing `ownerPublicKey` from the viewer's own row (`flags.ts`, `practical.ts`)
    are already covered by `keysMatchUser` and stay as they are.
- `src/auth/viewer.ts` `getViewer`: for a session with `gmKey`, if a pin is configured and
  `publicKeyFromPrivate(gmKey)` differs from it, throw (loud failure on every GM page, which is
  the point). Also compare against `Event.gmPublicKey` and throw on mismatch: a swapped row is
  then visible immediately, not only when Flags fails.
- `src/models/bootstrap.ts` `Initialized` gains `gmPublicKey`; `src/bin/init.ts` prints it
  with the instruction to put it in the chart values. `src/bin/add-gm.ts` prints it too.
- Chart: `event.gmPublicKey` in `values.yaml` (empty) and `values-production.yaml`, rendered
  into `configmap.yaml` as `GM_PUBLIC_KEY`. The configmap checksum restarts the pod.
- Migration: `npm run db:plan -- public_key_binding` (nullable column, no backfill).
- Tests: `records.integration.test.ts` gains "refuses to seal to a user whose key binding does
  not match"; `user.integration.test.ts` gains "sign-in writes a missing key binding";
  a unit test for `wrap` with aad.

## Phase 2: F4, revocable sessions

- `src/crypto/sessionCodec.ts`: payload version 2 with `authenticatedAt` (set at sign-in,
  never advanced by refresh) and `epoch` (copied from the user row at sign-in). `decodeSession`
  rejects version 1 (everyone signs in again once) and rejects when
  `now - authenticatedAt >= absoluteMaxAge`. `encodeSession` takes the full `Session` minus
  `issuedAt`/`expiresAt` so the proxy refresh carries both fields through.
- `src/config.ts`: `sessionAbsoluteMaxAgeSeconds = 7 * 24 * 60 * 60`.
- `src/crypto/session.ts`: `readSession` returns the whole `Session`; `createSession(keys,
{ epoch, authenticatedAt })`.
- Contract: `user.session_epoch int4 not null default 0`. Migration
  `npm run db:plan -- session_epoch`.
- `src/auth/viewer.ts`: after `keysMatchUser`, `if (session.epoch !== user.sessionEpoch)
return null`.
- `src/models/user.ts`: `changePassword` and `resetPassword` increment `sessionEpoch` in the
  same update; `changePassword` returns the new epoch so the action re-issues the caller's own
  cookie with it. New `signOutEverywhere(userId)` increments it.
- `src/app/actions/session.ts`: `signOutEverywhere` action (bump, destroy cookie, redirect).
  `src/components/AppBar.tsx` profile menu: item after Sign Out; `AppBar.signOutEverywhere`
  in `en.tsx` and `fi.tsx` ("Kirjaudu ulos kaikkialta"). `AppBar.test.tsx` updated.
- Call sites of `createSession` (`src/app/i/[token]/actions.ts` sign-in and accept,
  `src/app/profile/password/actions.ts`): sign-in sets `authenticatedAt = now`; accept and
  password change keep the session's `authenticatedAt` and use the current epoch.
- Tests in `sessionCodec.test.ts`: absolute expiry, version 1 rejected, refresh keeps
  `authenticatedAt`.

## Phase 3: F6, authenticated record identity and origin

- `src/crypto/primitives.ts`: record blob format version 2. `encryptJson`/`decryptJson` take a
  structured aad `{ id, kind, ownerId }` serialised as `id|kind|ownerId` for records; event
  settings and surveys keep their string aad. The version byte is already checked by
  `decodeBlob`; add `blobVersion(blob)` so readers can branch.
- Authenticator: HMAC-SHA256 under `HKDF(inviteeKey, "hardwood-record-mac-v1")` over
  `version || id || kind || ownerId || ciphertext`, stored in new nullable column
  `encrypted_record.mac` (text, base64url). Helpers `recordMac(...)` / `verifyRecordMac(...)`
  in `src/crypto/records.ts`; both `Keys` and `AudienceKeys` carry `inviteeKey`, so every
  reader and writer can compute it.
- `writeRecord` always writes version 2 plus `mac`. `readRecord`/`readAllRecords`: version 2
  requires a valid mac (else `CannotDecrypt`); version 1 (no mac, aad = id) is accepted during
  the transition and dropped in phase 8.
- Migration `npm run db:plan -- record_mac` (nullable column).
- `rewrapSelfKeys` and the record rewrite paths (`removeFlagsOn`, `recomputeCastingResults`,
  `deletePlayer`) go through `writeRecord` already, so they upgrade rows as they touch them.
- Tests: "refuses a record whose owner was changed", "refuses a forged record sealed to the GM
  key without a mac", "still reads a version 1 record" (removed in phase 8).

## Phase 4: F5, fixed-size plaintexts

- `encryptJson` pads the JSON text with trailing spaces to the next multiple of 4096 bytes
  (`JSON.parse` ignores trailing whitespace, so no framing is needed). Applies to records,
  event settings and surveys alike. A `padTo` parameter with the default 4096 keeps it
  testable.
- Unit test: ciphertext length is identical for one red flag and for six green flags.
- Row-existence leak of `CASTING_RESULT` / `PLAYER_ATTRIBUTES` is out of scope (documented in
  the review assessment).

## Phase 5: F7, KDF pepper and password strength

**Pepper**

- `src/config.ts`: `kdfPepper = secretEnv("KDF_PEPPER", "insecure-dev-pepper")`.
- `KdfParams` argon2id variant gains `peppered?: true`; `deriveKek` passes
  `secret: pepper` when set (`node:crypto` `argon2` supports `secret`; Node 24 in the image).
  `defaultKdfParams.peppered = true`.
- `signIn` (`src/models/user.ts`): after a successful unlock with unpeppered params,
  re-encrypt the private key under the default params (same password, in hand at that moment).
- Chart: `KDF_PEPPER` in `secret.yaml` (`secret.kdfPepper`), README Secret creation line
  (`--from-literal=KDF_PEPPER="$(openssl rand -base64 32)"`), `values.yaml` comment.
  `operations.md`: losing the pepper loses password unlocks; the recovery key still works.
- Test: unlock succeeds after the lazy upgrade; a wrong pepper fails to unlock.

**Strength**

- New `src/auth/passwordStrength.ts` (no `"use client"`): the zxcvbn factory setup moved out
  of `src/components/PasswordStrengthMeter.tsx`, exporting `loadPasswordCheck(locale)` and
  `requiredScore(isGm) => isGm ? 3 : 2`. The meter imports it and gains a `requiredScore`
  prop to show the threshold (label text "below required").
- `src/app/i/[token]/actions.ts` and `src/app/profile/password/actions.ts`: after the
  passwords-differ check, `score < requiredScore(viewer.user.isGm)` returns
  `{ error: "tooWeak" }`. Add `tooWeak` to both state unions and to `AcceptInvitation.errors`
  and `ChangePassword.errors` in `en.tsx`/`fi.tsx`. The check stays in the actions, not the
  model functions, so `user.integration.test.ts` keeps its weak test passwords.
- Pages pass `requiredScore` to the forms (`viewer.user.isGm` is available in both).
- Tests: unit test of `requiredScore`; `PasswordStrengthMeter.test.tsx` threshold label.

## Phase 6: `upgrade` CLI, run once per deployment with the recovery key

`src/bin/upgrade.ts` (`npm run upgrade`), unlocked with `RECOVERY_KEY` or a GM token like
`add-gm`:

1. Print `Event.gmPublicKey` for the chart value and confirm it matches the GM key.
2. For every user without a `public_key_binding`, write one (the audience keys suffice: the
   binding is under the INVITEE key).
3. For every `encrypted_record` in blob version 1: open the data key through the INVITEE or
   GM wrap, decrypt with the old aad, write it back through `writeRecord` (new aad, mac,
   padding, same data key and audiences). Report counts; idempotent.
4. Re-encrypt event settings and surveys the same way (padding only).

Rollout order for the test run: deploy phases 1 to 5 (server tolerates version 1 records and
unbound keys), set `GM_PUBLIC_KEY` and `KDF_PEPPER` in the cluster, run `upgrade` from a
laptop over a port-forward, then deploy phase 8.

## Phase 7: F8, audience key rotation CLI

`src/bin/rotate-key.ts -- --audience gm|invitee`, recovery key or GM token:

- GM: new X25519 pair; for every record with a `gmKeyWrap`, open with the old key, seal to the
  new; re-seal `invitationTokenWrap`; re-wrap `gmKeyWrap` for every `isGm` user and the recovery
  wrap; write the new `Event.gmPublicKey`; print it for the chart (deploy required, which is
  the intended bar). `--demote <userId>` clears that user's `gmKeyWrap` and `isGm` first.
- INVITEE: new symmetric key; re-wrap record and event/survey wraps, every user's
  `inviteeKeyWrap`, all key bindings and all macs (both derive from it), and the recovery wrap.
- Documented in `operations.md` as the response to a departed GM or admin.

## Phase 8: hardening follow-up and documentation

- Drop version 1 record reading; unbound key becomes a hard error; `isGm` promotion refuses
  without a binding.
- `docs/spec.md` threat model: the Secret holder is the compromised-server adversary (F2/F3
  accepted); cluster admins may be invitees and GMs; absolute session lifetime; key binding;
  record authenticator; padding; pepper.
- `docs/operations.md` and `chart/README.md`: run `init`, `add-gm`, `upgrade` and
  `rotate-key` from a laptop against a port-forwarded database (`kubectl -n larpit-hardwood
port-forward svc/<cnpg rw service> 5433:5432`, `DATABASE_URL` from the Secret with the host
  swapped); keep `kubectl exec` as fallback. GM public key pinning and rotation.
- CLAUDE.md "Auth and crypto" paragraph updated (pin, binding, mac, padding, epoch, pepper).

## Verification

- `npm run typecheck && npm run lint && npm test && npm run test:integration` after each phase
  (integration tests need the local `hardwood_test` database; `globalSetup` migrates it).
- Manual, with `npm run seed:dev --reset` then the old-format path: seed on the previous
  commit, switch to the new code, run `npm run upgrade`, sign in as `japsu` and as a seeded
  invitee, check Flags, Players, casting completion, deletion of a withdrawn player.
- Negative checks via psql on the dev database: swap `event.gm_public_key` (GM page must
  fail loudly), change an `encrypted_record.owner_id` (GM Flags must report CannotDecrypt),
  set a user's `session_epoch` higher (that user is signed out).
- Cookie: sign in, wait past the refresh threshold, confirm `authenticatedAt` unchanged
  (decode with the dev secret in a one-off script); change password in one browser and
  confirm the other browser is signed out.
- Browser clicks are the owner's (headless Chrome is blocked from this shell).
