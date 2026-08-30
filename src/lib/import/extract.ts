import * as cheerio from "cheerio";
import type { Aisle } from "@/lib/domain/ingredients";
import { classifyAisle } from "@/lib/domain/ingredients";
import { classifyUrl, type SourceKind } from "./classify";

export type DraftIngredient = {
  name: string;
  amount: number | null;
  unit: string | null;
  aisle: Aisle;
};

export type DraftRecipe = {
  title: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  sourceServings: number;
  timeMinutes: number | null;
  notes: string;
  ingredients: DraftIngredient[];
  steps: { body: string }[];
  tags: string[];
};

export function emptyDraft(sourceUrl: string, sourceKind: SourceKind): DraftRecipe {
  return {
    title: "",
    sourceUrl,
    sourceKind,
    sourceServings: 5,
    timeMinutes: null,
    notes: "",
    ingredients: [],
    steps: [],
    tags: [],
  };
}

export function draftIsThin(draft: DraftRecipe): boolean {
  return !draft.title || draft.ingredients.length === 0;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseIngredientLine(line: string): DraftIngredient {
  const cleaned = line.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^([\d./]+)\s+([a-zA-Z]+)\s+(.+)$/);
  if (match) {
    const amount = Number(match[1].includes("/") ? evalFraction(match[1]) : match[1]);
    return {
      name: match[3],
      amount: Number.isFinite(amount) ? amount : null,
      unit: match[2],
      aisle: classifyAisle(match[3]),
    };
  }
  return { name: cleaned, amount: null, unit: null, aisle: classifyAisle(cleaned) };
}

function evalFraction(raw: string): number {
  if (raw.includes("/")) {
    const [a, b] = raw.split("/").map(Number);
    if (b) return a / b;
  }
  return Number(raw);
}

function fromJsonLd(node: Record<string, unknown>, sourceUrl: string): DraftRecipe | null {
  const type = asArray(node["@type"] as string | string[]).map(String);
  if (!type.some((t) => t.toLowerCase() === "recipe")) return null;
  const title = String(node.name ?? "");
  const recipeIngredient = asArray(node.recipeIngredient as string | string[]).map(String);
  const instructions = asArray(node.recipeInstructions).flatMap((step) => {
    if (typeof step === "string") return [{ body: step }];
    if (step && typeof step === "object" && "text" in step) {
      return [{ body: String((step as { text: string }).text) }];
    }
    return [];
  });
  const yieldRaw = node.recipeYield ?? node.yield;
  let servings = 5;
  if (typeof yieldRaw === "number") servings = yieldRaw;
  if (typeof yieldRaw === "string") {
    const n = parseInt(yieldRaw, 10);
    if (Number.isFinite(n) && n >= 1) servings = n;
  }
  const time = node.totalTime ?? node.cookTime;
  let timeMinutes: number | null = null;
  if (typeof time === "string") {
    const hours = /PT(?:(\d+)H)?(?:(\d+)M)?/i.exec(time);
    if (hours) {
      timeMinutes = Number(hours[1] ?? 0) * 60 + Number(hours[2] ?? 0);
    }
  }
  return {
    title,
    sourceUrl,
    sourceKind: classifyUrl(sourceUrl),
    sourceServings: servings >= 1 ? servings : 5,
    timeMinutes,
    notes: typeof node.description === "string" ? node.description : "",
    ingredients: recipeIngredient.map(parseIngredientLine),
    steps: instructions,
    tags: [],
  };
}

export function extractJsonLd(html: string, sourceUrl: string): DraftRecipe | null {
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).text());
  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const nodes = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "@graph" in parsed
          ? (parsed as { "@graph": unknown[] })["@graph"]
          : [parsed];
      for (const node of nodes) {
        if (node && typeof node === "object") {
          const draft = fromJsonLd(node as Record<string, unknown>, sourceUrl);
          if (draft && draft.title) return draft;
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

export function pinterestDestination(html: string, currentUrl: string): string | null {
  const $ = cheerio.load(html);
  const og = $('meta[property="og:url"]').attr("content");
  const canonical = $('link[rel="canonical"]').attr("href");
  for (const candidate of [og, canonical]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate, currentUrl);
      const host = url.hostname.replace(/^www\./, "");
      if (!host.includes("pinterest.") && host !== "pin.it") {
        return url.toString();
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function extractUnstructured(html: string, sourceUrl: string, kind: SourceKind): DraftRecipe {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").first().text().trim() ||
    "";
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";
  const draft = emptyDraft(sourceUrl, kind);
  draft.title = title;
  draft.notes = description;
  if (description) {
    const lines = description
      .split(/[\n•·|]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 3);
    if (lines.length >= 2) {
      draft.ingredients = lines.slice(0, 12).map(parseIngredientLine);
    }
  }
  return draft;
}

export function oEmbedUrl(sourceUrl: string, kind: SourceKind): string | null {
  const encoded = encodeURIComponent(sourceUrl);
  if (kind === "youtube") {
    return `https://www.youtube.com/oembed?url=${encoded}&format=json`;
  }
  if (kind === "tiktok") {
    return `https://www.tiktok.com/oembed?url=${encoded}`;
  }
  if (kind === "instagram") {
    return `https://graph.facebook.com/v17.0/instagram_oembed?url=${encoded}`;
  }
  return null;
}

export function applyOEmbed(
  draft: DraftRecipe,
  payload: { title?: string; author_name?: string; html?: string },
): DraftRecipe {
  if (!draft.title && payload.title) draft.title = payload.title;
  if (payload.author_name && !draft.notes) {
    draft.notes = `From ${payload.author_name}`;
  }
  return draft;
}
