import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** SQLite file under prisma/ (same resolution as DATABASE_URL=file:./test.db). */
export const TEST_DATABASE_URL = "file:./test.db";

/**
 * Prepare an isolated SQLite database for Vitest.
 * Does not touch prisma/dev.db used by local `pnpm dev`.
 */
export default function globalSetup(): void {
  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  execSync("pnpm exec prisma migrate deploy", {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });

  execSync("pnpm exec tsx prisma/seed.ts", {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });
}
