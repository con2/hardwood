# The Great Hardwood Census of 1952

Invitation-only sign-up system for larps with sensitive themes.

- [docs/spec.md](docs/spec.md): what it does
- [docs/plan.md](docs/plan.md): how it is built, and the implementation status
- [docs/operations.md](docs/operations.md): for GMs and admins: first run, GMs, invites, phases,
  casting, password resets, the recovery key and backups
- [docs/manual-test.md](docs/manual-test.md): a checklist through the whole lifecycle
- [chart/README.md](chart/README.md): deploying to the cluster

## Development

Requires Node.js 24 and a local PostgreSQL (18 is used in development).

```sh
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 hardwood
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 hardwood_test
cp .env.example .env
npm install
npm run db:migrate:dev
npm run init -- <your discord handle>   # prints the GM link, password and recovery key once
npm run dev
```

The app runs at http://localhost:3161. Signed-out visitors of the front page are redirected to
the larp's page on larpit.fi; sign in with the invitation link printed by `init`. Keep the printed
credentials in `.dev-credentials.txt` (gitignored).

Fake data for every view: `RECOVERY_KEY=<recovery key> npm run seed:dev` adds 24 invitees in
varied states, all with the password `salasana123`, and prints their invitation links
(`--keep-timeline` keeps the current timeline). Then follow
[docs/manual-test.md](docs/manual-test.md).

## Commands

| Command                                | What it does                                                  |
| -------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                          | Dev server on port 3161 (run `npm run db:migrate:dev` first)  |
| `npm run build`, `npm start`           | Production build and server                                   |
| `npm run init -- <handle>`             | Initialise the event and invite the first GM (once)           |
| `npm run add-gm -- …`                  | Invite or promote a GM (see [operations](docs/operations.md)) |
| `npm run seed:dev`                     | Fake invitees for development (local databases only)          |
| `npm run db:migrate:dev`               | Apply migrations locally and advance the `db` ref             |
| `npm run db:plan -- <slug>`            | Emit the contract and plan a migration                        |
| `npm run format:check`, `npm run lint` | Prettier and ESLint                                           |
| `npm run typecheck`                    | TypeScript                                                    |
| `npm test`                             | Unit tests                                                    |
| `npm run test:integration`             | Integration tests against `TEST_DATABASE_URL`                 |
