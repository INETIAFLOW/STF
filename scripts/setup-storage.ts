/**
 * Provision the private `task-proof` storage bucket and its access
 * policies (SECURITY-NOTES.md → file storage).
 *
 * Rules enforced here:
 * - The bucket is PRIVATE. Files are never served from a public path;
 *   reads go through short-lived signed URLs generated server-side.
 * - 10 MB per file, images and PDF only (component spec §25 constraints).
 * - Authenticated users may upload; nobody may read, update or delete
 *   through the anon/authenticated roles. Downloads happen server-side
 *   with the service role, which bypasses RLS and is audited in app code.
 *
 * Idempotent. Usage: npx tsx scripts/setup-storage.ts
 */
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const BUCKET = "task-proof";
const MAX_BYTES = 10 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL / DIRECT_URL is not set. See SETUP.md.");
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  await client.connect();

  await client.query(
    `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     values ($1, $1, false, $2, $3)
     on conflict (id) do update
       set public = false,
           file_size_limit = excluded.file_size_limit,
           allowed_mime_types = excluded.allowed_mime_types`,
    [BUCKET, MAX_BYTES, MIME],
  );

  // Policies are dropped and recreated so this script stays idempotent.
  await client.query(
    `drop policy if exists "task_proof_authenticated_insert" on storage.objects`,
  );
  await client.query(
    `create policy "task_proof_authenticated_insert"
     on storage.objects for insert to authenticated
     with check (bucket_id = '${BUCKET}')`,
  );

  // No select/update/delete policy exists by design: reads are signed-URL
  // only, and deletion is an audited server-side operation.
  await client.query(
    `drop policy if exists "task_proof_authenticated_select" on storage.objects`,
  );
  await client.query(
    `drop policy if exists "task_proof_authenticated_delete" on storage.objects`,
  );

  const { rows } = await client.query(
    `select id, public, file_size_limit, allowed_mime_types
     from storage.buckets where id = $1`,
    [BUCKET],
  );
  const policies = await client.query(
    `select policyname, cmd, roles::text
     from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname like 'task_proof%'
     order by policyname`,
  );

  console.log("bucket:", rows[0]);
  console.log("policies:", policies.rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.end());
