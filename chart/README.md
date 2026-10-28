# Hardwood Helm chart

Deploys Hardwood for one event: a Next.js Deployment (`node`, one replica, with a Prisma
migration init container), its Service, and a per-namespace Gateway with HTTPRoutes.
cert-manager issues the TLS certificate from the Gateway's `cert-manager.io/cluster-issuer`
annotation. One release per event; `values-production.yaml` is Hardwood High 1 at
https://hardwood.larpit.fi.

## Database

Create the database and its role by hand on the database server. The chart never creates or
drops anything. An ICU Finnish collation is recommended so that names sort the Finnish way:

```sql
create role hardwood login password '...';
create database hardwood owner hardwood template template0 encoding 'UTF8'
  locale_provider icu icu_locale 'fi-FI';
```

The `migrate` init container applies migrations on every rollout, and only ever runs
`migration check` and `db migrate`. **Never run `prisma db update` (or `db init`) against the
production database**: it plans destructive changes from the contract instead of applying the
reviewed migrations.

## Prerequisites per namespace

```sh
kubectl create namespace hardwood
kubectl -n hardwood create secret generic hardwood \
  --from-literal=DATABASE_URL='postgresql://hardwood:...@db.example.com/hardwood?sslmode=verify-full' \
  --from-literal=SESSION_SECRET="$(openssl rand -base64 32)"
```

Both keys are mandatory: the server refuses to start without them rather than fall back to
development defaults. Changing `SESSION_SECRET` signs everybody out; it does not affect stored
data.

## Deploying

CI (`.github/workflows/cicd.yaml`) deploys every push to `main`. By hand:

```sh
helm upgrade --install hardwood chart --namespace hardwood \
  -f chart/values-production.yaml \
  --set image.repository=ghcr.io/con2/hardwood \
  --set image.tag=<short commit sha> \
  --wait --timeout 300s
```

## First run

After the first deploy, initialise the event (audience keys, recovery key, Event and Survey rows
and the first GM) once:

```sh
kubectl -n hardwood exec deploy/node -- node_modules/.bin/tsx src/bin/init.ts <gm-discord-handle>
```

It prints the first GM's invitation link, their initial password and the **recovery key**, each
shown only once. Running it again does nothing.

- Store the recovery key offline (e.g. a password manager entry not shared with the app's
  operators, or on paper). It unlocks every audience key; whoever holds it can read all data.
  Do not paste it into chat or tickets.
- Hand the invitation link and the initial password to the GM over Discord. They set their own
  password on first sign-in.

## Adding GMs

GMs are added from the command line, not the UI. The tool unlocks the audience keys either
with an existing GM's invitation link (or token) and password, or with the recovery key. Use
`-it` so the password can be prompted for without echo:

```sh
# As an existing GM: invite a new GM.
kubectl -n hardwood exec -it deploy/node -- \
  node_modules/.bin/tsx src/bin/add-gm.ts --token <your invitation link> --discord-handle <handle>

# Promote an existing invitee instead.
kubectl -n hardwood exec -it deploy/node -- \
  node_modules/.bin/tsx src/bin/add-gm.ts --token <your invitation link> --promote <user id>
```

With the recovery key instead of a GM's credentials, set `RECOVERY_KEY` inside the pod so the
key stays out of shell history and process listings:

```sh
kubectl -n hardwood exec -it deploy/node -- sh
stty -echo; read RECOVERY_KEY; stty echo; export RECOVERY_KEY
node_modules/.bin/tsx src/bin/add-gm.ts --discord-handle <handle>
exit
```

`HARDWOOD_PASSWORD` likewise replaces the password prompt for scripting. A new GM invitation
prints its link and initial password once; hand them over Discord as above. A promoted user gets
the GM key on their next sign-in.

## Password reset

There is no self-service reset. An invitee who has forgotten their password contacts the GMs on
Discord, and a GM resets it from the Players view. The reset issues a new initial password,
which the GM hands over Discord, and re-wraps the invitee's keys so their survey responses and
flags survive. On their next sign-in the invitee is taken to the Accept Invitation view to set a
new password.
