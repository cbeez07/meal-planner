import { eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { staples } from "@/lib/db/schema";
import { normalizeIngredientName } from "@/lib/domain/ingredients";
import { newId } from "@/lib/ids";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();
    const db = await getDb();
    const rows = await db.select().from(staples);
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return jsonOk({ staples: rows });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) throw new ApiError("invalid", "Name is required", 400);
    const nameNormalized = normalizeIngredientName(name);
    const db = await getDb();
    const existing = (
      await db.select().from(staples).where(eq(staples.nameNormalized, nameNormalized)).limit(1)
    )[0];
    if (existing) return jsonOk({ staple: existing });
    const staple = { id: newId(), name, nameNormalized };
    await db.insert(staples).values(staple);
    return jsonOk({ staple }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
