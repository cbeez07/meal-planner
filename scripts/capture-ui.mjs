/**
 * Capture household screens for docs/design.md and docs/UI_REVIEW.md.
 *
 * Start the app first (`pnpm dev`), then:
 *   pnpm capture:ui
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const DAY = new Date().toISOString().slice(0, 10);
const OUT = process.env.UI_REVIEW_DIR || path.join("docs", "ui-reviews", DAY);

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

const LEMON = {
  title: "Lemon chicken",
  sourceServings: 5,
  timeMinutes: 40,
  tags: ["healthy", "high-protein"],
  ingredients: [
    { name: "chicken thighs", amount: 2, unit: "lb", aisle: "meat_seafood" },
    { name: "lemon", amount: 2, unit: null, aisle: "produce" },
    { name: "spinach", amount: 4, unit: "cup", aisle: "produce" },
  ],
  steps: [{ body: "Roast the chicken with lemon. Wilt spinach in the pan juices." }],
};

const PASTA = {
  title: "Garlic spinach pasta",
  sourceServings: 5,
  timeMinutes: 25,
  tags: ["vegetarian", "quick"],
  ingredients: [
    { name: "spinach", amount: 2, unit: "cup", aisle: "produce" },
    { name: "garlic", amount: 3, unit: "clove", aisle: "produce" },
    { name: "pasta", amount: 12, unit: "oz", aisle: "pantry" },
  ],
  steps: [{ body: "Boil pasta. Wilt spinach with garlic." }],
};

async function api(page, url, options = {}) {
  const result = await page.evaluate(async ({ url, options }) => {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  }, { url, options });
  if (!result.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} ${result.status}: ${JSON.stringify(result.data)}`);
  }
  return result.data;
}

async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-next-mark],
      #__next-build-watcher { display: none !important; }
    `,
  });
}

async function waitForHeading(page, name) {
  await page.getByRole("heading", { name }).waitFor({ timeout: 20_000 });
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Username").fill("planner");
  await page.getByLabel("Password").fill("planner");
  await page.getByRole("button", { name: "Sign in" }).click();
  await waitForHeading(page, "This week");
}

async function ensureRecipe(page, payload) {
  const list = await api(page, "/api/recipes");
  const found = list.recipes.find((r) => r.title === payload.title);
  if (found) return found.id;
  const created = await api(page, "/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return created.id;
}

async function seedHousehold(page) {
  const lemonId = await ensureRecipe(page, LEMON);
  const pastaId = await ensureRecipe(page, PASTA);
  const week = await api(page, "/api/weeks");
  const sunday = week.slots.find((s) => s.dayIndex === 0);
  if (sunday?.kind !== "dinner") {
    await api(page, `/api/weeks/${week.id}/slots/0`, {
      method: "PATCH",
      body: JSON.stringify({ kind: "dinner", recipeId: lemonId, isAnchor: true }),
    });
  }
  // Leave pasta off the week so Suggestions has an overlap match to photograph.
  void pastaId;
}

async function shot(page, viewport, slug) {
  await ready(page);
  const file = path.join(OUT, `${viewport}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", file);
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.name === "phone" ? 2 : 1,
    hasTouch: viewport.name === "phone",
    isMobile: viewport.name === "phone",
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/login`);
  await waitForHeading(page, "Weekly Meals");
  await shot(page, viewport.name, "login");

  await login(page);
  await seedHousehold(page);

  await page.goto(`${BASE}/`);
  await waitForHeading(page, "This week");
  await page.getByText("Lemon chicken").first().waitFor();
  await page.getByText("Anchor", { exact: true }).waitFor();
  await shot(page, viewport.name, "week-planner");

  await page.getByRole("heading", { name: "Suggestions" }).scrollIntoViewIfNeeded();
  await page.getByText("Garlic spinach pasta").first().waitFor();
  await shot(page, viewport.name, "suggestions");

  await page.goto(`${BASE}/recipes`);
  await waitForHeading(page, "Recipes");
  await page.getByText("Lemon chicken").first().waitFor();
  await shot(page, viewport.name, "recipe-library");

  await page.goto(`${BASE}/recipes/new`);
  await page.getByLabel("Title").waitFor();
  await shot(page, viewport.name, "recipe-form");

  await page.getByRole("link", { name: "Lemon chicken" }).click().catch(() => undefined);
  await page.goto(`${BASE}/recipes`);
  await page.getByRole("link", { name: "Lemon chicken" }).click();
  await waitForHeading(page, "Lemon chicken");
  await shot(page, viewport.name, "recipe-cook");

  await page.goto(`${BASE}/import`);
  await waitForHeading(page, "Import");
  await page.getByPlaceholder("https://").fill("http://127.0.0.1/");
  await page.getByRole("button", { name: "Fetch draft" }).click();
  await page.getByText(/not allowed|fill in the rest|Could not/i).waitFor();
  await shot(page, viewport.name, "import-review");

  await page.goto(`${BASE}/shop`);
  await waitForHeading(page, "Shop");
  await page.getByRole("button", { name: /chicken|spinach|pasta|lemon|garlic/i }).first().waitFor();
  await shot(page, viewport.name, "shop");

  await page.goto(`${BASE}/staples`);
  await waitForHeading(page, "Staples");
  await page.getByText(/salt|olive|pepper/i).first().waitFor();
  await shot(page, viewport.name, "staples");

  await context.close();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const viewport of VIEWPORTS) {
      await captureViewport(browser, viewport);
    }
  } finally {
    await browser.close();
  }
  console.log("captures in", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
