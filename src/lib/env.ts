import path from "node:path";

export function databasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
}

export function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export function authSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export const SEED_STAPLES = [
  "water",
  "salt",
  "black pepper",
  "pepper",
  "olive oil",
  "vegetable oil",
  "canola oil",
  "cooking spray",
  "garlic powder",
  "onion powder",
];

export const SEED_TAGS = [
  "healthy",
  "high-protein",
  "vegetarian",
  "quick",
  "kid-favorite",
];
