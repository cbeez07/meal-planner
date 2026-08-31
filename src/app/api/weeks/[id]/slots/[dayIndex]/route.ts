import { and, eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { recipes, weekSlots } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { getWeekWithSlots } from "@/lib/weeks";

const KINDS = new Set(["empty", "dinner", "leftover", "eat_out", "skip"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; dayIndex: string }> },
) {
  try {
    await requireUser();
    const { id, dayIndex: dayRaw } = await context.params;
    const dayIndex = Number(dayRaw);
    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      throw new ApiError("invalid", "dayIndex must be 0-6", 400);
    }
    const body = (await request.json()) as {
      kind?: string;
      recipeId?: string | null;
      isAnchor?: boolean;
    };
    const kind = body.kind ?? "empty";
    if (!KINDS.has(kind)) throw new ApiError("invalid", "Invalid slot kind", 400);

    const week = await getWeekWithSlots(id);
    if (!week) throw new ApiError("not_found", "Week not found", 404);

    const dinnerCount = week.slots.filter((s) => s.kind === "dinner").length;
    const thisSlot = week.slots.find((s) => s.dayIndex === dayIndex);
    const addingDinner = kind === "dinner" && thisSlot?.kind !== "dinner";
    if (addingDinner && dinnerCount >= 5) {
      throw new ApiError("max_dinners", "A week can have at most 5 dinners", 400);
    }
    if (kind === "dinner" && !body.recipeId) {
      throw new ApiError("invalid", "Dinner slots need a recipe", 400);
    }

    const db = await getDb();
    if (kind === "dinner" && body.recipeId) {
      const recipe = (
        await db.select().from(recipes).where(eq(recipes.id, body.recipeId)).limit(1)
      )[0];
      if (!recipe) throw new ApiError("not_found", "Recipe not found", 404);
    }

    const recipeId = kind === "dinner" ? (body.recipeId ?? null) : null;
    let isAnchor = body.isAnchor ? 1 : 0;
    if (kind !== "dinner") isAnchor = 0;
    if (isAnchor === 1) {
      await db.update(weekSlots).set({ isAnchor: 0 }).where(eq(weekSlots.weekId, id));
    }

    await db
      .update(weekSlots)
      .set({ kind, recipeId, isAnchor })
      .where(and(eq(weekSlots.weekId, id), eq(weekSlots.dayIndex, dayIndex)));

    return jsonOk(await getWeekWithSlots(id));
  } catch (error) {
    return jsonError(error);
  }
}
