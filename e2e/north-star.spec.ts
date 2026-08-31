import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("north-star household loop", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByLabel("Username").fill("planner");
  await page.getByLabel("Password").fill("planner");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "This week" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("link", { name: "Recipes" }).click();
  await page.getByRole("link", { name: "New" }).click();
  await page.getByLabel("Title").fill("Lemon chicken");
  await page.getByPlaceholder("Name").first().fill("chicken thighs");
  await page.getByPlaceholder("Amt").first().fill("2");
  await page.getByPlaceholder("Unit").first().fill("lb");
  await page.getByRole("button", { name: "+ Ingredient" }).click();
  await page.getByPlaceholder("Name").nth(1).fill("spinach");
  await page.getByPlaceholder("Amt").nth(1).fill("4");
  await page.getByPlaceholder("Unit").nth(1).fill("cup");
  await page.getByPlaceholder("Step 1").fill("Roast the chicken.");
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name: "Lemon chicken" })).toBeVisible();

  await page.getByRole("link", { name: "Recipes" }).click();
  await page.getByRole("link", { name: "New" }).click();
  await page.getByLabel("Title").fill("Garlic spinach pasta");
  await page.getByPlaceholder("Name").first().fill("spinach");
  await page.getByPlaceholder("Amt").first().fill("2");
  await page.getByPlaceholder("Unit").first().fill("cup");
  await page.getByRole("button", { name: "+ Ingredient" }).click();
  await page.getByPlaceholder("Name").nth(1).fill("garlic");
  await page.getByPlaceholder("Amt").nth(1).fill("3");
  await page.getByPlaceholder("Unit").nth(1).fill("clove");
  await page.getByPlaceholder("Step 1").fill("Wilt spinach.");
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name: "Garlic spinach pasta" })).toBeVisible();

  await page.getByRole("link", { name: "Week", exact: true }).click();
  await page.locator("select").first().selectOption("dinner");
  await page.getByRole("button", { name: "Lemon chicken" }).click();
  await expect(page.getByText("Anchor")).toBeVisible();
  await page.getByRole("button", { name: "Add to next empty night" }).first().click();

  await page.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/shop/);
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();
  await expect(page.getByRole("button", { name: /chicken/i })).toBeVisible();
  await page.getByRole("button", { name: /spinach/i }).click();
  await expect(page.getByRole("button", { name: /spinach/i })).toHaveClass(/line-through/);

  await page.getByRole("link", { name: "Import" }).click();
  await page.getByPlaceholder("https://").fill("http://127.0.0.1/");
  await page.getByRole("button", { name: "Fetch draft" }).click();
  await expect(page.getByText(/not allowed|fill in the rest|Could not/i)).toBeVisible();
  await page.getByLabel("Title").fill("Manual from failed import");
  await page.getByPlaceholder("Name").first().fill("tomato");
  await page.getByRole("button", { name: "Save to library" }).click();
  await expect(page.getByRole("heading", { name: "Manual from failed import" })).toBeVisible();
});
