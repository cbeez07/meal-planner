"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RecipeForm, blankRecipe, type RecipeFormValue } from "@/components/RecipeForm";
import { api } from "@/lib/client/api";
import { classifyAisle, type Aisle } from "@/lib/domain/ingredients";

type Recipe = {
  title: string;
  sourceUrl: string | null;
  sourceKind: string | null;
  sourceServings: number;
  timeMinutes: number | null;
  notes: string | null;
  tags: string[];
  ingredients: { name: string; amount: number | null; unit: string | null; aisle: Aisle }[];
  steps: { body: string }[];
};

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<RecipeFormValue | null>(null);

  useEffect(() => {
    api<Recipe>(`/api/recipes/${id}`).then((recipe) => {
      setInitial(
        blankRecipe({
          title: recipe.title,
          sourceUrl: recipe.sourceUrl ?? "",
          sourceKind: recipe.sourceKind ?? "manual",
          sourceServings: recipe.sourceServings,
          timeMinutes: recipe.timeMinutes ?? "",
          notes: recipe.notes ?? "",
          tags: recipe.tags,
          ingredients: recipe.ingredients.length
            ? recipe.ingredients.map((i) => ({
                name: i.name,
                amount: i.amount == null ? "" : String(i.amount),
                unit: i.unit ?? "",
                aisle: i.aisle ?? classifyAisle(i.name),
              }))
            : undefined,
          steps: recipe.steps.length ? recipe.steps : undefined,
        }),
      );
    });
  }, [id]);

  if (!initial) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <h1 className="text-3xl">Edit recipe</h1>
      <div className="mt-6">
        <RecipeForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={async (payload) => {
            await api(`/api/recipes/${id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
            router.push(`/recipes/${id}`);
          }}
        />
      </div>
    </div>
  );
}
