import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { databasePath } from "@/lib/env";
import * as schema from "./schema";
import { seedIfNeeded } from "./seed";

type DB = LibSQLDatabase<typeof schema>;

let dbPromise: Promise<DB> | null = null;

async function applyMigration(client: Client) {
  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
  );
  if (existing.rows.length > 0) return;

  const sqlPath = path.join(process.cwd(), "drizzle", "0000_init.sql");
  const sql = await readFile(sqlPath, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.execute(statement);
  }
}

export async function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const file = databasePath();
      await mkdir(path.dirname(file), { recursive: true });
      const client = createClient({ url: `file:${file}` });
      await client.execute("PRAGMA foreign_keys = ON");
      await applyMigration(client);
      const db = drizzle(client, { schema });
      await seedIfNeeded(db);
      return db;
    })();
  }
  return dbPromise;
}

export function resetDbForTests() {
  dbPromise = null;
}
