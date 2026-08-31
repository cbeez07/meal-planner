"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeForm, blankRecipe, type RecipeFormValue } from "@/components/RecipeForm";
import { api } from "@/lib/client/api";
import { classifyAisle, isAisle } from "@/lib/domain/ingredients";

type Draft = {
  title: string;
  sourceUrl: string;
  sourceKind: string;
  sourceServings: number;
  timeMinutes: number | null;
  notes: string;
  ingredients: { name: string; amount: number | null; unit: string | null; aisle?: string }[];
  steps: { body: string }[];
  tags: string[];
};

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [banner, setBanner] = useState("");
  const [initial, setInitial] = useState<RecipeFormValue | null>(null);

  async function fetchDraft(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await api<{ id: string; status: string; error: string | null; draft: Draft }>(
        "/api/imports",
        { method: "POST", body: JSON.stringify({ url }) },
      );
      setDraftId(result.id);
      setBanner(
        result.status === "failed"
          ? result.error || "Could not read a recipe. The link is saved — fill in the rest."
          : "Review this draft before it can go on a shopping list.",
      );
      const d = result.draft;
      setInitial(
        blankRecipe({
          title: d.title ?? "",
          sourceUrl: d.sourceUrl || url,
          sourceKind: d.sourceKind || "blog",
          sourceServings: d.sourceServings || 5,
          timeMinutes: d.timeMinutes ?? "",
          notes: d.notes ?? "",
          tags: d.tags ?? [],
          ingredients: (d.ingredients ?? []).length
            ? d.ingredients.map((i) => ({
                name: i.name,
                amount: i.amount == null ? "" : String(i.amount),
                unit: i.unit ?? "",
                aisle: i.aisle && isAisle(i.aisle) ? i.aisle : classifyAisle(i.name),
              }))
            : undefined,
          steps: d.steps?.length ? d.steps : undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl">Import</h1>
      <p className="mt-1 text-muted">Paste a TikTok, Instagram, YouTube, Pinterest, or blog URL.</p>
      <form onSubmit={fetchDraft} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          required
          className="flex-1 rounded-xl border border-line bg-paper-2 px-3 py-3"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="rounded-full bg-sage px-4 py-3 text-white" disabled={pending}>
          {pending ? "Reading…" : "Fetch draft"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-terracotta">{error}</p> : null}
      {initial && draftId ? (
        <div className="mt-8">
          <RecipeForm
            key={draftId}
            initial={initial}
            banner={banner}
            submitLabel="Save to library"
            onSubmit={async (payload) => {
              const saved = await api<{ recipeId: string }>(`/api/imports/${draftId}/commit`, {
                method: "POST",
                body: JSON.stringify(payload),
              });
              router.push(`/recipes/${saved.recipeId}`);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
