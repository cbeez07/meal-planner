CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL
);
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);

CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`household_servings` integer DEFAULT 5 NOT NULL,
	`week_starts_on` text DEFAULT 'sunday' NOT NULL,
	`updated_at` text NOT NULL
);

CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source_url` text,
	`source_kind` text,
	`source_servings` integer NOT NULL,
	`time_minutes` integer,
	`photo_path` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL,
	`amount` real,
	`unit` text,
	`sort_order` integer NOT NULL,
	`aisle` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);

CREATE TABLE `recipe_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`body` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE
);

CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);

CREATE TABLE `recipe_tags` (
	`recipe_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX `recipe_tags_unique` ON `recipe_tags` (`recipe_id`, `tag_id`);

CREATE TABLE `weeks` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text NOT NULL
);
CREATE UNIQUE INDEX `weeks_start_date_unique` ON `weeks` (`start_date`);

CREATE TABLE `week_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`week_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`kind` text NOT NULL,
	`recipe_id` text,
	`is_anchor` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
);
CREATE UNIQUE INDEX `week_slots_week_day` ON `week_slots` (`week_id`, `day_index`);

CREATE TABLE `staples` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL
);
CREATE UNIQUE INDEX `staples_name_normalized_unique` ON `staples` (`name_normalized`);

CREATE TABLE `shopping_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`week_id` text NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL,
	`amount` real,
	`unit` text,
	`aisle` text NOT NULL,
	`checked` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON DELETE CASCADE
);

CREATE TABLE `import_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_url` text NOT NULL,
	`source_kind` text NOT NULL,
	`status` text NOT NULL,
	`extracted_json` text,
	`error` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
