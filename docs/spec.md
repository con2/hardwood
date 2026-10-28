# Signup system for larps with sensitive themes

We are building a signup system for larps (and possibly other events) with sensitive themes. We want to pay extra attention to vetting of players in order to create a safe and comfortable environment for players to experiment and play.

Typical larps have a casting survey, to which potential players respond. The Game Masters (GMs) then read the answers, select players and match them with character profiles (or write character profiles to match the wishes of the players).

In contrast to this, we want to give potential players more say as to with whom they will be playing. Therefore we will make our casting survey responses visible to those who have responded. There will be a flagging phase, during which each potential player will get to flag each potential co-player with a colour indicating their willingness to play with that person.

The app is single-tenant. If another larp or event needs to use it simultaneously, another instance will be set up.

# Signup process outline and primary use cases

1. The admin initializes the event from the command line.

- Audience keys and the first GM user are generated.

2. The admin invites potential players to the event, generating a personal invitation link and initial password for each.

- These need to be generated en masse, as there will be 60 or so people invited to the first event. Invites will be manually handed out via Discord.
- A personal key pair is generated for each invitee, its private key stored encrypted by the initial password (to be later re-encrypted with the password they set).
- A copy of the invitee audience key is encrypted with the public key of the invitee and stored for them.

3. Invitees accept their invitations by the invitation link and initial password.

- Not all invitees will do so.
- Those who do will continue to access the system by their private invitation link and a password they set.
- The personal private key is re-encrypted with the password they set.

4. Invitees respond to the vetting survey during the sign-up period.

- Their edits are saved periodically.
- They may indicate that their response is ready. Ready or not, they may continue to edit it until the sign-up period ends.
- Responses to the vetting survey are encrypted to the invitee audience key.

5. Towards the end of the sign-up period, there is a preview period, during which

- the invitees can, for the first time, see the completed vetting survey responses of other invitees, provided they have indicated their own response as completed; and
- they may continue to revise their own response, inspired by the answers of others.

6. When the sign-up period ends, the vetting survey responses are locked from editing, and the vetting period begins, during which

- the invitees continue to see the answers to the vetting survey, both by others and their own;
- they may assign color flags to other invitees indicating their willingness to play with that person, visible only to themselves and the GMs.

7. When the vetting period ends, the flagging responses are locked from editing.

- The invitees continue to see the answers to the vetting survey, both by others and their own, and their own answers to the vetting survey.
- The GMs will proceed to select players from among the invitees, inputting the choices to the system. These choices will be visible to the GMs only until the casting is indicated completed.

8. When a GM indicates the casting as being completed, each invitee will see their own casting result (selected / not selected) at the top of each view.

- The answers to the vetting survey by selected players will remain visible to the selected players.
- Non-selected invitees will, from now on, see their own response only.
- Flagging responses will remain confidential to the person who submitted them and the GMs, with the exception of mutual green flags which will be highlighted in the flagging view.

9. Players selected for the larp will be asked to fill in a practical survey.

- Answers thereto will be confidential to that player and the GMs.
- The players are able to edit their answers until the practical survey closes.

10. An invitee/player may choose to withdraw at any time.

- Should they choose to do so, their answers to the vetting and flagging surveys are locked from editing and remain viewable by themselves and the GMs only.
- The GMs may remove all traces of that user from the system, including their vetting and flagging survey answers (in the event of the user asking for their information to be removed).
- A withdrawn invitee may be restored by GM only (via the Players view).

# UI requirements

## Dark mode by default

Low priority. But some things are better left in darkness.

## Non-logged-in users see nothing

Direct users arriving at the front page of the application to the page of the larp at larpit.fi. For the first event, this is configured as <https://larpit.fi/larp/01a11819-1e04-7408-83a7-1e578c9622ea>.

## App bar

An app bar sits at the top of the screen. It need not stay at the top of the window when the page scrolls.

To the left, there is the name of the larp (configured as "Hardwood High 1" for the first event) as the "brand" element. Clicking it does nothing.

Then, for signed-in users, follow the main views of the application ("Sign Up", "Flagging", "Practical" and "Privacy"), aligned left, collapsed into a menu on narrow clients.

Then, for GMs only, follow the "Structure" and "Players" views, aligned right.

To the furthest right is a profile menu with "Change Password", "Dark/Light/System Light Mode" switch and "Sign Out". The profile menu, by our convention, shows as its title the name of the signed-in user, stored in vetting survey responses (also set by the Accept Invitation view).

## Main views

### Sign In

This view is not displayed in the app bar. It is only accessed by using the invitation URL.

A password field and a Sign In button. Upon successful login, depending on invitee status:

- INVITED – Shown the Accept Invitation view without URL changing from the invitation URL
- ENTERED, SELECTED, NOT SELECTED, WITHDRAWN – Redirect to the Sign Up view
- REVOKED – Indicated as such (only after an otherwise successful login)

### Accept Invitation

This view is not displayed in the app bar. It is only accessible after login when the invitation has not been accepted yet (status INVITED).

The user will be asked to set a display name (stored in the `name` field on the vetting survey) and a strong password (and confirm it). Password strength may be indicated with a strength meter (do not block weak passwords).

The user will be informed that acceptance of the invitation does not yet indicate completion of sign-up or being selected for the event.

The user is prompted to bookmark this page (their invitation link) and instructed they will use that to access the system later, too.

### Sign Up

Accessible always by all invitees who have accepted their invitation.

Shows the vetting survey using the survey builder component. During the sign-up period, the invitee may fill it in and edit their answers as indicated above. Outside the sign-up period, their answers (or just the questions, in the absence of answers) are shown read-only.

The answers are saved automatically (reasonable debounce/throttle). Autosave must work also while required fields are not filled in.

The user may indicate their completion of the sign up survey by a prominent switch:

- NOT YET COMPLETED – I am still working on my answers
- COMPLETED – I am satisfied with my answers (but may still revise them until the end of the sign-up period; need not switch survey back to NOT YET COMPLETED to revise).

If the user indicates the survey as COMPLETED but is missing answers to required fields, indicate that visibly (but let them do so nonetheless).

Instruct the user visibly that at the end of the sign-up period, only completed responses will be considered for casting.

On the vetting survey, a field called `name` is magical in that it will be used as the display name of the invitee. It should be pre-filled first time with whatever the invitee filled in in the Accept Invitation view; this is where they can change it after.

### Flagging

Accessible by active invitees once the flagging period has begun.

Shows responses by others to the vetting survey, and for each the flagging choices of the current user.

The user is instructed that, in addition to the flagging choices presented, if they feel a person on this page poses a safety hazard to the participants of the event, they should contact the GMs directly.

When the flagging period is open, the invitees may indicate their flagging choices of each potential co-player as follows:

- RED – I do not want to participate if this person participates.
- YELLOW – I consent to participating while this person participates but wish to keep playing with them to a minimum.
- NEUTRAL (the default)
- GREEN – I am open to exploring the possibility of intense or intimate play with this person. Mutual green flags will be shared with them.

The wording of the flagging choices may vary from event to event; but it is sufficient to adjust these by translation strings for now.

Autosave, indicate completion.

### Practical

Accessible once the practical survey has opened by invitees who are either

- SELECTED, or
- WITHDRAWN and have a response to the practical survey

The Practical view, when accessible, shows the practical survey and lets the user respond to it while open. Autosave, indicate completion.

### Players

The Players view is accessible by GMs only.

It shows invitees as a table, filterable by invitee status and character group.

Columns (final order pending until we see the field; make sure it's not a big deal to reorder these in code; eg. `DataTable` columns list is fine as long as its order is not depended on elsewhere).

- Invitee status – editable by GM, single select, choices see below.
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
  - Reset password (generate new personal key pair; re-encrypt all content to it)

Autosave for GM edits.

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
  - These statuses cannot see most views; REVOKED cannot sign in and INVITED can only access the Accept Invitation view.
- Until the casting is completed by the GM, SELECTED and NOT SELECTED must appear the same as ENTERED to the subject, so as to not give away (potentially non-final) casting choices early.
  - Once casting is completed, SELECTED and NOT SELECTED are shown to the invitee.
- WITHDRAWN is shown to the invitee ("You chose to withdraw or were removed by the GM.")
  - Needs to be separate from NOT SELECTED for display purposes.

Allow creating more invites (invite link and initial password generated; invite link can be copied later, password shown only this once).

### Structure

Accessible by GMs only.

The Structure view allows the GM to edit vetting and practical survey fields (in tabs/sub-views). It also allows the GM to edit choices to attributes having choices, such as character group and player fee.

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

Support title and description for field types; choices for types that need them (and questions for radio matrix).

Most notably, there will be no concept of dimensions or annotations exposed to the survey builder here. (The concept of dimensions exists for the purpose of dividing player characters to factions and other groups, but we do not need `DimensionSingleSelect` etc. field types.)

File upload fields need not be supported. The unfinished `encryptTo` facility of the original is not replicated.

Surveys are single language. While there will be no general-purpose survey facility, support the vetting (sign up) and practical surveys for now and make it possible to add others later (requiring code changes and data migrations) ifneedbe.

The light version of `SchemaForm` may be used as a building block for UI forms.

Form responses need to have a simpl, readable read-only representation. For multiline text, use `Linebreaks` from `@con2/components`. For Markdown, use `Markdown`.

A form response summary facility is not needed.

Some vetting survey fields, such as the preferred name of the player, will be designated key fields. Values of those will be shown as table columns in the Players listing.

# Non-functional requirements

## Privacy and security

Given the sensitive topics handled in the events using this signup system, we want to safeguard the personal data of the participants.

- Access to the system is by invitation only.
- Always store personal data at rest encrypted to a proper audience.
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

# Terminology

- GM, game master – a person organizing the larp. They may also play, in which case they also act as players;
- player – a real-life person participating in the larp by playing a character
- character – a fictional person played by a player
- larp – not an acronym, spelled in lower case
- event – used interchangeably with larp
- casting – the act of selecting players for the larp (and possibly selecting a primary faction and other dimensions to them), performed by GMs
- user – a GM, player or invitee. All users are invitees; those selected to play are players.
