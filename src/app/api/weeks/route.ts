import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { currentOrUpcomingSunday, sundayOf } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getOrCreateWeek, getWeekWithSlots } from "@/lib/weeks";

export async function GET(request: Request) {
  try {
    await requireUser();
    const start = new URL(request.url).searchParams.get("start") ?? currentOrUpcomingSunday();
    try {
      sundayOf(start);
    } catch {
      throw new ApiError("invalid", "start must be YYYY-MM-DD (non-Sunday dates are coerced to that week's Sunday)", 400);
    }
    const week = await getOrCreateWeek(start);
    const full = await getWeekWithSlots(week.id);
    return jsonOk(full);
  } catch (error) {
    return jsonError(error);
  }
}
