/**
 * Force every Vitest worker onto the isolated test database.
 * Overrides a developer shell/.env DATABASE_URL that points at prisma/dev.db.
 */
process.env.DATABASE_URL = "file:./test.db";

process.env.SESSION_SECRET ??=
  "test-session-secret-min-32-characters-long!!";
