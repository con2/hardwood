# Signup system for larps with sensitive themes

We are building a signup system for larps (and possibly other events) with sensitive themes. We want to pay extra attention to vetting of players in order to create a safe and comfortable environment for players to experiment and play.

Typical larps have a casting survey, to which potential players respond. The Game Masters (GMs) then read the answers, select players and match them with character profiles (or write character profiles to match the wishes of the players).

In contrast to this, we want to give potential players more say as to with whom they will be playing. Therefore we will make our casting survey responses visible to those who have responded. There will be a flagging phase, during which each potential player will get to flag each potential co-player with a colour indicating their willingness to play with that person.

The app is single-tenant. If another larp or event needs to use it simultaneously, another instance will be set up.

# Signup process outline and primary use cases

1. The admin initializes the event from the command line.

- Audience keys, a recovery key and the first GM user are generated. See _Audiences and encryption_.
- The recovery key is printed once and stored offline by the admin. It is not needed in routine use.

2. A GM invites potential players to the event via the Players view, generating a personal invitation link and initial password for each.

- These need to be generated en masse, as there will be 60 or so people invited to the first event. Invites will be manually handed out via Discord.
- Invites are created by pasting a list of Discord handles, one per line. The Discord handle is pre-seeded into the `discord_handle` field of the invitee's vetting survey response and serves as the label by which the GM tells the invites apart before they are accepted.
- The invitation link and initial password are shown once as a table, with copy buttons. The link can be copied again later; the initial password cannot.
- A personal key pair is generated for each invitee, its private key stored encrypted by the initial password (to be later re-encrypted with the password they set).
- A copy of the invitee audience key is encrypted with the public key of the invitee and stored for them.

3. Invitees accept their invitations by the invitation link and initial password.

- Not all invitees will do so.
- Those who do will continue to access the system by their private invitation link and a password they set.
- The personal private key is re-encrypted with the password they set.

4. Invitees respond to the vetting survey during the sign-up period.

- Their edits are saved periodically.
- They may indicate that their response is ready. Ready or not, they may continue to edit it until the sign-up period ends.
- Responses to the vetting survey are encrypted to the invitee audience.

5. Towards the end of the sign-up period, there is a preview period, during which

- the invitees can, for the first time, see the completed vetting survey responses of other invitees, provided they have indicated their own response as completed; and
- they may continue to revise their own response, inspired by the answers of others.

6. When the sign-up period ends, the vetting survey responses are locked from editing, and the flagging period begins, during which

- the invitees whose response is COMPLETED continue to see the COMPLETED vetting survey responses of others, and their own;
- invitees whose response is NOT YET COMPLETED see only their own response, are not shown in the Flagging view of others, and cannot flag. Should a GM wish to rescue such an invitee, they may reopen the sign-up period for a while by adjusting the timeline;
- they may assign colour flags to other invitees indicating their willingness to play with that person, visible only to themselves and the GMs.

7. When the flagging period ends, the flagging responses are locked from editing.

- The invitees continue to see the answers to the vetting survey, both by others and their own, and their own flags.
- The GMs will proceed to select players from among the invitees, inputting the choices to the system via the Players view. These choices will be visible to the GMs only until the casting is indicated completed.

8. When a GM indicates the casting as being completed, each invitee will see their own casting result (selected / not selected) at the top of each view.

- The answers to the vetting survey by selected players will remain visible to the selected players.
- Non-selected invitees will, from now on, see their own response only.
- Flagging responses will remain confidential to the person who submitted them and the GMs, with the exception of mutual green flags between SELECTED players, which will be highlighted in the flagging view of both parties.
- Completing the casting is a GM action that also derives the mutual green flags (see _Audiences and encryption_). It is reversible: reverting the casting completion deletes the derived mutual green flags and hides the casting result again.

9. Players selected for the larp will be asked to fill in a practical survey.

- Answers thereto will be confidential to that player and the GMs.
- The players are able to edit their answers until the practical survey closes.

10. An invitee/player may choose to withdraw at any time, via the Privacy view.

- Should they choose to do so, their answers to the vetting and flagging surveys are locked from editing and remain viewable by themselves and the GMs only.
- Withdrawn invitees are no longer shown in the Flagging view of others. Flags already made about them are retained for the GMs.
- The GMs may remove all traces of that user from the system (in the event of the user asking for their information to be removed). This includes their user record and keys, their vetting, flagging and practical survey answers, their GM-edited attributes, and the flags other invitees have made about them. Free-text mentions of them in the responses of others cannot be removed automatically.
- A withdrawn invitee may be restored by GM only (via the Players view), to a status of the GM's choosing.

# Audiences and encryption

Personal data is stored encrypted at rest. Decryption happens on the server, in the context of a signed-in user's session. Visibility rules beyond the audience boundaries described here (such as "non-selected invitees see their own response only", or "preview only after completing your own response") are enforced by server-side access control, not by cryptography.

## Threat model

We protect against disclosure of the database and its backups, and against operators with database access, including write access, but without a user session. We do not attempt to protect against a compromised application server; a web application cannot.

- Whoever holds the deployment's secrets (the Kubernetes Secret with the session secret and the KDF pepper) or can observe the traffic inside the cluster can read session cookies and thus the keys in them. That is the compromised-application-server adversary, out of scope.
- Cluster admins may themselves be invitees and GMs. In those roles they read what any invitee or GM reads. Keys they obtained that way outlive a later change of role until the keys are rotated (see _Key rotation_).
- A database writer cannot make anyone seal data to a key of theirs: the GM public key used by invitees comes from the deployment, not the database, and every user's public key carries a binding that only invitees can produce. Nor can a database writer forge or move a record: each record carries an authenticator only invitees can compute, and its ciphertext is bound to its id, kind and owner.
- Ciphertext length does not reveal content: plaintexts are padded to 4 KiB blocks. Which records exist is not hidden (for example, whether someone has a casting result).
- A database dump alone does not allow guessing passwords offline: the password KDF takes a secret pepper from the deployment.

## Audiences

There are two audiences:

- INVITEE – all invitees who have accepted their invitation, including GMs. Its audience key is symmetric: every member can both read and write records for the audience.
- GM – users with the GM flag. A subset of INVITEE. GMs hold both audience keys. Its audience key is an asymmetric key pair: anyone can encrypt to the GM audience with the GM public key (which is stored in plain text and pinned in the deployment configuration), but only GMs hold the private half. This is necessary because invitees write records (flags, practical answers) that GMs must read.

In addition, the owner of a record is an implicit audience of their own (SELF), using their personal key pair.

## Keys

- Each user has a personal asymmetric key pair. The private key is stored encrypted with a key derived from the user's password (initially the generated initial password) and the deployment's KDF pepper. Changing the password re-encrypts the private key only. The public key is bound to the user with a key derived from the INVITEE audience key; data keys are sealed to a user's public key only once the binding verifies.
- Each audience key (the INVITEE symmetric key, the GM private key) is wrapped to the public key of each of its members, and additionally to the recovery key. The GM public key is stored in plain text.
- Each encrypted record has a random data key. The record's content, padded to a multiple of 4 KiB, is encrypted with the data key and bound to the record's id, kind and owner, and the data key is wrapped to one or more audiences: with the symmetric audience key for INVITEE, sealed to the GM public key for GM, and sealed to the owner's public key for SELF. Since anyone can seal to the GM public key, each record also carries an authenticator keyed from the INVITEE audience key, which shows that an invitee wrote it.
- The invitation token is stored only as a hash for sign-in lookups, plus a copy sealed to the GM public key so that GMs can copy the invitation link again later.
- The recovery key is generated at initialization, printed once and never stored by the system in plain text. It can unwrap both audience keys.

Which records are encrypted to which audiences:

| Record                                           | Audiences                                     |
| ------------------------------------------------ | --------------------------------------------- |
| User record (invitation, key material)           | GM                                            |
| Vetting survey response                          | INVITEE                                       |
| Flags made by an invitee (one blob)              | SELF, GM                                      |
| Derived mutual green flags of a player           | SELF, GM                                      |
| Practical survey response                        | SELF, GM                                      |
| GM-edited player attributes                      | GM                                            |
| Event settings (timeline, casting flag, choices) | INVITEE                                       |
| Privacy policy                                   | none (public by nature, stored in plain text) |
| Survey schemas                                   | INVITEE                                       |

Flags are stored as a single encrypted blob per flagger containing all their flags. This avoids leaking, through the existence of rows, who has a non-neutral flag on whom. Removing a deleted user from the flags of others means the deleting GM's session rewrites each flagger's blob.

Event settings and survey schemas are not personal data, but they are encrypted to the INVITEE audience anyway: every reader is a signed-in invitee or the command line, both of which hold that key. The privacy policy is deliberately stored in plain text so that it can be shown to invitees who have not yet accepted their invitation. Besides it, only the recovery wraps of the audience keys are stored in plain text, as the bootstrap for recovery.

## Sessions

Upon sign-in, the server derives the key from the password, decrypts the user's private key and unwraps the audience keys available to them. The resulting key material is held in an encrypted, signed session cookie; nothing session-related is persisted server-side. Sessions expire after a reasonable number of hours of inactivity, with the expiry refreshed on user actions, and at the latest a week after the password was entered. Each user has a session epoch, stored with the user and copied into the session at sign-in; a session from an earlier epoch is rejected. Changing one's password, a GM-led password reset and "Sign Out Everywhere" in the profile menu move the epoch, signing the user out everywhere. Sign-in attempts are rate-limited per invitation.

## Password reset by GM

A GM may reset the password of an invitee from the Players view. This generates a new initial password and a new personal key pair for the invitee, and re-wraps to the new public key the invitee audience key and every data key wrapped to the invitee's SELF audience (using the GM wraps to unwrap them). All existing survey responses and flags survive the reset. The invitee's status is unchanged, but they are directed to the Accept Invitation view upon their next sign-in to set a new password. Their existing display name is pre-filled.

There is no self-service password reset; an invitee who has forgotten their password contacts the GMs via Discord.

## Casting completion and derived data

Marking the casting complete happens in a GM's session. Besides setting the flag, it writes for each invitee with a casting decision a derived casting result record encrypted to that invitee (SELF) and GM, containing their result, the mutual green flags among SELECTED players, and, for SELECTED players, the list of the other SELECTED players. The last item is what lets the Flagging view of a selected player show only selected players after casting: an invitee's session cannot read casting decisions or the flags of others, so neither mutuality nor the selected set can be computed at viewing time. Reverting the casting completion deletes the derived records. GM status changes while the casting is completed recompute the derived records. A self-withdrawal after casting completion cannot recompute the records of others (the withdrawing invitee's session has no GM key); they are refreshed on the next GM status change or casting revert/complete.

## GMs

GM is a flag on the user. GMs may also play; they then also have an invitee status and respond to surveys and flag like anyone else. GMs can see the flags made on them; we accept this and will disclose it to players. Non-playing GMs may also be present in the Flagging view so that invitees may flag them, with their situation explained in their text answers.

Additional GMs are added from the command line, not via the UI, to avoid a privileged "admin GM" level in the application. The command either creates a new invitation with the GM flag or promotes an existing invitee. It unlocks the audience keys with the invitation link and password of an existing GM, or with the recovery key.

## Key rotation

Removing a GM's role or an invitation does not take back an audience key the person already held. A command-line tool replaces an audience key: the GM key (re-sealing every GM wrap to a new key pair, optionally demoting a GM in the same run; the new GM public key must then be deployed) or the INVITEE key (re-wrapping every INVITEE data key and recomputing the authenticators and key bindings that derive from it). Affected users sign in again. Rotation is the response to a departed GM or a departed cluster admin.

# Phases and timeline

The event proceeds through phases driven by timestamps that GMs edit in the Timeline tab of the Structure view:

- Sign-up period: start, preview start, end. The vetting survey is editable between start and end. Others' COMPLETED responses are visible from preview start onwards (to those with a COMPLETED response).
- Flagging period: start (defaults to the end of the sign-up period), end. Flags are editable between.
- Practical survey: start, end. The practical survey is editable between.

In addition there is a manual, reversible _casting completed_ toggle in the Players view.

GMs may edit the timestamps at any time, including reopening a closed period.

Timestamps are entered and displayed in the event's time zone (Europe/Helsinki for the first event).

# UI requirements

## Dark mode by default

Low priority. But some things are better left in darkness.

## Non-logged-in users see nothing

Direct users arriving at the front page of the application to the page of the larp at larpit.fi. For the first event, this is configured as <https://larpit.fi/larp/01a11819-1e04-7408-83a7-1e578c9622ea>.

## No email

The system sends no email or other notifications. All communication with invitees happens manually via Discord. The UI does not repeat this on every view; the GMs tell the invitees in their communications.

## App bar

An app bar sits at the top of the screen. It need not stay at the top of the window when the page scrolls.

To the left, there is the name of the larp (configured as "Hardwood High 1" for the first event) as the "brand" element. Clicking it does nothing.

Then, for signed-in users, follow the main views of the application ("Sign Up", "Flagging", "Practical" and "Privacy"), aligned left, collapsed into a menu on narrow clients. Users who have not accepted their invitation see only "Privacy". The others see all four even before Flagging or Practical is accessible to them, so that they learn the views exist; such a view then says why it is not accessible and, when it is a matter of time, when it opens.

Then, for GMs only, follow the "Structure" and "Players" views, aligned right.

To the furthest right is a profile menu with "Change Password", "Dark/Light/System Light Mode" switch and "Sign Out". The profile menu, by our convention, shows as its title the name of the signed-in user, stored in vetting survey responses (also set by the Accept Invitation view).

## Main views

### Sign In

This view is not displayed in the app bar. It is only accessed by using the invitation URL.

A password field and a Sign In button. Upon successful login, depending on invitee status:

- INVITED, or a GM-led password reset is pending – Shown the Accept Invitation view without URL changing from the invitation URL
- ENTERED, SELECTED, NOT SELECTED, WITHDRAWN – Redirect to the Sign Up view
- REVOKED – Indicated as such (only after an otherwise successful login)

### Accept Invitation

This view is not displayed in the app bar. It is only accessible after login when the invitation has not been accepted yet (status INVITED), or when a GM-led password reset is pending.

The user is shown the Discord handle they were invited as. They will be asked to set a display name (stored in the `name` field on the vetting survey; pre-filled from the existing response if any) and a password (and confirm it). A strength meter shows the zxcvbn score of the password as it is typed, and the server refuses a password below the required score: 2 ("modest") for invitees, so that the friction stays low, and 3 ("strong") for GMs, whose password unlocks every record. The same requirement applies in Change Password.

The user will be informed that acceptance of the invitation does not yet indicate completion of sign-up or being selected for the event.

The user is prompted to bookmark this page (their invitation link) and instructed they will use that to access the system later, too.

### Sign Up

Accessible always by all invitees who have accepted their invitation.

Shows the vetting survey using the survey builder component. During the sign-up period, the invitee may fill it in and edit their answers as indicated above. Outside the sign-up period, their answers (or just the questions, in the absence of answers) are shown read-only. WITHDRAWN invitees always see their answers read-only.

The answers are saved automatically (reasonable debounce/throttle). Autosave must work also while required fields are not filled in.

The user may indicate their completion of the sign up survey by a prominent switch:

- NOT YET COMPLETED – I am still working on my answers
- COMPLETED – I am satisfied with my answers (but may still revise them until the end of the sign-up period; need not switch survey back to NOT YET COMPLETED to revise).

If the user indicates the survey as COMPLETED but is missing answers to required fields, indicate that visibly (but let them do so nonetheless).

Instruct the user visibly that at the end of the sign-up period, only completed responses will be considered for casting.

On the vetting survey, a field called `name` is magical in that it will be used as the display name of the invitee. It should be pre-filled first time with whatever the invitee filled in in the Accept Invitation view; this is where they can change it after. Likewise `discord_handle` is pre-seeded by the GM when creating the invite, and the invitee may correct it here.

### Flagging

Accessible by invitees with a COMPLETED vetting survey response once the preview period has begun. During the preview period it shows the responses of others without flagging controls.

Shows the COMPLETED responses by others to the vetting survey, and for each the flagging choices of the current user. Withdrawn invitees are not shown. After casting completion, non-selected invitees are shown only the display names of those they flagged and their own flags, not the responses.

The user is instructed that, in addition to the flagging choices presented, if they feel a person on this page poses a safety hazard to the participants of the event, they should contact the GMs directly.

When the flagging period is open, the invitees may indicate their flagging choices of each potential co-player. A new event starts with these flags:

- `red` – I do not want to participate if this person participates.
- `yellow` – I consent to participating while this person participates but wish to keep playing with them to a minimum.
- `neutral` (the default)
- `green` – I am open to exploring the possibility of intense or intimate play with this person. Mutual green flags will be shared with them.

The flags, their labels and their definitions are editable by the GMs on the Choices tab of the Structure view and stored in the event settings. `neutral` must always exist: it is the absence of a flag. `green` is the only flag with a meaning beyond display, the mutual greens derived at casting completion. `red`, `yellow` and `green` are shown in their colours; any other flag the GMs add is shown in grey and means nothing to the system.

Autosave, indicate completion.

### Practical

Accessible once the practical survey has opened by invitees who are either

- SELECTED, or
- WITHDRAWN and have a response to the practical survey (read-only)

The Practical view, when accessible, shows the practical survey and lets the user respond to it while open. Autosave, indicate completion.

### Privacy

Accessible by all signed-in users, including INVITED ones who have not yet accepted their invitation (the Accept Invitation view links here so the policy can be read before accepting).

Shows the privacy policy, authored by GMs as Markdown in the Structure view.

Below it, for invitees who have accepted their invitation, a big red Danger Zone with a Withdraw button. Withdrawing requires confirmation and sets the invitee's status to WITHDRAWN as described in the process outline. The user is told that withdrawal can only be undone by a GM, and that they may ask the GMs to remove their data entirely.

### Players

The Players view is accessible by GMs only.

It shows invitees as a table, filterable by invitee status and character group.

Columns (final order pending until we see the field; make sure it's not a big deal to reorder these in code; eg. `DataTable` columns list is fine as long as its order is not depended on elsewhere).

- Invitee status – editable by GM, single select, choices see below.
- GM – indicator, read only (set from the command line)
- Display name – read only, from vetting survey response
- Discord handle – ibid
- Character name – editable by GM
- Character group – single select, editable by GM, GM-editable choices in Structure
- Player fee category – single select, editable by GM, GM-editable choices in Structure
- Player fee paid – yes/no, toggleable by GM
- Survey status columns for each of the three surveys, read only, conveniently colour coded:
  - Vetting
  - Flagging
  - Practical
- Actions:
  - Copy invite link
  - Reset password (see _Audiences and encryption_)
  - Delete (only for WITHDRAWN invitees; requires confirmation; removes all traces as described in the process outline)

Autosave for GM edits.

Above the table: the _casting completed_ toggle (with confirmation both ways), a button to create invites (see process outline step 2), and a link to the Flags view.

Invitee status is one of:

- INVITED – Has not yet accepted their invitation
- REVOKED – The invitation was revoked before it was accepted
- ENTERED – Has accepted their invitation. Also the neutral state wrt/ SELECTED/NOT SELECTED (no choice has not yet been made by the GMs). Not called ACCEPTED to avoid potential mix-up with SELECTED.
- SELECTED – Has been selected for the event by the GMs
- NOT SELECTED – Was not selected for the event by the GMs
- WITHDRAWN – Chose to withdraw (or was removed by GMs) with nothing stated about player selection.

GMs can change the invitation status as follows:

- INVITED can be set to REVOKED and back
- ENTERED, SELECTED, NOT SELECTED and WITHDRAWN can be changed between

Visibility of the states to the invitee themself:

- INVITED and REVOKED are self-evident upon sign-in (REVOKED refused sign-in; INVITED directed to accept invitation).
  - These statuses cannot see most views; REVOKED cannot sign in and INVITED can only access the Accept Invitation and Privacy views.
- Until the casting is completed by the GM, SELECTED and NOT SELECTED must appear the same as ENTERED to the subject, so as to not give away (potentially non-final) casting choices early.
  - Once casting is completed, SELECTED and NOT SELECTED are shown to the invitee.
- WITHDRAWN is shown to the invitee ("You chose to withdraw or were removed by the GM.")
  - Needs to be separate from NOT SELECTED for display purposes.
  - WITHDRAWN invitees can access only the Sign Up view (own response, read-only), the Flagging view (own flags with display names only, read-only), the Practical view (if they have a response, read-only) and the Privacy view.

### Flags

Accessible by GMs only, via a link from the Players view. Not shown in the app bar: this is among the most hazardous information we collect, and GMs should see it only when they intend to.

Shows the flags as a matrix of flaggers (rows) by flaggees (columns), colour coded, with per-person totals of flags received by colour. Clicking a person shows their inbound and outbound flags as lists. Withdrawn invitees are included and marked as such.

### Structure

Accessible by GMs only.

The Structure view has tabs/sub-views for:

- Vetting survey – edit fields using the survey builder editor
- Practical survey – ibid
- Choices – edit choices of attributes having choices, such as character group and player fee category, and the flags
- Timeline – edit the phase timestamps (see _Phases and timeline_)
- Privacy policy – edit as Markdown

Surveys may be edited while responses exist, as in Kompassi: answers to removed fields are retained in the response but not shown, and new fields simply appear unanswered.

## Survey builder

Let's make a minimal version of the `SchemaForm`/`SchemaFormEditor` component from the Kompassi V2 frontend.

Only the following field types need to be supported:

- Static text
- Single line text
- Multiline text
- Markdown text
- Number (integer)
- Single choice
- Multiple choice
- Radio matrix

Support title and description for field types; choices for types that need them (and questions for radio matrix). Fields carry a slug, as in Kompassi, used as the key in the response.

Most notably, there will be no concept of dimensions or annotations exposed to the survey builder here. (The concept of dimensions exists for the purpose of dividing player characters to factions and other groups, but we do not need `DimensionSingleSelect` etc. field types.)

File upload fields need not be supported. The unfinished `encryptTo` facility of the original is not replicated.

Surveys are single language. While there will be no general-purpose survey facility, support the vetting (sign up) and practical surveys for now and make it possible to add others later (requiring code changes and data migrations) ifneedbe.

The light version of `SchemaForm` may be used as a building block for UI forms.

Form responses need to have a simple, readable read-only representation. For multiline text, use `Linebreaks` from `@con2/components`. For Markdown, use `Markdown`.

A form response summary facility is not needed.

Some vetting survey fields are magical by their slug: `name` is the display name of the invitee and `discord_handle` their Discord handle. Values of those are shown as table columns in the Players listing. The survey editor should warn if these fields are missing from the vetting survey.

# Non-functional requirements

## Privacy and security

Given the sensitive topics handled in the events using this signup system, we want to safeguard the personal data of the participants.

- Access to the system is by invitation only.
- Always store personal data at rest encrypted to a proper audience. See _Audiences and encryption_.
  - Encrypted data blobs (such as those representing users) may be identified by a plain-text UUID (v4).
- Do not log personally identifiable information.

## Localization

Make the system localized in English and Finnish from the ground up. For the first event using the system, the language will be Finnish. There will be no need for a language switch in the UI; the UI will be in the language of the event.

# Prior art

`larpit-fi` and `edegal` are compact codebases that are best examples of my way to make frontend applications.

Use the same technology choices and localization architecture:

- Pure TypeScript frontend/backend with React and Next.js Server Components
- Prisma ORM (version 8) for PostgreSQL database (no cross-database support needed)
- A Bootstrap CSS base with react-bootstrap for interactive components. No Tailwind.
- `@con2/components` library for shared components (checked out as `components`). Components may be modified and added as necessary, respecting the semver scheme of the library. (Password strength meter is a candidate for inclusion)
- Localization messages as TypeScript objects, with Finnish typechecked against English
- Deployment to the same QB cluster with a minimal Helm template

`kompassi/kompassi-v2-frontend` shall be used as reference for the `SchemaForm` form builder. However, `larpit-fi` and `edegal` are more modern and compact codebases and more fit for reference for most parts.

The following design and technology choices of the prior art are not replicated:

- We will not be integrating against the Kompassi event management system for single sign-on.
- There will be no Python backend (as in Kompassi) or GraphQL API.
- Dimensions, annotations

# Configuration

The public URL of the production deployment will be [hardwood.larpit.fi](https://hardwood.larpit.fi).

Event name, larpit.fi URL, language and time zone are deployment configuration. Phase timestamps, survey schemas, choices and the privacy policy are editable by GMs in the Structure view and stored in the database.

# Terminology

- GM, game master – a person organizing the larp. They may also play, in which case they also act as players;
- player – a real-life person participating in the larp by playing a character
- character – a fictional person played by a player
- larp – not an acronym, spelled in lower case
- event – used interchangeably with larp
- casting – the act of selecting players for the larp (and possibly selecting a primary faction and other dimensions to them), performed by GMs
- user – a GM, player or invitee. All users are invitees; those selected to play are players.
- audience – a set of users who can decrypt a given record. See _Audiences and encryption_.
