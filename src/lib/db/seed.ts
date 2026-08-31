import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { SEED_STAPLES, SEED_TAGS } from "@/lib/env";
import { newId, nowIso } from "@/lib/ids";
import { normalizeIngredientName } from "@/lib/domain/ingredients";
import * as schema from "./schema";

type DB = LibSQLDatabase<typeof schema>;

async function upsertUser(
  db: DB,
  username: string,
  password: string,
  displayName: string,
) {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  if (existing[0]) return;
  await db.insert(schema.users).values({
    id: newId(),
    username,
    passwordHash: await hash(password, 10),
    displayName,
    createdAt: nowIso(),
  });
}

export async function seedIfNeeded(db: DB) {
  const now = nowIso();
  const setting = await db.select().from(schema.settings).limit(1);
  if (setting.length === 0) {
    await db.insert(schema.settings).values({
      id: 1,
      householdServings: 5,
      weekStartsOn: "sunday",
      updatedAt: now,
    });
  }

  await upsertUser(
    db,
    process.env.PLANNER_USERNAME || "planner",
    process.env.PLANNER_PASSWORD || "planner",
    process.env.PLANNER_DISPLAY_NAME || "Planner",
  );
  await upsertUser(
    db,
    process.env.SHOPPER_USERNAME || "shopper",
    process.env.SHOPPER_PASSWORD || "shopper",
    process.env.SHOPPER_DISPLAY_NAME || "Shopper",
  );

  for (const name of SEED_STAPLES) {
    const nameNormalized = normalizeIngredientName(name);
    const found = await db
      .select()
      .from(schema.staples)
      .where(eq(schema.staples.nameNormalized, nameNormalized))
      .limit(1);
    if (found.length === 0) {
      await db.insert(schema.staples).values({
        id: newId(),
        name,
        nameNormalized,
      });
    }
  }

  for (const name of SEED_TAGS) {
    const found = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.name, name))
      .limit(1);
    if (found.length === 0) {
      await db.insert(schema.tags).values({ id: newId(), name });
    }
  }
}
