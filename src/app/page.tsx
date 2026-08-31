"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { DAY_NAMES } from "@/lib/dates";

type Slot = {
  dayIndex: number;
  kind: string;
  isAnchor: boolean;
  recipe: { id: string; title: string } | null;
};

type Week = { id: string; startDate: string; slots: Slot[] };
type Suggestion = {
  recipeId: string;
  title: string;
  score: number;
  sharedIngredients: string[];
};
type Recipe = { id: string; title: string };

const KINDS = [
  { value: "empty", label: "Empty" },
  { value: "dinner", label: "Dinner" },
  { value: "leftover", label: "Leftovers" },
  { value: "eat_out", label: "Eat out" },
  { value: "skip", label: "Skip" },
];

export default function WeekPage() {
  const [week, setWeek] = useState<Week | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState<number | null>(null);

  async function load() {
    const w = await api<Week>("/api/weeks");
    setWeek(w);
    const s = await api<{ suggestions: Suggestion[] }>(`/api/weeks/${w.id}/suggestions`);
    setSuggestions(s.suggestions);
    const r = await api<{ recipes: Recipe[] }>("/api/recipes");
    setRecipes(r.recipes);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function patchSlot(dayIndex: number, body: Record<string, unknown>) {
    if (!week) return;
    setError("");
    try {
      const next = await api<Week>(`/api/weeks/${week.id}/slots/${dayIndex}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setWeek(next);
      const s = await api<{ suggestions: Suggestion[] }>(`/api/weeks/${week.id}/suggestions`);
      setSuggestions(s.suggestions);
      setPicking(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  if (!week) return <p className="text-muted">{error || "Loading…"}</p>;
  const dinners = week.slots.filter((s) => s.kind === "dinner").length;

  return (
    <div>
      <h1 className="text-3xl">This week</h1>
      <p className="mt-1 text-muted">
        Week of {week.startDate} · {dinners} dinner{dinners === 1 ? "" : "s"} (3–5 is the sweet spot)
      </p>
      {error ? <p className="mt-3 text-sm text-terracotta">{error}</p> : null}
      <ul className="mt-5 space-y-3">
        {week.slots.map((slot) => (
          <li key={slot.dayIndex} className="rounded-2xl border border-line bg-paper-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {DAY_NAMES[slot.dayIndex]}
                  {slot.isAnchor ? (
                    <span className="ml-2 rounded-full bg-terracotta/15 px-2 py-0.5 text-xs text-terracotta">
                      Anchor
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-muted">
                  {slot.kind === "dinner" && slot.recipe ? (
                    <Link href={`/recipes/${slot.recipe.id}`} className="text-sage underline">
                      {slot.recipe.title}
                    </Link>
                  ) : (
                    KINDS.find((k) => k.value === slot.kind)?.label
                  )}
                </div>
              </div>
              <select
                className="rounded-xl border border-line bg-paper px-2 py-2 text-sm"
                value={slot.kind}
                onChange={(e) => {
                  const kind = e.target.value;
                  if (kind === "dinner") setPicking(slot.dayIndex);
                  else patchSlot(slot.dayIndex, { kind });
                }}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            {slot.kind === "dinner" && slot.recipe && !slot.isAnchor ? (
              <button
                type="button"
                className="mt-2 text-sm text-sage"
                onClick={() => patchSlot(slot.dayIndex, { kind: "dinner", recipeId: slot.recipe!.id, isAnchor: true })}
              >
                Make anchor
              </button>
            ) : null}
            {picking === slot.dayIndex ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted">Pick any saved recipe</p>
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className="block w-full rounded-xl bg-chip px-3 py-2 text-left"
                    onClick={() =>
                      patchSlot(slot.dayIndex, {
                        kind: "dinner",
                        recipeId: recipe.id,
                        isAnchor: dinners === 0,
                      })
                    }
                  >
                    {recipe.title}
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-2xl">Suggestions</h2>
      <p className="text-sm text-muted">Ranked by ingredients already on this week. You can ignore the list.</p>
      <ul className="mt-3 space-y-2">
        {suggestions.slice(0, 12).map((s) => (
          <li key={s.recipeId} className="rounded-2xl border border-line bg-paper-2 p-4">
            <div className="font-medium">{s.title}</div>
            {s.sharedIngredients.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {s.sharedIngredients.map((name) => (
                  <span key={name} className="rounded-full bg-chip px-2 py-0.5 text-xs">
                    shares {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">No shared ingredients</p>
            )}
            <button
              type="button"
              className="mt-3 text-sm text-sage"
              onClick={() => {
                const empty = week.slots.find((slot) => slot.kind === "empty");
                if (!empty) {
                  setError("No empty night left. Change a night to Empty first.");
                  return;
                }
                patchSlot(empty.dayIndex, {
                  kind: "dinner",
                  recipeId: s.recipeId,
                  isAnchor: dinners === 0,
                });
              }}
            >
              Add to next empty night
            </button>
          </li>
        ))}
        {suggestions.length === 0 ? (
          <p className="text-muted">Pick an anchor dinner to see overlap matches from your library.</p>
        ) : null}
      </ul>
    </div>
  );
}
