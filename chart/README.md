# Hardwood Helm chart

Deploys Hardwood for one event: a Next.js Deployment (`node`, one replica, with a Prisma
migration init container), its Service, and a per-namespace Gateway with HTTPRoutes.
cert-manager issues the TLS certificate from the Gateway's `cert-manager.io/cluster-issuer`
annotation. One release per event; `values-production.yaml` is Hardwood High 1 at
https://hardwood.larpit.fi.

## Database

Production uses the shared CloudNativePG cluster on qb. The role, database and password come
from `infrastructure/kubernetes/postgres/README.md`; the chart never creates or drops anything.
The database is `larpithardwood` (the namespace name without the hyphen, which the role name
cannot carry):

```sh
cd infrastructure/kubernetes/postgres
./create-app-database.sh larpithardwood
```

Every database the script creates is Finnish on ICU (`fi-FI`), so names sort the Finnish way.
Elsewhere, create the equivalent by hand:

```sql
create role larpithardwood login password '...';
create database larpithardwood owner larpithardwood template template0 encoding 'UTF8'
  locale_provider icu icu_locale 'fi-FI';
```

The `migrate` init container applies migrations on every rollout, and only ever runs
`migration check` and `db migrate`. **Never run `prisma db update` (or `db init`) against the
production database**: it plans destructive changes from the contract instead of applying the
reviewed migrations.

## Prerequisites per namespace

The namespace is `larpit-hardwood` (the public hostname is under larpit.fi). Create it with
the infrastructure repository's script so the default ServiceAccount gets the con2 image pull
secrets, then the Secret the chart reads. `DATABASE_URL` starts as a placeholder:
`update-secret.sh` recognises the Secret by that key and overwrites it with the in-cluster URL
(`sslmode=disable`; traffic never leaves the pod network and the operator rotates its own CA).

```sh
infrastructure/kubernetes/create-namespace.sh larpit-hardwood
kubectl -n larpit-hardwood create secret generic hardwood \
  --from-literal=DATABASE_URL=placeholder \
  --from-literal=SESSION_SECRET="$(openssl rand -base64 32)" \
  --from-literal=KDF_PEPPER="$(openssl rand -base64 32)"
(cd infrastructure/kubernetes/postgres && ./update-secret.sh larpithardwood larpit-hardwood hardwood)
```

All three keys are mandatory: the server refuses to start without them rather than fall back
to development defaults. Changing `SESSION_SECRET` signs everybody out; it does not affect stored
data. `KDF_PEPPER` is mixed into every password-derived key: **never change or lose it** once
users exist, or no password unlocks any more (the recovery key still works; GMs then reset every
password). Keep a copy with the recovery key. The script also writes `DATABASE_URL_POOLED` and `DATABASE_URL_REPLICA`, which Hardwood
ignores: one small process does not need the pooler.

## Deploying

CI (`.github/workflows/cicd.yaml`) deploys every push to `main`. By hand:

```sh
helm upgrade --install hardwood chart --namespace larpit-hardwood \
  -f chart/values-production.yaml \
  --set image.repository=ghcr.io/con2/hardwood \
  --set image.tag=<short commit sha> \
  --wait --timeout 300s
```

## Running the command-line tools

`init`, `add-gm`, `upgrade` and `rotate-key` handle the recovery key, GM passwords and audience
keys. Run them from a laptop checkout of the deployed commit against a port-forwarded database,
so that none of that passes through the pod:

```sh
# Terminal 1: the CNPG cluster's read-write Service (the host part of DATABASE_URL names it and
# its namespace).
kubectl -n <cnpg namespace> port-forward svc/<cnpg rw service> 5433:5432

# Terminal 2: the Secret's values, with the database host swapped for the port-forward.
secret() { kubectl -n larpit-hardwood get secret hardwood -o jsonpath="{.data.$1}" | base64 -d; }
export DATABASE_URL="$(secret DATABASE_URL | sed -E 's#@[^/]+/#@localhost:5433/#')"
export KDF_PEPPER="$(secret KDF_PEPPER)"
export PUBLIC_URL=https://hardwood.larpit.fi EVENT_LOCALE=fi
```

The tools warn when they run with the development `KDF_PEPPER`: against production, sign-ins
would fail and new invitations would not unlock on the server. Set the recovery key, when needed,
without echo so it stays out of shell history: `read -rs RECOVERY_KEY && export RECOVERY_KEY`.
`HARDWOOD_PASSWORD` likewise replaces the password prompt of `--token`.

If a laptop is not an option, `kubectl exec` into the pod works too; the image carries the
sources and the environment is already set:

```sh
kubectl -n larpit-hardwood exec -it deploy/node -- sh
stty -echo; read RECOVERY_KEY; stty echo; export RECOVERY_KEY
node_modules/.bin/tsx src/bin/add-gm.ts --discord-handle <handle>
exit
```

## First run

After the first deploy, initialise the event (audience keys, recovery key, Event and Survey rows
and the first GM) once:

```sh
npm run init -- <gm-discord-handle>
```

It prints the first GM's invitation link, their initial password and the **recovery key**, each
shown only once, and the GM public key. Running it again does nothing.

- Store the recovery key offline (e.g. a password manager entry not shared with the app's
  operators, or on paper), with a copy of `KDF_PEPPER`. It unlocks every audience key; whoever
  holds it can read all data. Do not paste it into chat or tickets.
- Put the GM public key in `values-production.yaml` as `event.gmPublicKey` and deploy. Until
  then the server refuses to store anything sealed to the GMs, so invitees cannot save flags or
  practical answers. The key is not secret.
- Hand the invitation link and the initial password to the GM over Discord. They set their own
  password on first sign-in.

## GM public key

Invitees seal data for the GMs to `GM_PUBLIC_KEY` (`event.gmPublicKey`), not to the copy in the
database, which anyone with write access could replace. GM pages check the GM key against both
and fail with an error when either differs: then the database row or the chart value has been
changed, and nothing should be deployed until someone finds out which. `init`, `add-gm`,
`upgrade` and `rotate-key --audience gm` print the right value.

## Adding GMs

GMs are added from the command line, not the UI. The tool unlocks the audience keys either
with an existing GM's invitation link (or token) and password, or with the recovery key:

```sh
# As an existing GM: invite a new GM (the password is prompted for without echo).
npm run add-gm -- --token <your invitation link> --discord-handle <handle>

# Promote an existing invitee instead.
npm run add-gm -- --token <your invitation link> --promote <user id>

# With the recovery key instead of a GM's credentials.
npm run add-gm -- --discord-handle <handle>
```

A new GM invitation prints its link and initial password once; hand them over Discord as above.
A promoted user gets the GM key on their next sign-in.

## Upgrading data from before the cryptography review fixes

Data written before the 2026-10-29 fixes (unbound public keys, records without authenticators)
is converted once with `npm run upgrade`. The order matters, because the commit that drops the
old formats makes unconverted data unreadable:

1. Add `KDF_PEPPER` to the Secret and keep a copy with the recovery key. The server refuses to
   start without it.

   ```sh
   kubectl -n larpit-hardwood patch secret hardwood --type merge \
     -p "{\"stringData\":{\"KDF_PEPPER\":\"$(openssl rand -base64 32)\"}}"
   ```

2. Set `event.gmPublicKey` in `values-production.yaml` to the current
   `select gm_public_key from event` (the next step checks it), and deploy the commits up to
   `rotate-key`, but not the one that drops the old formats. Everyone signs in again once.
3. Run `npm run upgrade` with the recovery key as above. It checks the GM public key, binds every
   public key, rewrites every old record and prints counts. Running it again changes nothing.
4. Sign in as a GM and as an invitee and check Flags and Players, then deploy the rest.

## Rotating keys

When a GM or an admin with access to the Secret leaves, rotate the audience keys they held with
`npm run rotate-key` (see `docs/operations.md`, "Rotating keys"). Scale the deployment to zero
first and deploy the new GM public key before scaling it up again.

## Password reset

There is no self-service reset. An invitee who has forgotten their password contacts the GMs on
Discord, and a GM resets it from the Players view. The reset issues a new initial password,
which the GM hands over Discord, and re-wraps the invitee's keys so their survey responses and
flags survive. On their next sign-in the invitee is taken to the Accept Invitation view to set a
new password.
