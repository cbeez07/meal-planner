import { eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { nowIso } from "@/lib/ids";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();
    const db = await getDb();
    const row = (await db.select().from(settings).limit(1))[0];
    return jsonOk({
      householdServings: row?.householdServings ?? 5,
      weekStartsOn: row?.weekStartsOn ?? "sunday",
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser();
    const body = (await request.json()) as {
      householdServings?: number;
      weekStartsOn?: string;
    };
    if (body.householdServings != null && body.householdServings < 1) {
      throw new ApiError("invalid", "Servings must be at least 1", 400);
    }
    const db = await getDb();
    const row = (await db.select().from(settings).limit(1))[0];
    if (!row) throw new ApiError("not_found", "Settings missing", 500);
    await db
      .update(settings)
      .set({
        householdServings: body.householdServings ?? row.householdServings,
        weekStartsOn: body.weekStartsOn ?? row.weekStartsOn,
        updatedAt: nowIso(),
      })
      .where(eq(settings.id, 1));
    const updated = (await db.select().from(settings).limit(1))[0];
    return jsonOk({
      householdServings: updated.householdServings,
      weekStartsOn: updated.weekStartsOn,
    });
  } catch (error) {
    return jsonError(error);
  }
}
