# Agent team

This repo uses a gated multi-agent workflow (Cursor and/or Antigravity). **Read `docs/PROJECT_STATE.md` before acting.**

New projects start at `PENDING_RESEARCH_APPROVAL`. Run `@01-researcher` first. Do not write application code until Gate 3 is checked off.

Roles (filenames only): `@01-researcher`, `@02-architect`, `@03-manager`, `@04-dev-fullstack`, `@05-dev-ops`, `@06-dev-qa`, `@07-dev-maintenance`, `@08-ui-artist`.

User phrases: `APPROVED` · `MERGE TO STAGING` · `DEPLOY TO PRODUCTION`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
