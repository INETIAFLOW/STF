# STF Operations

Practical procedures for running STF. Written for whoever is on the hook
when something breaks — not as a compliance artefact.

## Environments

| | Where |
|---|---|
| Database | Supabase Postgres (`db.mcwuzmzslujnlzagijhc.supabase.co`) |
| Auth | Supabase Auth |
| Files | Supabase Storage, buckets `task-proof` and `employee-documents` (both private) |
| App | Next.js, run locally today; no production host chosen yet |

## Secrets

| Secret | Where it lives | Rotate when |
|---|---|---|
| Database password | `.env.local`, gitignored | **Now** — it was shared in chat during development. Supabase → Settings → Database → Reset password, then update `.env.local`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Public by design; rotate only if the project is compromised |
| `service_role` key | **Not used by this app** | — |

No secret is stored in application tables, and none is committed.

## Backup and restore

Supabase takes automatic daily backups on paid plans; free projects do
not. **Check which you have before relying on it** (Supabase → Database →
Backups).

Manual backup (works on any plan):

```bash
pg_dump "$DIRECT_URL" --no-owner --no-privileges -Fc -f stf-backup.dump
```

Restore into a scratch project to rehearse:

```bash
pg_restore --no-owner --no-privileges -d "$SCRATCH_DIRECT_URL" stf-backup.dump
```

**Rehearse the restore before the pilot.** A backup nobody has restored is
a hope, not a backup. This has **not** been rehearsed yet — it needs a
second Supabase project, which is the customer's call to create.

Storage buckets are **not** covered by a database dump. Files must be
copied separately (Supabase CLI `storage download`, or the dashboard).

## Migrations

```bash
npx prisma migrate deploy    # apply
npx prisma migrate status    # confirm
```

Migrations are additive and hand-reviewed. Two rules that have held so
far and should keep holding:

- **Never rewrite history.** Past attendance keeps the policy version and
  branch snapshot it was recorded with. A migration that "corrects" old
  rows destroys evidence.
- **Never guess.** The multi-location migration deliberately did not
  assign anyone a work location; it left the gap visible instead.

Rollback: each migration file names its own reversal in a comment where
one is not obvious.

## Row Level Security

RLS is enabled on all 25 tenant tables with no permissive policy, so the
anon and authenticated API keys can read nothing. The app connects as the
table owner and is unaffected.

```bash
npx tsx scripts/setup-rls.ts --status     # report
npx tsx scripts/setup-rls.ts              # apply (idempotent)
npx tsx scripts/setup-rls.ts --rollback   # undo
```

If a screen suddenly returns empty after a database change, check
`--status` first: a new table added without RLS is a hole, and a new
connection role that is not the owner will read nothing.

## Incidents

1. **Contain.** If data may be exposed, rotate the database password and
   the publishable key immediately, and disable public sign-ups
   (Supabase → Authentication → Providers).
2. **Preserve evidence.** `audit_events` is append-only and is the record
   of who did what. Do not delete rows to tidy up.
3. **Assess scope.** Query `audit_events` by `tenantId` and time window.
   Sensitive-data access (`employee.salary_viewed`, `document.viewed`,
   `report.exported`) is logged with the actor.
4. **Tell the customer.** They own the data. Say what happened, what was
   accessible, and what you did — in the same plain language the product
   uses.
5. **Write it down.** Add a dated entry to `DECISIONS.md` if the fix
   changes behaviour.

## Support access

There is **no impersonation feature**, deliberately. If support needs to
see a tenant's data, it is a database query by someone with the password,
and it is not currently logged as an audit event. Before the pilot, either
build the support-session flow the design specifies (persistent
non-dismissible warning band, time-bound, every action attributed to the
real operator) or agree in writing that support does not access customer
data.

## Monitoring

Not set up. Before a pilot, at minimum: uptime check on the app, Supabase
project health alerts, and a weekly look at `audit_events` for unexpected
sensitive-data access.

## Known gaps

- Backup restore not rehearsed.
- No production host, no monitoring, no alerting.
- No support-session flow.
- Storage files are not in the database backup.
- Scheduled daily summaries need a notification provider.
