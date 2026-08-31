# Architecture: Weekly Meals

**Date:** 2026-08-30  
**Status:** Gate 2 approved 2026-08-30  
**Source of truth:** `docs/RESEARCH.md` (Gate 1 approved)

Single-household web app: save recipes (typed or URL), plan 3–5 dinners around an anchor meal, generate a shopping list scaled to **5 servings**. Runs on a home server; phones reach it over **Netbird**.

---

## Tech stack and rationale

Scaffold preset was generic. Research needs a **mobile-friendly web app**, a **server-side URL fetch/extract pipeline**, **two logins**, and **one-container home-server deploy**. That is a full-stack web app, not a native mobile project.

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Next.js (App Router) + TypeScript** | One process for UI + API. Mobile-first pages for planning, cooking, and shopping. Fits this repo’s `src/` convention. |
| UI | **React + Tailwind CSS** | Fast, readable household UI without a design system subscription. |
| DB | **SQLite** via **Drizzle ORM** | One family, thousands of recipes at most. Zero DB server. File lives on a Docker volume — trivial backup (`cp`). |
| Auth | **Auth.js (Auth.js / NextAuth v5) credentials** | Two seeded household users. “Two accounts if trivial” is trivial here. No OAuth, no email provider. |
| Import parse | **cheerio + JSON-LD / microdata** | Free, deterministic path for blogs and many Pinterest destinations. |
| Import (unstructured) | **Optional LLM** — Ollama on the same host *or* an OpenAI-compatible API | Used only when structured recipe data is missing (TikTok / Reels / some pins). App must work with this **off**. |
| Jobs | **In-process**, request-scoped | Household traffic is tiny. Import is a single HTTP request with a hard timeout — no Redis/queue in MVP. |
| Media | **Local disk** (`/data/uploads`) | Recipe photos only. No S3. |
| Package | **pnpm** | Lockfile + fast CI. |
| Runtime | **Node 22** in **Docker Compose** | Matches a home server. One app container + named volumes for `db` and `uploads`. |
| Reverse proxy | **Optional Caddy** on the host | HTTP on the Netbird/LAN interface is acceptable (Netbird already encrypts the tunnel). Caddy + an internal cert is optional hardening, not required for MVP. |
| Tests | **Vitest** (unit: overlap, scale, merge) + **Playwright** (happy-path UI) | The product’s risk is logic (scale-to-5, de-dupe, overlap), not pixel animation. |

**Rejected alternatives**

- **Postgres / hosted Supabase:** extra process and an account for one household.
- **Separate API + SPA:** two deploys, no benefit at this scale.
- **Native iOS/Android:** research non-goal.
- **Python + recipe-scrapers as the main app:** better blog extract, worse fit for the rest of the product. If blog extract quality is poor after v1, add a tiny sidecar later — do not start bilingual.
- **Storing social video:** ToS and disk; we store extracted text + the original URL only.

---

## System diagram / component overview

```
  Phone / laptop (LAN or Netbird)
              |
              |  HTTP(S)  →  weekly-meals:3000
              v
     ┌─────────────────────────────────────────┐
     │  Next.js container                      │
     │                                         │
     │  Pages (planner, recipe, shop, import)  │
     │       │                                 │
     │       ├── Auth.js session (httpOnly)    │
     │       ├── Recipe library                │
     │       ├── Week planner + overlap rank   │
     │       ├── Shopping list (scale → merge) │
     │       └── Import pipeline               │
     │              │                          │
     │              ├─ 1. classify URL         │
     │              ├─ 2. fetch (SSRF-safe)    │
     │              ├─ 3. JSON-LD / pin dest   │
     │              └─ 4. optional LLM draft   │
     └───────────┬─────────────┬───────────────┘
                 │             │
                 v             v
           SQLite file    /data/uploads
           /data/app.db   (photos)
                 │
                 └── optional: Ollama on host
                     (same Netbird/LAN)
```

**Core loop (must work with import disabled)**

1. Users CRUD recipes by hand.
2. A week (Sunday start) gets one **anchor** dinner, then 2–4 more dinners from **overlap suggestions** (or a free pick).
3. Slots may be leftover / eat-out / skip (no shop items).
4. Shopping list = all dinner recipes, each scaled **written servings → 5**, merged, staples removed, checkoffs stored.

**Import loop (assist, never authoritative)**

1. User pastes a TikTok / Instagram / YouTube / Pinterest / blog URL.
2. Server fetches the URL (public http/https only).
3. Pipeline returns a **draft**. User must review/edit and explicitly save.
4. On hard failure, keep the URL and an empty draft so it is still a bookmark.

```
URL
 ├─ blog / unknown HTML  → JSON-LD Recipe / microdata → draft
 ├─ pinterest.com        → follow pin destination → same as blog
 │                         if no dest, treat pin HTML as unstructured
 ├─ tiktok / instagram / youtube
 │                       → oEmbed + caption/description (no video file)
 │                       → if too thin, optional LLM → draft
 └─ any path             → if empty, draft { source_url } for manual fill
```

**Overlap ranker (in-process, no ML)**

- Normalize ingredient names (lowercase, trim, collapse whitespace, light singularize).
- Ignore / down-weight a **noise list**: water, salt, pepper, oil, olive oil, vegetable oil, cooking spray.
- Up-weight proteins and produce via a small keyword table (chicken, beef, salmon, spinach, cilantro, …).
- Score vs the **anchor** first; after a second dinner is added, score vs the **union of ingredients already on the week**.
- Return top matches with `shared_ingredients[]` for the “why” chips.
- Never hide the rest of the library — suggestions are a sorted list, not a jail.

**Scale + merge**

- `factor = household_servings / recipe.source_servings` (household default **5**; reject `source_servings < 1`).
- Scale each amount; when units match after a tiny alias map (`tsp`/`teaspoon`, `tbsp`/`tablespoon`, `g`/`gram`), **sum**.
- When units do not match, keep **separate lines** (do not guess `1 cup` + `4 oz`).
- Recompute list whenever the week’s dinners change; **preserve `checked` by (normalized name + unit)**.

---

## Data models

SQLite. UUIDs as text primary keys. Timestamps ISO-8601 text.

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| username | text unique | login id (not email-required) |
| password_hash | text | scrypt / bcrypt via Auth.js |
| display_name | text | |
| created_at | text | |

Seed two users at first boot from env (`PLANNER_USERNAME` / `PLANNER_PASSWORD`, `SHOPPER_USERNAME` / `SHOPPER_PASSWORD`). Both have the same permissions (household app, no RBAC).

### `settings` (singleton row `id = 1`)

| Column | Type | Default |
| --- | --- | --- |
| household_servings | integer | **5** |
| week_starts_on | text | `sunday` |
| updated_at | text | |

### `recipes`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| title | text not null | |
| source_url | text null | original TikTok/pin/blog URL; kept even if extract failed |
| source_kind | text null | `manual` \| `blog` \| `pinterest` \| `tiktok` \| `instagram` \| `youtube` |
| source_servings | integer not null | yield **as written**; default 5 if user did not set |
| time_minutes | integer null | |
| photo_path | text null | relative path under `/data/uploads` |
| notes | text null | |
| created_by | text fk users | |
| created_at / updated_at | text | |

### `recipe_ingredients`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| recipe_id | text fk | cascade delete |
| name | text not null | display name |
| name_normalized | text not null | overlap + merge key |
| amount | real null | null = “to taste” |
| unit | text null | canonical when known |
| sort_order | integer | |
| aisle | text | `produce` \| `meat_seafood` \| `dairy` \| `bakery` \| `pantry` \| `other` — set on save via keyword map, editable |

### `recipe_steps`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| recipe_id | text fk | cascade |
| sort_order | integer | |
| body | text | |

### `tags` / `recipe_tags`

- `tags.name` unique (`healthy`, `high-protein`, `vegetarian`, `quick`, `kid-favorite`, plus household-created).
- MVP: badges + optional filter. No hard blockers.

### `weeks`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| start_date | text unique | Sunday `YYYY-MM-DD` |
| created_at | text | |

### `week_slots`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| week_id | text fk | cascade |
| day_index | integer | 0 = Sunday … 6 = Saturday; unique per week |
| kind | text | `empty` \| `dinner` \| `leftover` \| `eat_out` \| `skip` |
| recipe_id | text fk null | required when `kind = dinner` |
| is_anchor | integer | 0/1; at most one `1` per week |

**Invariant:** count of `kind = dinner` in a week is **0–5**.

### `staples`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| name | text | display |
| name_normalized | text unique | hide-from-list key |

**Seed:** water, salt, black pepper, pepper, olive oil, vegetable oil, canola oil, cooking spray, garlic powder, onion powder. Household can add/remove.

### `shopping_list_items`

Derived rows, persisted so checkoffs survive regenerate.

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| week_id | text fk | cascade |
| name | text | |
| name_normalized | text | |
| amount | real null | |
| unit | text null | |
| aisle | text | |
| checked | integer | 0/1 |
| source | text | `generated` \| `manual` (allow “add milk” on the list) |

Unique-ish key for regenerate: `(week_id, name_normalized, unit)`.

### `import_drafts`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| source_url | text | |
| source_kind | text | |
| status | text | `pending` \| `ready` \| `failed` \| `saved` |
| extracted_json | text | draft recipe payload |
| error | text null | |
| created_by | text fk | |
| created_at | text | |

Drafts older than 7 days may be deleted. Saving a draft creates a `recipes` row and sets `status = saved`.

---

## API contracts

Session cookie required on all routes except `POST /api/auth/*`. JSON in/out. Errors: `{ "error": { "code": "...", "message": "..." } }`.

### Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/callback/credentials` | Auth.js |
| POST | `/api/auth/signout` | |
| GET | `/api/auth/session` | `{ user: { id, username, displayName } }` |

### Settings

| Method | Path | Body / result |
| --- | --- | --- |
| GET | `/api/settings` | `{ householdServings, weekStartsOn }` |
| PATCH | `/api/settings` | optional fields; servings must be ≥ 1 |

### Recipes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/recipes` | query: `q`, `tag`, `ingredient` |
| GET | `/api/recipes/:id` | full recipe + ingredients + steps + tags |
| POST | `/api/recipes` | create (manual or from reviewed draft) |
| PATCH | `/api/recipes/:id` | |
| DELETE | `/api/recipes/:id` | 409 if referenced by a future/current week dinner |
| POST | `/api/recipes/:id/photo` | multipart; jpeg/png/webp, 5 MB cap |

**Create/update body**

```json
{
  "title": "Lemon chicken",
  "sourceUrl": "https://...",
  "sourceKind": "tiktok",
  "sourceServings": 4,
  "timeMinutes": 35,
  "notes": "",
  "tags": ["high-protein"],
  "ingredients": [
    { "name": "chicken thighs", "amount": 2, "unit": "lb", "aisle": "meat_seafood" }
  ],
  "steps": [{ "body": "Pat chicken dry." }]
}
```

### Import

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/imports` | `{ "url": "https://..." }` → `201 { draft }` (status `ready` or `failed` with empty fields + url) |
| GET | `/api/imports/:id` | |
| POST | `/api/imports/:id/commit` | optional body overrides → creates recipe, marks draft saved |

Import is **synchronous** with a **15s** budget. If the optional LLM is slow, skip it and return the partial draft rather than hang the phone.

### Weeks & suggestions

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/weeks?start=YYYY-MM-DD` | creates the week row if missing |
| GET | `/api/weeks/:id` | week + 7 slots + nested recipe summaries |
| PATCH | `/api/weeks/:id/slots/:dayIndex` | `{ kind, recipeId?, isAnchor? }` |
| GET | `/api/weeks/:id/suggestions` | ranked library minus already-planned dinners |

**Suggestion item**

```json
{
  "recipeId": "...",
  "title": "Garlic spinach pasta",
  "score": 4.2,
  "sharedIngredients": ["spinach", "garlic", "chicken"]
}
```

### Shopping list

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/weeks/:id/shopping-list` | grouped by aisle; regenerates generated rows, keeps checkoffs + manual lines |
| PATCH | `/api/weeks/:id/shopping-list/:itemId` | `{ checked }` or `{ amount, name }` for manual |
| POST | `/api/weeks/:id/shopping-list` | `{ name, amount?, unit?, aisle? }` manual add |

### Staples

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/api/staples` | |
| DELETE | `/api/staples/:id` | |

### Pages (App Router)

| Route | Purpose |
| --- | --- |
| `/login` | credentials |
| `/` | current / upcoming week planner + suggestions |
| `/recipes` | library search |
| `/recipes/new` | manual form |
| `/recipes/:id` | cook view (big type, steps) |
| `/recipes/:id/edit` | edit |
| `/import` | paste URL → review draft → save |
| `/shop` | this week’s list, checkoffs, large tap targets |
| `/staples` | don’t-shop list |

All pages except `/login` require a session.

---

## Auth, security, and deployment assumptions

### Auth

- Two household accounts, seeded from env on first boot. No self-serve signup.
- Session: httpOnly cookie, 30-day sliding. Same-site `Lax`.
- `NEXTAUTH_SECRET` required. `NEXTAUTH_URL` = the URL phones actually use (Netbird IP or hostname), e.g. `http://100.x.y.z:3000` or `http://meals.nb.home`.
- Netbird is **not** identity. A stolen link on an unlocked phone still needs the password.

### Network

- Bind `0.0.0.0:3000` inside Compose. Publish only on LAN / Netbird interfaces — **do not port-forward 3000/80/443 to the public internet.**
- Phones: Netbird client on, open the Netbird IP or MagicDNS name.
- HTTPS: optional. If HTTP-only, document that the threat model is “trusted tailnet + household passwords,” not café Wi-Fi without Netbird.

### Import / SSRF

The server fetches user-supplied URLs. That is the highest-risk feature on a home LAN.

- Allow `http` / `https` only.
- Resolve DNS and **reject** loopback, link-local, RFC1918, ULA, cloud metadata (`169.254.169.254`).
- Cap redirects (max 5), response size (2 MB), time (15s).
- Do not fetch `file:`, do not pass through household proxy credentials.
- Do not download or store video files. No `yt-dlp` in MVP (that path invites ToS and disk abuse). Captions/descriptions from HTML/oEmbed only.
- User-Agent: identify as Weekly Meals; some sites will still block — that is a failed draft, not a crash.

### Uploads

- Images only (sniff content-type, not just extension).
- Serve via an authenticated route, not a wide-open `/uploads` static mount if we can avoid it.

### Backup

- Nightly (or on-demand) copy of `/data/app.db` and `/data/uploads`. Architect recommendation: restic or a simple cron `cp` to another disk. Ops details at Gate 4.

### Deploy shape

```
# compose (conceptual)
services:
  web:
    build: .
    ports:
      - "3000:3000"     # host firewall / Netbird only
    environment:
      DATABASE_PATH: /data/app.db
      UPLOAD_DIR: /data/uploads
      NEXTAUTH_SECRET: ...
      NEXTAUTH_URL: http://<netbird-host>:3000
      PLANNER_USERNAME: ...
      PLANNER_PASSWORD: ...
      SHOPPER_USERNAME: ...
      SHOPPER_PASSWORD: ...
      LLM_BASE_URL: ""   # empty = off; or http://ollama:11434/v1
      LLM_MODEL: ""
      LLM_API_KEY: ""
    volumes:
      - meals-data:/data
```

CI (Gate 4): lint, unit tests, Docker build. “Production” = this compose stack on the home server after `DEPLOY TO PRODUCTION`. Staging can be the same image tag on a second compose project or a `staging` hostname on the same box — ops chooses at Gate 4. No Vercel, no public SaaS DB.

---

## Out of scope / deferred decisions

Locked as **do not build in MVP** (matches research non-goals plus architect cuts):

- Native apps, PWA share-sheet (paste URL is enough).
- Public ingress, SaaS multi-tenant, billing.
- Video download / in-app playback.
- AI-generated weeks or recipes not already in the library.
- Nutrition macros; **week-balance “lighter next meal” ranker** (design hook: add a `heaviness` tag later and bias suggestions — do not schema it now beyond tags).
- Pantry inventory, barcodes, receipt OCR.
- Instacart / store pricing.
- Ingredient alias graph (“scallion” = “green onion”) — normalize only; wrong merges are better as two lines.
- Background job queue, Redis, Postgres.
- `yt-dlp` / headless browser import.
- Kid profiles, breakfasts, lunches.

**Deferred but compatible** (no rewrite expected):

- PWA share target hitting `POST /api/imports`.
- Python extract sidecar behind the same `/api/imports` contract.
- CSV / Paprika import into `POST /api/recipes`.
- Changing `household_servings` later (already in `settings`).

**Architect defaults (research left these open)**

- Week starts **Sunday**.
- Two accounts (planner + shopper), same role.
- Staple **seed list** above; household edits from `/staples`.

---

## Cost posture (MVP)

| Item | Monthly $ | Notes |
| --- | --- | --- |
| Home server + electricity | ~0 incremental | Machine already running. |
| Netbird | 0 | Existing tailnet. |
| SQLite / Docker / Next.js | 0 | |
| Domain / public TLS | 0 | Not used. |
| LLM | **0 default** | JSON-LD path is free. Ollama on the same box is free. Optional OpenAI-class API: budget **$0–5/mo** if you paste many videos (keep it off until import quality needs it). |
| Object storage / managed DB | 0 | Local volume. |

**Engineering risk (not dollars):** social extract quality. The architecture treats that as a **best-effort draft**. The product is still complete if every TikTok is typed once. Do not spend the first sprint on a brittle scraper farm.

---

Architecture proposal is saved in `docs/ARCHITECTURE.md`. Please review the stack and system design. Reply with **'APPROVED'** to hand over to `@03-manager` for task breaking and cost estimation, or request changes.
