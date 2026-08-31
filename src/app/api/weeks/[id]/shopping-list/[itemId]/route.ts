import { and, eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { shoppingListItems } from "@/lib/db/schema";
import { normalizeIngredientName } from "@/lib/domain/ingredients";
import { requireUser } from "@/lib/session";
import { groupByAisle, regenerateShoppingList } from "@/lib/shopping/regenerate";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    await requireUser();
    const { id, itemId } = await context.params;
    const body = (await request.json()) as {
      checked?: boolean;
      name?: string;
      amount?: number | null;
    };
    const db = await getDb();
    const item = (
      await db
        .select()
        .from(shoppingListItems)
        .where(and(eq(shoppingListItems.id, itemId), eq(shoppingListItems.weekId, id)))
        .limit(1)
    )[0];
    if (!item) throw new ApiError("not_found", "Item not found", 404);
    await db
      .update(shoppingListItems)
      .set({
        checked: body.checked == null ? item.checked : body.checked ? 1 : 0,
        name: body.name?.trim() || item.name,
        nameNormalized: body.name ? normalizeIngredientName(body.name) : item.nameNormalized,
        amount: body.amount === undefined ? item.amount : body.amount,
      })
      .where(eq(shoppingListItems.id, itemId));
    const items = await regenerateShoppingList(id);
    return jsonOk({ weekId: id, groups: groupByAisle(items) });
  } catch (error) {
    return jsonError(error);
  }
}
