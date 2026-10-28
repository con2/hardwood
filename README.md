# Hardwood

Invitation-only sign-up system for larps with sensitive themes. See [docs/spec.md](docs/spec.md)
for what it does and [docs/plan.md](docs/plan.md) for how it is built.

## Development

Requires Node.js 24 and a local PostgreSQL (18 is used in development).

```sh
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 hardwood
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 hardwood_test
cp .env.example .env
npm install
npm run db:migrate:dev
npm run dev
```

The app runs at http://localhost:3161. Signed-out visitors of the front page are redirected to
the larp's page on larpit.fi.

Checks: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`,
`npm run test:integration` (uses `TEST_DATABASE_URL`).
