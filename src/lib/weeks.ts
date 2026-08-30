import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipes, weekSlots, weeks } from "@/lib/db/schema";
import { sundayOf } from "@/lib/dates";
import { newId, nowIso } from "@/lib/ids";

export async function getOrCreateWeek(startRaw: string) {
  const startDate = sundayOf(startRaw);
  const db = await getDb();
  let week = (await db.select().from(weeks).where(eq(weeks.startDate, startDate)).limit(1))[0];
  if (!week) {
    week = { id: newId(), startDate, createdAt: nowIso() };
    await db.insert(weeks).values(week);
    await db.insert(weekSlots).values(
      Array.from({ length: 7 }, (_, dayIndex) => ({
        id: newId(),
        weekId: week.id,
        dayIndex,
        kind: "empty",
        recipeId: null,
        isAnchor: 0,
      })),
    );
  }
  return week;
}

export async function getWeekWithSlots(weekId: string) {
  const db = await getDb();
  const week = (await db.select().from(weeks).where(eq(weeks.id, weekId)).limit(1))[0];
  if (!week) return null;
  const slots = await db.select().from(weekSlots).where(eq(weekSlots.weekId, weekId));
  slots.sort((a, b) => a.dayIndex - b.dayIndex);
  const recipeIds = slots.map((s) => s.recipeId).filter((id): id is string => !!id);
  const recipeRows = recipeIds.length
    ? await db.select().from(recipes).where(inArray(recipes.id, recipeIds))
    : [];
  const byId = new Map(recipeRows.map((r) => [r.id, r]));
  return {
    id: week.id,
    startDate: week.startDate,
    slots: slots.map((slot) => ({
      id: slot.id,
      dayIndex: slot.dayIndex,
      kind: slot.kind,
      isAnchor: slot.isAnchor === 1,
      recipe: slot.recipeId
        ? {
            id: slot.recipeId,
            title: byId.get(slot.recipeId)?.title ?? "Recipe",
            sourceServings: byId.get(slot.recipeId)?.sourceServings ?? 5,
          }
        : null,
    })),
  };
}
