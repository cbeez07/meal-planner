"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

type Recipe = {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourceServings: number;
  timeMinutes: number | null;
  photoPath: string | null;
  notes: string | null;
  tags: string[];
  ingredients: { name: string; amount: number | null; unit: string | null }[];
  steps: { body: string }[];
};

export default function CookPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    api<Recipe>(`/api/recipes/${id}`).then(setRecipe).catch(() => setRecipe(null));
  }, [id]);

  if (!recipe) return <p className="text-muted">Loading…</p>;

  return (
    <article>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-4xl leading-tight">{recipe.title}</h1>
        <Link href={`/recipes/${recipe.id}/edit`} className="rounded-full border border-line px-3 py-1 text-sm">
          Edit
        </Link>
      </div>
      <p className="mt-2 text-muted">
        Written for {recipe.sourceServings}
        {recipe.timeMinutes ? ` · ${recipe.timeMinutes} min` : ""}
        {recipe.tags.length ? ` · ${recipe.tags.join(", ")}` : ""}
      </p>
      {recipe.photoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/uploads/${recipe.photoPath}`}
          alt=""
          className="mt-4 w-full rounded-2xl object-cover"
        />
      ) : null}
      {recipe.sourceUrl ? (
        <a href={recipe.sourceUrl} className="mt-3 inline-block text-sage underline" target="_blank" rel="noreferrer">
          Original source
        </a>
      ) : null}
      <h2 className="mt-8 text-2xl">Ingredients</h2>
      <ul className="mt-3 space-y-2 text-lg">
        {recipe.ingredients.map((ing, i) => (
          <li key={i} className="border-b border-line/70 pb-2">
            {ing.amount != null ? `${pretty(ing.amount)} ` : ""}
            {ing.unit ? `${ing.unit} ` : ""}
            {ing.name}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-2xl">Steps</h2>
      <ol className="mt-3 list-decimal space-y-4 pl-5 text-lg leading-relaxed">
        {recipe.steps.map((step, i) => (
          <li key={i}>{step.body}</li>
        ))}
      </ol>
      {recipe.notes ? (
        <>
          <h2 className="mt-8 text-2xl">Notes</h2>
          <p className="mt-2 text-lg text-muted">{recipe.notes}</p>
        </>
      ) : null}
    </article>
  );
}

function pretty(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
