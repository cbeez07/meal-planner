import { classifyUrl } from "./classify";
import {
  applyOEmbed,
  draftIsThin,
  emptyDraft,
  extractJsonLd,
  extractUnstructured,
  oEmbedUrl,
  pinterestDestination,
  type DraftRecipe,
} from "./extract";
import { fetchPublicUrl } from "./fetchSafe";
import { maybeEnrichWithLlm } from "./llm";

const BUDGET_MS = 15_000;

export async function importFromUrl(sourceUrl: string): Promise<{
  draft: DraftRecipe;
  status: "ready" | "failed";
  error: string | null;
}> {
  const deadline = Date.now() + BUDGET_MS;
  const kind = classifyUrl(sourceUrl);
  try {
    let fetched = await fetchPublicUrl(sourceUrl);
    let draft: DraftRecipe | null = extractJsonLd(fetched.body, fetched.url);

    if (kind === "pinterest") {
      const dest = pinterestDestination(fetched.body, fetched.url);
      if (dest) {
        try {
          fetched = await fetchPublicUrl(dest);
          draft = extractJsonLd(fetched.body, sourceUrl) ?? extractUnstructured(fetched.body, sourceUrl, "pinterest");
        } catch {
          draft = draft ?? extractUnstructured(fetched.body, sourceUrl, "pinterest");
        }
      } else {
        draft = draft ?? extractUnstructured(fetched.body, sourceUrl, "pinterest");
      }
    }

    if ((kind === "tiktok" || kind === "instagram" || kind === "youtube") && (!draft || draftIsThin(draft))) {
      draft = extractUnstructured(fetched.body, sourceUrl, kind);
      const embed = oEmbedUrl(sourceUrl, kind);
      if (embed && Date.now() < deadline - 2000) {
        try {
          const oembedRes = await fetchPublicUrl(embed);
          const payload = JSON.parse(oembedRes.body) as {
            title?: string;
            author_name?: string;
          };
          draft = applyOEmbed(draft, payload);
        } catch {
          // oEmbed is best-effort
        }
      }
    }

    if (!draft) {
      draft = extractUnstructured(fetched.body, sourceUrl, kind);
    }
    draft.sourceUrl = sourceUrl;
    draft.sourceKind = kind === "blog" ? "blog" : kind;

    if (draftIsThin(draft)) {
      draft = await maybeEnrichWithLlm(
        draft,
        `${draft.title}\n${draft.notes}\n${fetched.body.replace(/<[^>]+>/g, " ").slice(0, 6000)}`,
        deadline,
      );
    }

    const status = draft.title || draft.ingredients.length ? "ready" : "failed";
    return {
      draft,
      status,
      error: status === "failed" ? "Could not read a recipe. The link is saved — fill in the rest." : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch that URL";
    return {
      draft: emptyDraft(sourceUrl, kind),
      status: "failed",
      error: message,
    };
  }
}
