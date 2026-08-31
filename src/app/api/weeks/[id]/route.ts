import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { getWeekWithSlots } from "@/lib/weeks";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const week = await getWeekWithSlots(id);
    if (!week) throw new ApiError("not_found", "Week not found", 404);
    return jsonOk(week);
  } catch (error) {
    return jsonError(error);
  }
}
