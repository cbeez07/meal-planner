import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { shoppingListItems } from "@/lib/db/schema";
import { classifyAisle, normalizeIngredientName } from "@/lib/domain/ingredients";
import { newId } from "@/lib/ids";
import { requireUser } from "@/lib/session";
import { groupByAisle, regenerateShoppingList } from "@/lib/shopping/regenerate";
import { getWeekWithSlots } from "@/lib/weeks";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const week = await getWeekWithSlots(id);
    if (!week) throw new ApiError("not_found", "Week not found", 404);
    const items = await regenerateShoppingList(id);
    return jsonOk({ weekId: id, groups: groupByAisle(items) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const week = await getWeekWithSlots(id);
    if (!week) throw new ApiError("not_found", "Week not found", 404);
    const body = (await request.json()) as {
      name?: string;
      amount?: number | null;
      unit?: string | null;
      aisle?: string;
    };
    const name = body.name?.trim();
    if (!name) throw new ApiError("invalid", "Name is required", 400);
    const db = await getDb();
    const item = {
      id: newId(),
      weekId: id,
      name,
      nameNormalized: normalizeIngredientName(name),
      amount: body.amount ?? null,
      unit: body.unit ?? null,
      aisle: body.aisle ?? classifyAisle(name),
      checked: 0,
      source: "manual",
    };
    await db.insert(shoppingListItems).values(item);
    const items = await regenerateShoppingList(id);
    return jsonOk({ weekId: id, groups: groupByAisle(items) }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
