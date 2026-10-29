# Cryptography review of 2026-10-29: assessment and decisions

Assessment of the adversarial review of commit e87ba1c (findings F1 to F9), checked against the
code at ef93a52. Neither commit since the review touches the crypto layer. All nine findings are
real. This document records which fixes we take, which we decline, and why. The implementation
plan follows separately.

## Decisions in short

| #   | Finding                                           | Decision                                                                                                               |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| F1  | Database write swaps the GM public key            | Fix: pin the GM public key in deployment config, bind user public keys under the INVITEE key, verify in the GM session |
| F2  | Admin who is an invitee reads all vetting answers | Accept as a documented tradeoff                                                                                        |
| F3  | Sniffed cookie yields raw keys                    | Accept as a documented tradeoff; no opaque sessions, no in-pod TLS                                                     |
| F4  | Stolen cookie renews forever                      | Fix: absolute lifetime and per-user session epoch                                                                      |
| F5  | Ciphertext length leaks flag counts and colours   | Fix: pad plaintexts to a fixed bucket per record kind                                                                  |
| F6  | Flags can be forged or re-owned                   | Fix: extend the AAD and add an authenticator keyed from the INVITEE key; no per-user signing keys                      |
| F7  | Backup security equals the weakest GM password    | Fix: KDF pepper from the Secret; minimum password strength by role (modest for invitees, strong for GMs)               |
| F8  | No key rotation, no demotion                      | Fix later: audience key rotation CLI                                                                                   |
| F9  | Recovery and add-gm run inside the pod            | Docs only: run the tools from a laptop over a port-forward                                                             |

Spec decisions:

- Minimum password strength is enforced for everyone, by role: zxcvbn score 2 for invitees, 3 for
  GMs. The spec's "do not block weak passwords" is withdrawn: a server-side check needs the same
  machinery for one role as for all, and a modest bar keeps the friction low for invitees.
- Cluster admins may be invitees and GMs. The spec's threat model will say so explicitly and
  will state that holding the Kubernetes Secret or pod network access is equivalent to a
  compromised application server, which is already out of scope.

## Findings, verified

### F1, critical: confirmed, and wider than the review says

Both copies of `getGmPublicKey` (in `src/crypto/records.ts` and `src/models/user.ts`) read
`Event.gmPublicKey` at write time, and nothing compares it to any GM's private key. Every
invitee autosave of flags and practical answers, `removeFlagsOn`, and `recomputeCastingResults`
seal data keys to whatever the row holds. Because data keys are reused across rewrites, one
harvested key opens every later version of that record in every backup.

The review mentions swapping a user's public key only before `promoteToGm`. The same swap also
works against `writeRecord`, which looks up `User.publicKey` from the database for the SELF wrap
whenever a GM session rewrites someone else's record (deletion, casting recompute). The victim's
session fails the `keysMatchUser` check and gets signed out, so this variant is at least visible.

### F2 and F3, high: confirmed, but they restate the out-of-scope adversary

Both chains start from reading `SESSION_SECRET` or sniffing pod traffic. On this cluster anyone
who can do either can also exec into the pod, and a compromised application server is already
declared out of scope. The real gap is in the spec: it does not say that the Secret holder is
that adversary, and it does not address operators who are themselves invitees. Since the
operator is an invitee and a GM, F2 is simply the operator reading data they can read in the UI
anyway; the one thing it adds is that keys obtained this way outlive a later change of role,
which is F8.

### F4, medium: confirmed

`src/proxy.ts` re-issues the cookie on every GET older than 30 minutes with a fresh 12 hour
expiry and no cap. `changePassword` keeps the key pair, so old cookies stay valid. Sign-out
deletes only the browser's copy. Only a GM-led reset, which replaces the key pair, revokes a
session, and a GM cannot reset their own.

### F5, medium: confirmed, arithmetic checked

Neutral is an absent key, AES-GCM preserves length, and the blob overhead is a constant 29 bytes.
A red, yellow or green flag adds 45, 48 or 47 bytes, so one snapshot gives the exact count below
15 flags and the diff between two snapshots gives the colour of each edit. CASTING_RESULT grows
39 bytes per mutual green. The review missed a related leak: a CASTING_RESULT or
PLAYER_ATTRIBUTES row exists only for a user with a decision or a GM edit, so row existence and
`updated_at` leak casting progress regardless of length.

### F6, medium: confirmed, and the suggested AAD fix alone does not close it

The AAD is the row id only, so a database writer can change `owner_id` and show one person's flags
as another's. Binding kind and owner into the AAD stops that. It does not stop forging a fresh
record, because anyone can seal a new data key to the public GM key and to the victim's public
key and encrypt any content under it. Only a key the attacker does not hold stops forgery.

### F7, medium: confirmed, by design

The spec asked for a strength meter and said not to block weak passwords (changed by this review). The accept and change
password actions only cap the length at 1024. Argon2id at 64 MiB slows offline guessing but a
dictionary-grade GM password falls, and one GM password opens everything.

### F8 and F9, low: confirmed

No rotation code exists and the only revocation of a departed GM is to lose the data or rotate
the session secret, which does nothing against keys already extracted. The chart README runs
`init` and `add-gm` with `kubectl exec`, so `RECOVERY_KEY` and a GM's password pass through the
pod.

## Fixes

### F1: pin the GM public key, bind user public keys

- `init` prints the GM public key next to the recovery key. The chart takes it as a
  `GM_PUBLIC_KEY` value; `src/config.ts` requires it in production.
- The server refuses to start if the pinned key differs from `Event.gmPublicKey`, and every seal
  to the GM audience uses the pinned key, never the row. Swapping the key then requires a
  deployment change, which is the bar the design intends.
- `getViewer` verifies that the public half of the session's GM key equals the pinned key, so a
  mismatch fails loudly on every GM page load instead of only in the Flags view.
- User public keys cannot be pinned in config. The user row gets a binding column:
  `publicKey` wrapped under the INVITEE audience key with the user id as AAD. Every session and
  the CLI hold that key and verify the binding before sealing to the user's key; a database-only
  attacker cannot forge it. `createInvite` and `resetPassword` write the binding.
- The `getGmPublicKey` duplicate in `src/models/user.ts` goes away in the process.

### F2 and F3: documented tradeoff, no code

An opaque session id with server-held state does not remove the attack: server-held keys would
sit in the database or be encrypted under the same Secret, which the same adversary reads, and
in-memory state on the single replica would sign everyone out on each deploy. In-pod TLS through
a Traefik backend TLS policy is possible but a pod-network adversary on this cluster is a node
administrator who already has the Secret. The spec's threat model will name the Secret holder as
the compromised-server adversary and state that cluster admins may be invitees and GMs.

### F4: absolute lifetime and session epoch

- The cookie payload gains an authentication time that refresh never advances; sessions end at
  most 7 days after sign-in regardless of activity.
- The user row gains a plaintext session epoch. The cookie carries the epoch at sign-in and
  `getViewer` compares it next to the existing `keysMatchUser` check. `changePassword` bumps it
  and re-issues the caller's own cookie. A "sign out everywhere" action in the profile menu bumps
  it too.

### F5: fixed-size padding

A dense array over a roster needs a stable ordering that changes as users are added, so the
review's encoding is not practical. Instead `encryptJson` pads the plaintext to a fixed bucket per
record kind before encryption, using the existing format version byte so old blobs still decrypt
and are rewritten in the new format on their next write. Flags for 60 users stay under 3 KB, so a
4 KB bucket covers FLAGS, CASTING_RESULT, PLAYER_ATTRIBUTES and PRACTICAL_RESPONSE. VETTING_RESPONSE
holds free text and gets a larger bucket. The row-existence leak of CASTING_RESULT and
PLAYER_ATTRIBUTES stays; closing it would mean writing rows for every user, which is a separate
change if wanted.

### F6: AAD plus an INVITEE-keyed authenticator

- The AAD becomes id, kind and owner, with the format version byte distinguishing old records.
- Each record gains an HMAC over id, kind, owner and ciphertext under a key derived from the
  INVITEE audience key. Every writer holds that key; a database-only attacker does not. Readers
  verify it and treat a bad tag as `CannotDecrypt`.
- Per-user signing keys are declined for now: they need a second key pair per user, handling in
  GM-led reset, and verification against retired keys, and the only adversary they add
  protection against is an invitee with database write access, who is the admin-invitee case
  already accepted under F2.

### F7: pepper and GM password policy

- The Argon2id derivation takes a secret parameter from a new `KDF_PEPPER` value in the Secret.
  A stolen backup then cannot be attacked offline without the Secret. Losing the pepper loses
  every password-based unlock; the recovery key path does not use passwords and still works,
  which operations.md will say. Existing users are migrated on their next successful sign-in,
  since that is the only time the server holds their password; a flag on the KDF params records
  whether the pepper was used.
- The accept and change password actions run zxcvbn on the server and refuse a score below 2
  for invitees and below 3 for GMs. The existing client meter shows the same score and the
  threshold that applies, so the refusal is never a surprise. The role comes from the user row's
  `isGm`, which both actions already load.

### F8: rotation CLI, after the above

A command that generates a new key for one audience, opens every wrap of that audience with the
old key and re-seals it with the new one, re-wraps the key for each current member, and updates
the recovery wraps. GM rotation also updates the pinned public key, so it requires a deploy. This
is the documented response to a departed GM or admin.

### F9: documentation

Run `init`, `add-gm` and future rotation from a GM's or the admin's own machine against a
port-forwarded database, so the recovery key and GM passwords never enter the cluster. Keep the
`kubectl exec` instructions only as a fallback.
