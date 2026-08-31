import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  householdServings: integer("household_servings").notNull().default(5),
  weekStartsOn: text("week_starts_on").notNull().default("sunday"),
  updatedAt: text("updated_at").notNull(),
});

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  sourceKind: text("source_kind"),
  sourceServings: integer("source_servings").notNull(),
  timeMinutes: integer("time_minutes"),
  photoPath: text("photo_path"),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  amount: real("amount"),
  unit: text("unit"),
  sortOrder: integer("sort_order").notNull(),
  aisle: text("aisle").notNull(),
});

export const recipeSteps = sqliteTable("recipe_steps", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  body: text("body").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const recipeTags = sqliteTable(
  "recipe_tags",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("recipe_tags_unique").on(t.recipeId, t.tagId)],
);

export const weeks = sqliteTable("weeks", {
  id: text("id").primaryKey(),
  startDate: text("start_date").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const weekSlots = sqliteTable(
  "week_slots",
  {
    id: text("id").primaryKey(),
    weekId: text("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    kind: text("kind").notNull(),
    recipeId: text("recipe_id").references(() => recipes.id),
    isAnchor: integer("is_anchor").notNull().default(0),
  },
  (t) => [uniqueIndex("week_slots_week_day").on(t.weekId, t.dayIndex)],
);

export const staples = sqliteTable("staples", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull().unique(),
});

export const shoppingListItems = sqliteTable("shopping_list_items", {
  id: text("id").primaryKey(),
  weekId: text("week_id")
    .notNull()
    .references(() => weeks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  amount: real("amount"),
  unit: text("unit"),
  aisle: text("aisle").notNull(),
  checked: integer("checked").notNull().default(0),
  source: text("source").notNull(),
});

export const importDrafts = sqliteTable("import_drafts", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  sourceKind: text("source_kind").notNull(),
  status: text("status").notNull(),
  extractedJson: text("extracted_json"),
  error: text("error"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});
