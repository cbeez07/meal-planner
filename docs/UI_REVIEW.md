# UI Review

Living visual log for `@08-ui-artist`. Screenshots go in `docs/ui-reviews/YYYY-MM-DD/`. Judge **pixels** (read the image files), not only source.

Read theme/brand tokens from the app theme and `docs/ARCHITECTURE.md`. Working design notes live in **`docs/design.md`**.

## How to invoke

In chat: `@08-ui-artist` plus either a ticket id (PR visual pass) or “full-app audit”.

## Reviews

### 2026-09-12 — T020 household UI (desktop + phone)

**Branch / capture:** `pnpm capture:ui` → `docs/ui-reviews/2026-09-12/`  
**Brand:** paper `#f6f1e8`, sage `#3f6b4f`, terracotta `#c46a3a` (tokens already in `src/app/globals.css`; no invented palette).

| Screen | Files | Result | Notes |
| --- | --- | --- | --- |
| Login | `desktop-login.png`, `phone-login.png` | visual OK | Centered card, large fields, sage Sign in. |
| Week planner | `desktop-week-planner.png`, `phone-week-planner.png` | visual OK | Anchor chip + recipe link readable. Native selects. ISO week date is cold. |
| Suggestions | `desktop-suggestions.png`, `phone-suggestions.png` | visual OK | “shares …” chips read. Add-to-night is a text link. Sticky header stitch in full-page PNG is a capture artifact. |
| Recipe cook | `desktop-recipe-cook.png`, `phone-recipe-cook.png` | visual OK | Large type; phone body readable without pinch-zoom. |
| Recipe form | `desktop-recipe-form.png`, `phone-recipe-form.png` | visual OK | Phone Amt/Unit/aisle row is tight. |
| Import review | `desktop-import-review.png`, `phone-import-review.png` | visual OK | Failed extract keeps URL + empty form + chip banner. |
| Shop | `desktop-shop.png`, `phone-shop.png` | visual OK | Large check rows; aisle groups; readable on 390px. |
| Staples | `desktop-staples.png`, `phone-staples.png` | visual OK | Remove is text-only (small). List is a flat stack. |

**T020 phone shop/cook pinch-zoom:** pass (body text readable at 390×844).

**Not `[!]`.** Polish backlog is in `docs/design.md` → Open design work.

Hand off to `@06-dev-qa` for T021. Do not mark feature tickets `[x]` here.
