# Manual test checklist

A walk through the whole lifecycle in the development environment, done once per milestone and
before a release. Tick the boxes in a copy of this list, not in the repository.

## Setup

1. Local databases and dependencies as in the [README](../README.md); `npm run db:migrate:dev`.
2. If the event is not initialised yet: `npm run init -- <your handle>` and save the printed link,
   password and recovery key in `.dev-credentials.txt` (gitignored).
3. `RECOVERY_KEY=<from .dev-credentials.txt> npm run seed:dev` adds 24 fake invitees, flags,
   attributes, character groups, fee categories and sample vetting questions, and sets a timeline
   with sign-up open and the preview started. It prints the shared password of the seeded users
   (`salasana123`) and each one's invitation link; keep the links in `.dev-credentials.txt`.
   `--keep-timeline` leaves an existing timeline alone. Running it again adds nothing.
   To start over, `npm run seed:dev -- --reset` deletes every row first and initialises the
   event anew; replace `.dev-credentials.txt` with what it prints.
4. `npm run dev`, then open http://localhost:3161.

Use one browser profile (or a private window) per person you are signed in as, since the session
is one cookie. Switch the GM's theme between dark and light now and then and look for unreadable
text. Try a narrow window (or the device toolbar) on each view at least once.

Seeded people worth knowing (all with the password `salasana123`):

| Handle                                                   | State                                |
| -------------------------------------------------------- | ------------------------------------ |
| `ainovee`, `eerokorho`, `helmi.m`, `ilmarin`, `kerttu_m` | completed; casting decision SELECTED |
| `lauri.h`, `mirjalaine`                                  | completed; NOT SELECTED              |
| other `completed` handles                                | completed; no decision               |
| `venlah`, `joonasniemi`, `elinak`                        | entered, response not completed      |
| `anttisalo`, `siiritu`                                   | withdrawn                            |
| `mattisalo`                                              | revoked                              |
| `liisatuo`, `jussiran`, `hannakarja`, `tapiol`           | invited, not accepted                |

## Signed out

- [ ] `/` redirects to the larp's page on larpit.fi.
- [ ] An invitation link shows the event name, the invitation-only explanation, the Discord hint
      and a password field. No app bar links.
- [ ] A wrong password says so and hints at a GM reset. Five wrong passwords lock the link and
      the message shows until when.
- [ ] `mattisalo` with the right password: the revoked message, no session.
- [ ] `/signup`, `/players` and `/structure` do not show any data.

## Accept Invitation (`liisatuo`)

- [ ] Signing in shows Accept Invitation on the same URL: the Discord handle, the "not yet a
      sign-up" notice, the bookmark notice, the no-email note and a link to the privacy policy.
- [ ] The privacy policy opens; the app bar shows only Privacy; no Danger Zone.
- [ ] Typing a password fills the strength meter (label and colour change with strength); a weak
      password is still accepted. Mismatched confirmation is refused.
- [ ] After accepting: Sign Up, with the display name pre-filled in the `name` field.

## GM: Structure

- [ ] Vetting survey: add one field of every type, reorder, edit, remove. Removing `name` or
      `discord_handle` shows the warning. Every change says "saved".
- [ ] Practical survey: starts empty with a hint; add a couple of fields.
- [ ] Choices: edit character groups and fee categories; invalid lines are refused.
- [ ] Choices: the flags show as four `slug: title: definition` lines; removing the `neutral`
      line is refused with its own message and the text is kept; add `purple: Lila: Kokeilu` and
      save. Later in Flagging it is a grey button and legend entry, and in the GM Flags view a
      totals column; removing the line again makes flags given with it show as neutral.
- [ ] Timeline: set and clear times; they show in the event time zone after saving.
- [ ] Privacy policy: the Markdown editor is readable in the dark theme; save; the preview and
      `/privacy` show it.

## Sign-up period (sign-up open, preview started)

- [ ] `venlah`: Sign Up is editable, autosaves (reload keeps the answers), the completion switch
      works, marking completed with a required field empty shows the list of missing questions.
      Flagging is not in the app bar (not completed yet).
- [ ] `ainovee`: Flagging shows the completed responses of others, read-only, with the flag
      definitions and the safety note; no flag buttons yet.
- [ ] Set the survey to have no fields (temporarily): Sign Up shows the "no questions yet"
      message instead of an empty form. Restore it.

## Flagging period (set sign-up end and flagging start in the past)

- [ ] `venlah` (not completed): Sign Up is read-only; Flagging is not available.
- [ ] `ainovee`: flag buttons work and save per click; the completion switch works; a reload keeps
      the flags. `venlah` and the withdrawn ones are not listed.
- [ ] GM: Players shows the flagging state per person; Flags shows the matrix (cells readable in
      both themes), totals and per-person lists, withdrawn people marked.
- [ ] Set flagging end in the past: `ainovee`'s flags are read-only.

## Casting

- [ ] GM: Players filters by status and character group; editing character name, group, fee
      category and fee paid autosaves; status changes follow the allowed transitions.
- [ ] Make sure two SELECTED players (e.g. `ainovee` and `eerokorho`) flag each other green and a
      third SELECTED one does not.
- [ ] Mark casting complete. `ainovee` sees the "selected" banner (with the no-email note) on every
      view, only selected players in Flagging, and the mutual green badge on `eerokorho`; the third
      has no badge.
- [ ] `lauri.h` sees "not selected" and, in Flagging, only the names they flagged.
- [ ] An ENTERED invitee with no decision sees no banner.
- [ ] Changing a status while completed updates that person's banner at once.
- [ ] Revert casting completion: banners and badges disappear; decisions stay. Complete it again.

## Practical (set practical start in the past)

- [ ] `ainovee`: Practical is in the app bar, editable and autosaving, with the completion switch.
- [ ] `lauri.h`: no Practical.
- [ ] GM: the Practical column in Players shows the state.

## Withdraw and delete

- [ ] `ainovee`: Privacy → Danger Zone → Withdraw asks for confirmation; after it, Sign Up shows
      the withdrawn banner and read-only answers; Flagging and Practical are read-only.
- [ ] Others no longer see `ainovee` in Flagging.
- [ ] GM: `ainovee` is WITHDRAWN in Players with a Delete button; restore to SELECTED, then
      withdraw again.
- [ ] GM: Delete `anttisalo`: the row disappears and the flags on them vanish from the Flags matrix.

## Password reset

- [ ] GM: Reset password on `helmi.m`; copy the link and the new initial password.
- [ ] The old password no longer works; the new one leads to Accept Invitation with the reset
      notice and the name pre-filled. After setting a password, the answers and flags are intact.
- [ ] GM: the profile menu's Change Password works for the GM; the GM's own row has no Reset.

## Errors

- [ ] A non-existent path shows the not-found message under the app bar, readable in both themes.
- [ ] `/players/flags/<random uuid>` is a 404.
