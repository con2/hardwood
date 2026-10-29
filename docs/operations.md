# Operations guide

For the GMs and the admin of one Hardwood deployment. What the app does is in
[spec.md](spec.md); how to deploy it on the cluster (namespace, Secret, Helm, `kubectl exec`) is in
[chart/README.md](../chart/README.md). The commands below are written as `npm run …` for a local
checkout; in production run the same scripts in the `node` pod as
`node_modules/.bin/tsx src/bin/<script>.ts …` (see the chart README).

**The system sends no email or other notifications.** Every invitation, password, reminder and
announcement goes out by hand on Discord. The UI tells invitees this too.

## First run: `init`

Once per deployment, after the database has been migrated:

```sh
npm run init -- <discord handle of the first GM>
```

It generates the INVITEE and GM audience keys and the recovery key, creates the event settings,
the vetting survey (with the `name` and `discord_handle` fields) and an empty practical survey, and
invites the first GM. It prints, **once**:

- the first GM's invitation link and initial password: hand them to that GM on Discord;
- the **recovery key**: see [below](#the-recovery-key).

Running it again does nothing. The first GM opens the link, signs in with the initial password,
sets a display name and their own password, and lands on the Sign Up view.

## Adding GMs: `add-gm`

GMs are added only from the command line, so that the web UI has no "admin GM" level. The tool
needs the audience keys, which it unlocks either with an existing GM's invitation link (or token)
and password, or with the recovery key:

```sh
# As an existing GM (the password is prompted for without echo):
npm run add-gm -- --token <your invitation link or token> --discord-handle <new GM's handle>

# Promote an existing invitee instead (the user id is the last part of their
# /players/flags/<user id> link in the Flags view):
npm run add-gm -- --token <your invitation link or token> --promote <user id>

# Without a GM's credentials, with the recovery key:
RECOVERY_KEY=… npm run add-gm -- --discord-handle <handle>
```

A new GM invitation prints its link and initial password once; hand them over Discord. A promoted
invitee gets the GM key on their next sign-in. GMs may also play: they then fill in the surveys and
flag like everyone else. GMs can see the flags made on themselves; tell the players this.

## Creating invites

In **Players → Create invites**, paste the Discord handles, one per line. Each invitee gets a
personal invitation link and an initial password, shown **once** in a table with copy buttons.
Send each person their link and password on Discord before leaving the page. The link can be
copied again later from the Players table; the initial password cannot (reset it instead).

The invitation link is the invitee's only identifier: there are no user names. If someone loses
both the bookmark and the Discord message, copy the link again from Players.

## Phases and the timeline

The phases follow the timestamps in **Structure → Timeline**, in the event's time zone. You may
change them at any time, also to reopen a closed period.

| Timestamp            | What happens                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Sign-up starts       | Invitees who have accepted can fill in the vetting survey.                                    |
| Preview starts       | Invitees with a COMPLETED response see the other COMPLETED responses in Flagging (read-only). |
| Sign-up ends         | The vetting survey locks. Only COMPLETED responses take part in flagging and casting.         |
| Flagging starts      | Defaults to the end of sign-up. Flags can be set.                                             |
| Flagging ends        | Flags lock.                                                                                   |
| Practical opens/ends | SELECTED players (after the casting is completed) can fill in the practical survey.           |

A period without a start time is closed; one without an end time stays open once it has started.
To rescue an invitee who forgot to mark their response completed, reopen the sign-up period for a
while. Edit the surveys, choices (character groups, fee categories) and the privacy policy in the
other Structure tabs; surveys may be edited while responses exist.

## Casting

Record each decision as the invitee's status in the Players table: SELECTED or NOT SELECTED
(ENTERED means no decision yet). These are visible only to the GMs until the casting is completed.

**Mark casting complete** (above the Players table, with confirmation) then:

- shows each invitee with a decision their result (selected / not selected) at the top of every
  view; ENTERED invitees get no result;
- derives the mutual green flags between SELECTED players and shows them to both;
- narrows the Flagging view of selected players to the other selected players, and shows
  non-selected invitees only the names they flagged and their own flags;
- opens the Practical view to selected players once the practical survey has started.

Status changes while the casting is completed recompute the results at once. **Revert casting
completion** hides the results again and deletes the derived mutual greens; the decisions stay.
Announce the casting on Discord: the system does not notify anyone.

## Password resets

There is no self-service reset. An invitee who has forgotten their password contacts the GMs on
Discord; a GM uses **Reset password** in the Players table. It generates a new initial password
(shown once; send it with the invitation link on Discord) and a new key pair, re-wrapping the
invitee's keys so their answers and flags survive. On their next sign-in they set a new password.
Change your own password from the profile menu instead.

Five wrong passwords in a row lock an invitation for a minute, doubling with each further failure
up to an hour; the sign-in page shows until when. A password reset also clears the lock.

## Withdrawals and deletion

An invitee may withdraw at any time from **Privacy → Danger Zone**. Their answers and flags lock,
and they disappear from others' Flagging views; flags already made about them remain for the GMs.
Only a GM can undo it, by changing their status in Players.

If a withdrawn invitee asks for their data to be removed, **Delete** in their Players row (only
offered for WITHDRAWN) removes their user record and keys, their survey answers and flags, the
GM-edited attributes and the flags others made about them. Free-text mentions of them in others'
answers are not removed. Deletion cannot be undone.

## The recovery key

The recovery key unwraps both audience keys. It is needed only when no GM can sign in (to add a GM
with `add-gm`), not in routine use. Whoever holds it can read all data in the database.

- Store it offline: a password manager entry not shared with the app's operators, or on paper in a
  safe place. Do not paste it into chat, tickets or shell history (set `RECOVERY_KEY` with
  `read` as in the chart README).
- Keep two copies held by different trusted people if you can.

## Security notes

- The invitation link is part of the URL. Anyone with access to the gateway's or the browser's
  history sees invitation links, which is why the password is always required as well, and why
  five wrong passwords lock the invitation. Treat shared screenshots of the address bar like
  passwords.
- A GM-led password reset replaces the invitee's key pair, which also invalidates any session they
  still had open: the next page load signs them out and they continue with the new initial
  password.
- A newly promoted GM gets the GM key at their next sign-in: ask them to sign out and in again.
- Password derivation is deliberately expensive (Argon2id, 64 MiB). The server runs at most two
  derivations at a time and queues the rest, so a burst of sign-ins slows down rather than
  exhausting memory.

## Backups and data loss

Back up the PostgreSQL database as usual. All personal data in it is ciphertext: a backup is
useless without a GM's password or the recovery key, which is the point. Conversely, **if every
GM password and the recovery key are lost, the data is lost**: nobody, including the admin, can
decrypt it. The privacy policy and the recovery wraps of the audience keys are the only plaintext.

`SESSION_SECRET` only protects session cookies; changing it signs everybody out but loses no data.

`KDF_PEPPER` is a secret input to the password KDF, so a database backup alone does not allow
guessing passwords offline. **Losing it loses every password unlock**: nobody can sign in, but
the recovery key still opens the audience keys, from which a GM can be re-invited
(`add-gm`) and every other password reset. Store a copy next to the recovery key. Passwords set
before the pepper existed are moved to it on their owner's next sign-in.

## After the event

When the data is no longer needed, delete it as the privacy policy promises: drop the database
(and expire its backups), or delete the withdrawn players one by one.
