import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { importDrafts } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/ids";
import { importFromUrl } from "@/lib/import/run";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) throw new ApiError("invalid", "URL is required", 400);
    const result = await importFromUrl(url);
    const id = newId();
    const db = await getDb();
    await db.insert(importDrafts).values({
      id,
      sourceUrl: url,
      sourceKind: result.draft.sourceKind,
      status: result.status,
      extractedJson: JSON.stringify(result.draft),
      error: result.error,
      createdBy: user.id,
      createdAt: nowIso(),
    });
    return jsonOk(
      {
        id,
        status: result.status,
        error: result.error,
        draft: result.draft,
      },
      201,
    );
  } catch (error) {
    return jsonError(error);
  }
}
