# Going live

A runbook for putting STF on the internet for a real company. Ordered so
that each step unblocks the next. Times are honest estimates for someone
doing it the first time.

**Read the two warnings at the bottom before you onboard real employees.**

---

## 0. Decide the two accounts you are paying for (10 min)

| | Free tier | Why that is not enough for a customer |
|---|---|---|
| **Supabase** | Project **pauses after 7 days** of inactivity; no daily backups | A paused project is a dead app on a Monday morning. Pro is $25/mo and adds daily backups. |
| **Vercel** | Hobby is licensed for **non-commercial use only** | You are charging a customer. Pro is $20/mo. |

You can deploy on free tiers to test today, but move both to paid before
the customer's employees depend on it. Nothing in the code changes.

**Check your Supabase region now** (Supabase → Settings → General). If the
project is not in `ap-south-1` (Mumbai) and your customer is in India,
every page load pays a round trip across the world. Moving regions means
creating a new project and restoring a dump — much cheaper to do now than
in a month.

---

## 1. Rotate the database password (5 min) — do this first

The current password was typed into a chat window and is in this
conversation's history.

1. Supabase → Settings → Database → **Reset database password**
2. Save the new one in a password manager
3. Update your local `.env.local`
4. Confirm: `npx prisma migrate status`

Everything below uses the new password.

---

## 2. Get the two connection strings (5 min)

Supabase → **Connect** (top bar) → *ORMs* / *Prisma*. Copy the strings
from the dashboard rather than editing the old ones by hand — the pooler
hostname contains your region and differs from the direct host.

| Variable | Which string | Port |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler** | 6543 |
| `DIRECT_URL` | **Session pooler** | 5432 |

This matters. The app runs as serverless functions: every request can open
its own connection, and the direct connection will run out of them under a
real workload. The pooler exists for exactly this. Add
`?pgbouncer=true&connection_limit=1` to `DATABASE_URL` if the dashboard
has not already.

Also note: on newer Supabase projects the **direct** host
(`db.<ref>.supabase.co`) is IPv6-only. If a migration ever fails to
connect from a cloud machine, that is why — use the session pooler.

---

## 3. Deploy to Vercel (20 min)

1. [vercel.com](https://vercel.com) → sign in **with GitHub**
2. **Add New → Project** → import `INETIAFLOW/STF`
3. Framework preset: **Next.js** (auto-detected). Leave the build and
   output settings alone — the repo already runs `prisma generate` as part
   of its build.
4. **Environment Variables** — add these to *Production* **and**
   *Preview*:

```
NEXT_PUBLIC_SUPABASE_URL=https://mcwuzmzslujnlzagijhc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_71oQXHaySqLbSXlyUyX-iw_d4u16_er
DATABASE_URL=<transaction pooler string, port 6543>
DIRECT_URL=<session pooler string, port 5432>
SUPABASE_SECRET_KEY=<Settings → API Keys → secret key, sb_secret_…>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

   **`SUPABASE_SECRET_KEY` is what lets you add employees.** Without it,
   people can be added to the directory but no sign-in account is created,
   and the invitation page says so. Get it from Supabase → Settings → API
   Keys → *secret key* (or the legacy `service_role` key).

   ⚠️ That key bypasses Row Level Security and can read every row in the
   project. It has no `NEXT_PUBLIC_` prefix, and the module that uses it is
   marked `server-only` so a client component importing it fails the build
   rather than shipping it to a browser. Treat it like the database
   password: never in a commit, never in a client component, rotated if
   exposed.

   Do **not** set `STF_DEV_FAKE_SESSION`. It is ignored outside
   development, but there is no reason for it to exist in production.

5. **Deploy.** First build is ~3 minutes.
6. Settings → Functions → **Region**: set it to match your Supabase region.

You now have a URL like `stf-xyz.vercel.app`. It will load the marketing
pages. Sign-in will not work correctly until step 5.

---

## 4. Point a domain at it (30 min, plus DNS propagation)

Buy a domain if you have not (`.in` or `.com`, ~₹800–1200/yr). In Vercel →
Settings → Domains → add it, then create the records your registrar asks
for. HTTPS is automatic.

Use a real domain rather than the `.vercel.app` URL: you will need it for
email (step 6) and it is what the customer's staff will type on their
phones every morning.

---

## 5. Tell Supabase about the domain (5 min) — sign-in breaks without this

Supabase → Authentication → **URL Configuration**:

- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: add `https://yourdomain.com/**`

Skip this and password-reset emails will send people to `localhost:3000`.

---

## 6. Set up real email (45 min) — nothing works without it

**This is the step people skip and regret.** Supabase's built-in email
service sends only a handful of messages per hour and is explicitly for
testing. With it, a 30-person rollout stalls after the first few and the
failures are silent.

1. Sign up for an email provider — [Resend](https://resend.com) is the
   quickest (free tier covers a pilot). Brevo and AWS SES also work.
2. Verify your domain there (a few DNS records — SPF/DKIM).
3. Supabase → Authentication → Emails → **SMTP Settings** → enter the
   provider's host, port, user and password, and a sender address at your
   own domain.
4. Send yourself a password reset from `/forgot-password` and confirm it
   arrives and the link opens `/reset` on your domain.

While you are there, edit the email templates (Authentication → Emails).
The defaults say "Supabase", which is confusing for a warehouse
supervisor.

---

Point Supabase's SMTP settings and STF's `SMTP_*` variables at the **same
provider account** — one set of credentials, two consumers (Supabase sends
password resets, STF sends invitations).

## 7. Create the customer's company (15 min)

The database currently holds a **demo tenant with placeholder people**.
Create the real one, and do not let demo data reach the customer.

Run from your machine, with `.env.local` pointing at production:

```bash
npx tsx scripts/provision-user.ts owner@customer.com OWNER "Owner Name"
```

Then create their Supabase auth account: Supabase → Authentication →
Users → **Add user** → same email → set a password → tick *Auto Confirm*.
The two link by verified email on first sign-in.

Sign in as them and set up the company (locations, shifts, rules,
departments, modules). `PILOT.md` is written to be handed to the owner for
this. Everyone after the owner is added from the screen — see *Adding the
rest of the team* below.

---

## 8. Before you hand over the URL (30 min)

- [ ] Sign in as the owner on a **real phone**, not a desktop browser
- [ ] Check in from the actual work location — confirm the radius is right
- [ ] Turn the phone to aeroplane mode, check in, restore signal, confirm
      it syncs with the original time
- [ ] Confirm the demo tenant's data is invisible from the customer's login
- [ ] Take a database backup: `pg_dump "$DIRECT_URL" -Fc -f pre-pilot.dump`

---

## Adding the rest of the team

Employees → **Add employee**. Name, mobile number and role are the only
required fields. With an email address they get an invitation and set
their own password; the directory then shows **Pending**, **Accepted** or
**Expired**, and you can resend, withdraw or deactivate from their profile.

Two things to know before you start:

- **Without `SUPABASE_SECRET_KEY` (step 3) nobody can sign in.** People are
  still added and their attendance still records — but no sign-in account
  is created, and the invitation page says so plainly. Set the key first.
- **Without SMTP (step 6) no invitation is emailed.** STF does not pretend
  otherwise: it shows you a copyable link to send by WhatsApp instead. That
  link is also the answer for staff who have no email address at all.

An invitation lasts 7 days and works once. Resending issues a **new** link
and kills the old one, so a link that leaked cannot be revived by asking
for another.

## Warning B — what you are taking on with real employee data

The moment a real company's staff use this, you are holding their names,
phone numbers, salaries, ID documents and location-at-check-in. Under
India's DPDP Act that makes you a data processor for your customer.

Three things that are genuinely not optional:

1. **A privacy policy and terms**, published at your domain and linked
   from sign-in. It must say what is collected, why, and for how long.
2. **A written agreement with the customer** covering who owns the data
   and what happens to it if they leave.
3. **Retention windows.** STF does not delete anything today, and there is
   no self-service export or deletion — see `ACCEPTANCE.md` §G. Decide the
   windows with the customer and write them down, even if the deletion is
   manual at first.

Two further items from `ACCEPTANCE.md` that are still open, so you are not
surprised by them later: **no assistive-technology testing has been done**,
and **the payroll rules have not been reviewed by a qualified
professional**. STF makes no compliance claim and computes no statutory
amount — but the customer should hear that from you before their first
payroll, not after.

---

## Rough cost, monthly

| | |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Email (Resend free tier) | $0 |
| Domain | ~₹100/mo equivalent |
| **Total** | **~$45/mo** (~₹4,000) |

---

## If something breaks

- **Build failed on Vercel** — read the log; it is almost always a missing
  environment variable.
- **App loads but every screen is empty** — `DATABASE_URL` is wrong, or
  RLS was applied to a new table. `npx tsx scripts/setup-rls.ts --status`.
- **"Too many connections"** — `DATABASE_URL` is pointing at the direct
  connection instead of the transaction pooler (step 2).
- **Password reset email never arrives** — step 6 was skipped.
- **Reset link 404s** — the redirect allow-list in step 5 is missing.

`OPERATIONS.md` has the incident procedure, backup/restore and the offline
queue's support queries.
