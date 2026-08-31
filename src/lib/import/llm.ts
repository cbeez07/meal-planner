import type { DraftRecipe } from "./extract";
import { draftIsThin } from "./extract";

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

export async function maybeEnrichWithLlm(
  draft: DraftRecipe,
  rawText: string,
  deadline: number,
): Promise<DraftRecipe> {
  if (!draftIsThin(draft)) return draft;
  const base = process.env.LLM_BASE_URL?.trim();
  const key = process.env.LLM_API_KEY?.trim();
  if (!base && !key) return draft;
  const budget = remainingMs(deadline);
  if (budget < 2500) return draft;

  const url = `${(base || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(budget - 200, 8000));
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract a cooking recipe as JSON: {title, sourceServings, timeMinutes, notes, ingredients:[{name,amount,unit}], steps:[{body}]}. amount is a number or null. Do not invent precise amounts you cannot see.",
          },
          { role: "user", content: rawText.slice(0, 8000) },
        ],
      }),
    });
    if (!res.ok) return draft;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return draft;
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as Partial<DraftRecipe>;
    return {
      ...draft,
      title: parsed.title || draft.title,
      sourceServings: parsed.sourceServings && parsed.sourceServings >= 1 ? parsed.sourceServings : draft.sourceServings,
      timeMinutes: parsed.timeMinutes ?? draft.timeMinutes,
      notes: parsed.notes || draft.notes,
      ingredients: parsed.ingredients?.length ? parsed.ingredients : draft.ingredients,
      steps: parsed.steps?.length ? parsed.steps : draft.steps,
    };
  } catch {
    return draft;
  } finally {
    clearTimeout(timer);
  }
}
