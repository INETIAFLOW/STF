import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI (migrate/seed) talks to the DIRECT connection; the app uses
    // the pooled DATABASE_URL via the driver adapter in src/lib/db.ts
    // (Supabase: port 5432 direct / 6543 pooled). See SETUP.md.
    url: env("DIRECT_URL"),
  },
});
