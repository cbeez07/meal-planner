import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { staples } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await context.params;
    const db = await getDb();
    await db.delete(staples).where(eq(staples.id, id));
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
