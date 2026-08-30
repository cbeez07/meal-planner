"use client";

import { useRouter } from "next/navigation";
import { RecipeForm, blankRecipe } from "@/components/RecipeForm";
import { api } from "@/lib/client/api";

export default function NewRecipePage() {
  const router = useRouter();
  return (
    <div>
      <h1 className="text-3xl">New recipe</h1>
      <p className="mt-1 text-muted">Type it in. Import is optional.</p>
      <div className="mt-6">
        <RecipeForm
          initial={blankRecipe()}
          submitLabel="Save recipe"
          onSubmit={async (payload) => {
            const created = await api<{ id: string }>("/api/recipes", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            router.push(`/recipes/${created.id}`);
          }}
        />
      </div>
    </div>
  );
}
