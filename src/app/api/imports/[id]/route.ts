import { eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { importDrafts } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const db = await getDb();
    const draft = (await db.select().from(importDrafts).where(eq(importDrafts.id, id)).limit(1))[0];
    if (!draft) throw new ApiError("not_found", "Draft not found", 404);
    return jsonOk({
      id: draft.id,
      status: draft.status,
      error: draft.error,
      draft: draft.extractedJson ? JSON.parse(draft.extractedJson) : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
