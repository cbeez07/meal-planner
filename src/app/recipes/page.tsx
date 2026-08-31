"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

type Recipe = {
  id: string;
  title: string;
  timeMinutes: number | null;
  tags: string[];
};

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (ingredient) params.set("ingredient", ingredient);
    api<{ recipes: Recipe[] }>(`/api/recipes?${params}`)
      .then((data) => setRecipes(data.recipes))
      .catch(() => setRecipes([]));
  }, [q, tag, ingredient]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Recipes</h1>
        <Link href="/recipes/new" className="rounded-full bg-sage px-4 py-2 text-sm text-white">
          New
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <input
          placeholder="Search name"
          className="rounded-xl border border-line bg-paper-2 px-3 py-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="Ingredient"
          className="rounded-xl border border-line bg-paper-2 px-3 py-3"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
        />
        <input
          placeholder="Tag"
          className="rounded-xl border border-line bg-paper-2 px-3 py-3"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </div>
      <ul className="mt-5 space-y-2">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link
              href={`/recipes/${recipe.id}`}
              className="block rounded-2xl border border-line bg-paper-2 px-4 py-3"
            >
              <div className="font-medium">{recipe.title}</div>
              <div className="mt-1 text-sm text-muted">
                {recipe.timeMinutes ? `${recipe.timeMinutes} min` : "No time set"}
                {recipe.tags.length ? ` · ${recipe.tags.join(", ")}` : ""}
              </div>
            </Link>
          </li>
        ))}
        {recipes.length === 0 ? <p className="text-muted">No recipes yet. Add one to start a week.</p> : null}
      </ul>
    </div>
  );
}
