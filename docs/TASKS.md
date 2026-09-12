# Tasks: Weekly Meals

**Sprint:** Household MVP (build track)  
**Status:** Gate 3 approved — IMPLEMENTATION  
**Build track is live. `@04-dev-fullstack` implements `[ ]` tickets in order.**

**Status legend:** `[ ]` todo · `[~]` implemented, awaiting visual + QA · `[x]` QA_PASSED · `[!]` blocked

UI-touching tickets (T009, T012, T014, T017, plus shell on T003): after `[~]`, `@08-ui-artist` screenshots then `@06-dev-qa`. Do not mark `[x]` while visual review is `[!]`.

Living design scratchpad: **`docs/design.md`**. Dated screenshot log: `docs/UI_REVIEW.md`. Recapture: `pnpm capture:ui`.

---

## Sprint overview

**Goal:** The research north-star story works on a phone over LAN/Netbird.

1. Save 8–15 recipes (typed and pasted URLs).
2. Sunday: pick an anchor dinner, add 2–4 more (3–5 total) from overlap suggestions or a free pick.
3. Open `/shop` on a phone; quantities are for **5**; staples are hidden; check items off.
4. Open a recipe and cook from it.

**Build order:** foundation → tested domain math → recipes → week + suggestions → shopping list → import (best-effort) → CI / visual / QA.

**60/20/20 note:** This is the first production sprint, not a maintenance sprint. Mix is ~80% features, ~20% foundation (scaffold, schema, Docker, CI, tests). **0% bug fixes** — there is no shipped product yet. That deviation is expected.

**Out of this sprint (do not ticket):** PWA share-sheet, `yt-dlp`, nutrition balancer, pantry, native apps, public ingress, Postgres.

---

## Cost & complexity estimate

### Cloud / run cost (household)

| Item | Low | Mid | High |
| --- | --- | --- | --- |
| Home server + Netbird + SQLite | $0 | $0 | $0 |
| Product LLM (import assist) | $0 (off or Ollama) | ~$1/mo | ~$5/mo if many video URLs via a hosted API |
| Hosted DB / Vercel / S3 | $0 | $0 | $0 — not in architecture |

### Token / API risk

- Import LLM is **off unless env is set**. JSON-LD / Pinterest-destination / oEmbed path is free.
- Do not enable a paid API in CI.
- Cursor/implementation tokens are the real variable, not production inference.

### Engineering complexity (hours, one implementer)

| Slice | Tickets | Hours | Notes |
| --- | --- | --- | --- |
| Foundation | T001–T004 | 8–12 | Scaffold, schema, auth, Compose |
| Domain math | T005–T007 | 6–8 | Highest test value; no UI |
| Recipes | T008–T009 | 8–10 | CRUD + cook view |
| Week + overlap UI | T010–T012 | 8–12 | Core product loop |
| Shopping + staples | T013–T014 | 6–8 | Scale-to-5 must be tested |
| Import | T015–T017 | 10–14 | Riskiest; must degrade to bookmark |
| Ship | T018–T021 | 6–8 | Playwright, CI, visual, QA |
| **Total** | | **52–72** | Mid ~60h |

Priority if scope slips: **cut import polish (T016 LLM branch), keep T015 + empty-draft bookmark.** Never cut T005–T007, T010–T014.

---

## Tickets

### T001: Scaffold Next.js app in `src/`
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: none
- Acceptance criteria:
  - Next.js App Router + TypeScript + Tailwind + pnpm live under `src/`.
  - `package.json` scripts: `dev`, `build`, `start`, `lint`, `test` (Vitest).
  - README “Local commands” updated to those real commands.
  - App boots locally with a placeholder page (replaced by later tickets).

### T002: Drizzle schema, migrations, and seeds
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T001
- Acceptance criteria:
  - SQLite + Drizzle models match `docs/ARCHITECTURE.md` (users, settings, recipes, ingredients, steps, tags, weeks, slots, staples, shopping_list_items, import_drafts).
  - Migration applies on a fresh `DATABASE_PATH`.
  - First boot seeds: settings (`household_servings = 5`, `week_starts_on = sunday`), staple list from architecture, two users from env (`PLANNER_*`, `SHOPPER_*`).
  - Seed is idempotent (re-start does not duplicate users or staples).

### T003: Auth.js credentials, login, and session gate
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T002
- Acceptance criteria:
  - Credentials login for the two seeded users; no public signup.
  - Session cookie httpOnly, 30-day sliding, `SameSite=Lax`.
  - All pages except `/login` and Auth.js routes require a session; unauthenticated users redirect to `/login`.
  - Sign out works. `/api/auth/session` returns `{ id, username, displayName }`.
  - Mobile-usable login + app shell (nav: Week, Recipes, Import, Shop, Staples).
  - UI-touching: shell/login included in T020.
  - Visual 2026-09-12: `visual OK` (login + shell). See `docs/design.md`.

### T004: Docker Compose for home-server run
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T002
- Acceptance criteria:
  - `Dockerfile` + `compose.yml` run the app on port 3000 with volumes for `/data` (db + uploads).
  - `.env.example` documents every variable in architecture (including empty `LLM_*`).
  - Bind is suitable for LAN/Netbird; README states **do not port-forward to the public internet**.
  - Fresh `docker compose up --build` seeds users from env and serves `/login`.

### T005: Ingredient normalize, units, and aisle map
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T001
- Acceptance criteria:
  - Pure functions (no I/O): `normalizeIngredientName`, `canonicalUnit`, `classifyAisle`.
  - Normalize: lowercase, trim, collapse whitespace, light singularize.
  - Unit aliases: `tsp`/`teaspoon`, `tbsp`/`tablespoon`, `g`/`gram` (and the small set in architecture).
  - Aisle enum: `produce` | `meat_seafood` | `dairy` | `bakery` | `pantry` | `other`.
  - Vitest covers happy paths and unknowns (`other`, unit passthrough).

### T006: Overlap ranker
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T005
- Acceptance criteria:
  - Pure function: score candidate recipes against a set of planned ingredient names.
  - Noise list down-weighted or ignored: water, salt, pepper, oils, cooking spray.
  - Proteins/produce up-weighted via a keyword table.
  - Returns `score` + `sharedIngredients[]`.
  - After one dinner, compare to the anchor; after two+, compare to the **union** of planned dinner ingredients (caller passes the set).
  - Vitest: shared produce ranks above a salt-only match; already-planned IDs are not the ranker’s job to exclude.

### T007: Scale-to-5 and shopping-list merge
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T005
- Acceptance criteria:
  - `factor = householdServings / sourceServings` (reject `sourceServings < 1`).
  - 4-serving recipe → amounts × 5/4; 8-serving → × 5/8.
  - Same `name_normalized` + canonical unit **sum**; mismatched units stay **separate lines**.
  - Null amount (“to taste”) does not invent a number.
  - Staple `name_normalized` matches are omitted.
  - Vitest covers the three bullets above plus a two-recipe merge.

### T008: Recipe, tag, and photo API
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T002, T003, T005
- Acceptance criteria:
  - Routes match architecture: list (`q`, `tag`, `ingredient`), get, create, patch, delete, photo POST.
  - Create/update persist ingredients (with `name_normalized` + aisle default), steps, tags (seed tags + household-created).
  - Default `source_servings` is 5 when omitted; `source_servings < 1` is 400.
  - Photo: jpeg/png/webp only (sniff body), 5 MB cap, stored under upload dir, served via authenticated route.
  - DELETE returns 409 if the recipe is a dinner on the current or a future week.
  - All routes session-gated; error shape `{ error: { code, message } }`.

### T009: Recipe library, form, and cook view
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T008
- Acceptance criteria:
  - `/recipes` search by name / ingredient / tag.
  - `/recipes/new` and `/recipes/:id/edit`: title, servings, time, tags, ingredients (amount/unit/aisle), steps, source URL, notes, photo.
  - `/recipes/:id` cook view: large type, ingredients + steps, source link if present. Usable on a phone.
  - Manual entry works with **no** import pipeline.
  - UI-touching.
  - Visual 2026-09-12: `visual OK` (library, form, cook). Phone cook readable. See `docs/ui-reviews/2026-09-12/`.

### T010: Week and slot API
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T008
- Acceptance criteria:
  - `GET /api/weeks?start=YYYY-MM-DD` get-or-creates a Sunday week + 7 slots.
  - Invalid start (not Sunday) is 400 or is coerced to that week’s Sunday — pick one and document it; tests lock the choice.
  - `PATCH` slot: `empty` | `dinner` | `leftover` | `eat_out` | `skip`; dinner requires `recipeId`.
  - At most **5** dinners per week (400 if a 6th is added).
  - At most **one** `is_anchor` per week; setting a new anchor clears the old.
  - Leftover / eat-out / skip store no recipe (or ignore recipeId).
  - `GET /api/settings` + `PATCH /api/settings` (servings ≥ 1).

### T011: Suggestions API
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T006, T010
- Acceptance criteria:
  - `GET /api/weeks/:id/suggestions` ranks library recipes **not** already on the week.
  - Score vs anchor ingredients if only one dinner; vs union of all planned dinners otherwise.
  - Empty library or no dinners yet returns `[]` (or unranked library — document); must not 500.
  - Payload includes `recipeId`, `title`, `score`, `sharedIngredients`.

### T012: Week planner UI
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T011, T009
- Acceptance criteria:
  - `/` shows the current/upcoming week (Sunday start), seven nights.
  - User can set an anchor dinner, add/remove dinners (max 5), mark leftover / eat-out / skip.
  - Suggestions list shows “shares X, Y” chips; user can pick a suggestion **or** any other saved recipe.
  - 3-dinner week is valid (not an error state).
  - UI-touching.
  - Visual 2026-09-12: `visual OK` (week + suggestions). Polish: native selects, text-only “Add to next empty night”.

### T013: Shopping list and staples API
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T007, T010
- Acceptance criteria:
  - `GET /api/weeks/:id/shopping-list` regenerates **generated** rows from planned dinners using household servings (default 5), omits staples, groups by aisle.
  - Checkoffs and **manual** lines survive regenerate (key: `name_normalized` + unit).
  - PATCH check / edit manual; POST manual add; leftover/eat-out/skip add no generated items.
  - Staples CRUD: `GET/POST /api/staples`, `DELETE /api/staples/:id`.
  - Seed staples are hidden on a list that would otherwise include “salt” / “olive oil”.

### T014: Shop page and staples page
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T013
- Acceptance criteria:
  - `/shop` is this week’s list: aisle groups, large check targets, readable amounts for five.
  - Manual “add item” works.
  - `/staples` add/remove don’t-shop items; changes reflect on next `/shop` load.
  - Usable one-handed on a phone.
  - UI-touching.
  - Visual 2026-09-12: `visual OK` (shop + staples). Shop check rows are large; staples Remove is a small text link.

### T015: SSRF-safe URL fetch
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T001
- Acceptance criteria:
  - Shared fetch helper: `http`/`https` only; max 5 redirects; 2 MB; 15s timeout.
  - After DNS resolve, reject loopback, link-local, RFC1918, ULA, `169.254.169.254`.
  - No `file:` , no video download.
  - Vitest (mocked DNS/network) covers reject-private and allow-public-https.
  - User-Agent identifies Weekly Meals.

### T016: Import extract pipeline and API
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T008, T015
- Acceptance criteria:
  - `POST /api/imports` { url } classifies `blog` | `pinterest` | `tiktok` | `instagram` | `youtube`.
  - Blogs: JSON-LD / microdata Recipe → draft.
  - Pinterest: follow destination when present, then blog extract; else unstructured pin HTML.
  - TikTok / Instagram / YouTube: oEmbed + caption/description only — **no video file, no yt-dlp**.
  - Optional LLM only if `LLM_BASE_URL` or `LLM_API_KEY` is set **and** structured extract is thin; skip LLM if it would blow the 15s budget.
  - Always persist `import_drafts` with `source_url`. Hard failure → `failed` draft with empty fields (bookmark), not a 500.
  - `POST /api/imports/:id/commit` creates a recipe from reviewed fields; never auto-commit.
  - App works with all `LLM_*` empty.

### T017: Import review UI
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: feature
- Depends on: T016, T009
- Acceptance criteria:
  - `/import`: paste URL → show draft form (same fields as manual recipe) → user edits → save to library.
  - Failed extract still shows the URL and an empty form.
  - User cannot skip review (no “save without looking” that bypasses the form).
  - UI-touching.
  - Visual 2026-09-12: `visual OK` (failed extract + empty review form).

### T018: Playwright north-star path + runbook
- Status: [~]
- Owner: @04-dev-fullstack
- Track: build
- Category: tech_debt
- Depends on: T012, T014, T017
- Acceptance criteria:
  - Playwright covers: login → create two recipes by hand → set week (anchor + second dinner) → open shop list with merged/scaled lines → check one item → import URL can fail and still save a manual recipe from the draft form.
  - README documents: `pnpm` scripts, Compose, env vars, Netbird access, “HTTP on trusted tailnet,” backup = copy `/data`.
  - No public-cloud deploy instructions.

### T019: CI lint, unit tests, Docker build
- Status: [ ]
- Owner: @05-dev-ops
- Track: build
- Category: tech_debt
- Depends on: T001, T004
- Acceptance criteria:
  - GitHub Actions on PRs: `pnpm lint`, `pnpm test`, `docker build`.
  - No paid LLM calls in CI.
  - `staging` / `main` protection notes stay as they are (merge phrases unchanged).
  - Can complete once T001+T004 exist; re-run after T018 if the workflow needs Playwright later (Playwright in CI is optional for this sprint).

### T020: Visual pass on household UI
- Status: [~]
- Owner: @08-ui-artist
- Track: build
- Category: feature
- Depends on: T003, T009, T012, T014, T017
- Visual 2026-09-12: `visual OK` on login, week, suggestions, cook, form, import, shop, staples (desktop + phone). Living notes in `docs/design.md`. Screenshot log in `docs/UI_REVIEW.md`. Recapture with `pnpm capture:ui`. Not `[x]` — `@06-dev-qa` owns T021.
- Acceptance criteria:
  - Screenshots (desktop + a phone viewport) of: login, week planner, suggestions, recipe cook, recipe form, import review, shop, staples.
  - Notes `visual OK` or `[!]` in `docs/UI_REVIEW.md` per screen.
  - Phone shop/cook must be readable without pinch-zoom for body text.
  - Does not change product scope — visual-only fixes allowed on existing tickets.

### T021: QA north-star verification
- Status: [ ]
- Owner: @06-dev-qa
- Track: build
- Category: feature
- Depends on: T018, T020
- Acceptance criteria:
  - Executes the sprint goal story locally (or against Compose) with two users.
  - Confirms: 3–5 dinners, max-5 enforced, scale-to-5 math, staples hidden, checkoffs persist after adding a dinner, import review required, private URL fetch rejected (or unit tests reviewed if live SSRF test is unsafe).
  - Marks feature tickets `[x]` or `[!]` with repro notes. Does not `[x]` a UI ticket while T020 is `[!]`.

---

Sprint plan and task board ready in `docs/TASKS.md`. Estimated scope and complexity breakdown complete. Reply with **'APPROVED'** to start code generation.
