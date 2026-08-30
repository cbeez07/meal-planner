"use client";

import { FormEvent, useState } from "react";
import { AISLES, type Aisle } from "@/lib/domain/ingredients";

const TAG_OPTIONS = ["healthy", "high-protein", "vegetarian", "quick", "kid-favorite"];

export type RecipeFormValue = {
  title: string;
  sourceUrl: string;
  sourceKind: string;
  sourceServings: number;
  timeMinutes: number | "";
  notes: string;
  tags: string[];
  ingredients: { name: string; amount: string; unit: string; aisle: Aisle }[];
  steps: { body: string }[];
};

const emptyIngredient = (): RecipeFormValue["ingredients"][0] => ({
  name: "",
  amount: "",
  unit: "",
  aisle: "other",
});

export function blankRecipe(overrides: Partial<RecipeFormValue> = {}): RecipeFormValue {
  const base: RecipeFormValue = {
    title: "",
    sourceUrl: "",
    sourceKind: "manual",
    sourceServings: 5,
    timeMinutes: "",
    notes: "",
    tags: [],
    ingredients: [emptyIngredient()],
    steps: [{ body: "" }],
  };
  return {
    ...base,
    ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined)),
    ingredients: overrides.ingredients ?? base.ingredients,
    steps: overrides.steps ?? base.steps,
  } as RecipeFormValue;
}

function toPayload(value: RecipeFormValue) {
  return {
    title: value.title,
    sourceUrl: value.sourceUrl || null,
    sourceKind: value.sourceKind,
    sourceServings: Number(value.sourceServings) || 5,
    timeMinutes: value.timeMinutes === "" ? null : Number(value.timeMinutes),
    notes: value.notes,
    tags: value.tags,
    ingredients: value.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name,
        amount: i.amount === "" ? null : Number(i.amount),
        unit: i.unit || null,
        aisle: i.aisle,
      })),
    steps: value.steps.filter((s) => s.body.trim()).map((s) => ({ body: s.body })),
  };
}

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
  banner,
}: {
  initial: RecipeFormValue;
  submitLabel: string;
  onSubmit: (payload: ReturnType<typeof toPayload>) => Promise<void>;
  banner?: string;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSubmit(toPayload(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {banner ? (
        <p className="rounded-2xl bg-chip px-4 py-3 text-sm text-muted">{banner}</p>
      ) : null}
      <label className="block text-sm font-medium">
        Title
        <input
          required
          className="mt-1 w-full rounded-xl border border-line bg-paper-2 px-3 py-3"
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Written servings
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border border-line bg-paper-2 px-3 py-3"
            value={value.sourceServings}
            onChange={(e) => setValue({ ...value, sourceServings: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm font-medium">
          Minutes
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-xl border border-line bg-paper-2 px-3 py-3"
            value={value.timeMinutes}
            onChange={(e) =>
              setValue({
                ...value,
                timeMinutes: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Source URL
        <input
          className="mt-1 w-full rounded-xl border border-line bg-paper-2 px-3 py-3"
          value={value.sourceUrl}
          onChange={(e) => setValue({ ...value, sourceUrl: e.target.value })}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Tags</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const on = value.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${on ? "bg-sage text-white" : "bg-chip"}`}
                onClick={() =>
                  setValue({
                    ...value,
                    tags: on ? value.tags.filter((t) => t !== tag) : [...value.tags, tag],
                  })
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Ingredients</legend>
        {value.ingredients.map((ing, index) => (
          <div key={index} className="grid grid-cols-12 gap-2">
            <input
              placeholder="Name"
              className="col-span-12 rounded-xl border border-line bg-paper-2 px-3 py-2 sm:col-span-5"
              value={ing.name}
              onChange={(e) => {
                const ingredients = [...value.ingredients];
                ingredients[index] = { ...ing, name: e.target.value };
                setValue({ ...value, ingredients });
              }}
            />
            <input
              placeholder="Amt"
              className="col-span-4 rounded-xl border border-line bg-paper-2 px-3 py-2 sm:col-span-2"
              value={ing.amount}
              onChange={(e) => {
                const ingredients = [...value.ingredients];
                ingredients[index] = { ...ing, amount: e.target.value };
                setValue({ ...value, ingredients });
              }}
            />
            <input
              placeholder="Unit"
              className="col-span-4 rounded-xl border border-line bg-paper-2 px-3 py-2 sm:col-span-2"
              value={ing.unit}
              onChange={(e) => {
                const ingredients = [...value.ingredients];
                ingredients[index] = { ...ing, unit: e.target.value };
                setValue({ ...value, ingredients });
              }}
            />
            <select
              className="col-span-4 rounded-xl border border-line bg-paper-2 px-2 py-2 sm:col-span-3"
              value={ing.aisle}
              onChange={(e) => {
                const ingredients = [...value.ingredients];
                ingredients[index] = { ...ing, aisle: e.target.value as Aisle };
                setValue({ ...value, ingredients });
              }}
            >
              {AISLES.map((a) => (
                <option key={a} value={a}>
                  {a.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-sage"
          onClick={() => setValue({ ...value, ingredients: [...value.ingredients, emptyIngredient()] })}
        >
          + Ingredient
        </button>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Steps</legend>
        {value.steps.map((step, index) => (
          <textarea
            key={index}
            rows={2}
            placeholder={`Step ${index + 1}`}
            className="w-full rounded-xl border border-line bg-paper-2 px-3 py-2"
            value={step.body}
            onChange={(e) => {
              const steps = [...value.steps];
              steps[index] = { body: e.target.value };
              setValue({ ...value, steps });
            }}
          />
        ))}
        <button
          type="button"
          className="text-sm text-sage"
          onClick={() => setValue({ ...value, steps: [...value.steps, { body: "" }] })}
        >
          + Step
        </button>
      </fieldset>
      <label className="block text-sm font-medium">
        Notes
        <textarea
          rows={3}
          className="mt-1 w-full rounded-xl border border-line bg-paper-2 px-3 py-2"
          value={value.notes}
          onChange={(e) => setValue({ ...value, notes: e.target.value })}
        />
      </label>
      {error ? <p className="text-sm text-terracotta">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage py-3 text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
