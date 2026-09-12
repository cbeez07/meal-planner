# Design: Weekly Meals

Living working file. Add notes, decisions, and sketches here as we iterate.  
Do not treat this as a locked brand book — it is the scratchpad plus the current shipped tokens.

**Related:** `docs/UI_REVIEW.md` (dated visual passes) · screenshots in `docs/ui-reviews/` · tokens in `src/app/globals.css`

---

## How to work in this file

1. **Inbox** — drop raw notes at the top of that section (newest first).
2. **Promote** a note into Tokens, Patterns, or a screen section when it becomes a decision.
3. **Decisions log** — one line when we accept or reject a direction. Do not delete history; mark it superseded.
4. **Recapture** after visual changes:

```bash
pnpm dev          # http://localhost:3000, planner / planner
pnpm capture:ui   # writes docs/ui-reviews/YYYY-MM-DD/{desktop,phone}-*.png
```

Then read the new images and append a dated pass under [Visual checks](#visual-checks).

---

## Inbox

_Add new thoughts here._

-

---

## Brand (as shipped)

Architecture did not define a marketing palette. The app already has a kitchen-paper theme in CSS. **Use these tokens; do not invent a second palette.**

| Token | Hex | Role |
| --- | --- | --- |
| `--paper` | `#f6f1e8` | Page background |
| `--paper-2` | `#fffdf8` | Cards, header, inputs |
| `--ink` | `#2c2418` | Primary text |
| `--muted` | `#6b5e4e` | Subcopy, placeholders |
| `--line` | `#e4d8c4` | Borders |
| `--sage` | `#3f6b4f` | Primary action, active nav |
| `--sage-dark` | `#2d523a` | Hover / pressed (defined, barely used) |
| `--terracotta` | `#c46a3a` | Anchor chip, errors, Remove |
| `--chip` | `#efe4d2` | Tags, suggestion chips, banners |

**Type**

- Headings: **Source Serif 4** (`--font-sans`), slight negative tracking.
- UI / body: **Geist** (`--font-ui`).
- Display titles are `text-3xl` / cook title `text-4xl`.

**Shape language**

- Cards: `rounded-2xl` + `border-line` + `bg-paper-2`.
- Fields: `rounded-xl`, `py-3` (comfortable thumb height).
- Actions: `rounded-full` sage fill, white label.
- Chips: `rounded-full` chip fill, or sage fill when selected / active nav.

**Layout**

- Content column `max-w-3xl`, centered. Desktop is intentionally narrow (phone-first household app).
- Sticky header: wordmark + Sign out, then pill nav (Week, Recipes, Import, Shop, Staples).
- Planner name hides on small screens (`hidden sm:inline`).

---

## Patterns (current)

| Pattern | Where | Notes |
| --- | --- | --- |
| Primary button | Sign in, New, Add, Save, Fetch draft | Full-width on phone forms; compact pill in headers |
| Ghost / outline | Sign out, Edit | Border + ink; easy to miss next to filled pills |
| Text action | + Ingredient, Make anchor, Add to next empty night, Remove | Sage or terracotta **text only** — small tap target |
| Native `<select>` | Night kind, aisle | Looks like OS chrome, not the pill language |
| List row | Recipes, shop items, staples, week nights | Same card recipe everywhere — consistent, a bit samey |
| Empty copy | One muted sentence | Fine. Shop / week feel unfinished when there is no plan |
| Error / fail | Terracotta text or chip banner | Import fail banner is the clearest |

---

## Screens

Judge **pixels** in `docs/ui-reviews/2026-09-12/`. Status is the latest visual pass, not QA.

| Screen | Desktop | Phone | Status | What we saw |
| --- | --- | --- | --- | --- |
| Login | `desktop-login.png` | `phone-login.png` | visual OK | Most finished empty state. Eyebrow “HOUSEHOLD”, serif title, large fields, sage Sign in. |
| Week planner | `desktop-week-planner.png` | `phone-week-planner.png` | visual OK | Seven night cards + native selects. Anchor = terracotta chip + sage recipe link. ISO date (`2026-09-06`) reads like a debug string. |
| Suggestions | `desktop-suggestions.png` | `phone-suggestions.png` | visual OK | “shares spinach” chip works. “Add to next empty night” is a quiet text link. Sticky-header full-page shots stitch oddly — not a user bug. |
| Recipe library | `desktop-recipe-library.png` | `phone-recipe-library.png` | visual OK | Search stack on phone (name / ingredient / tag). Cards show time + tags. New = sage pill. |
| Recipe form | `desktop-recipe-form.png` | `phone-recipe-form.png` | visual OK | Long but scannable. Phone ingredient row (Amt / Unit / aisle) is tight. Tag chips wrap cleanly. |
| Cook | `desktop-recipe-cook.png` | `phone-recipe-cook.png` | visual OK | Strongest screen. Large title, `text-lg` ingredients and steps. Readable on 390px without pinch-zoom. |
| Import review | `desktop-import-review.png` | `phone-import-review.png` | visual OK | Failed URL keeps the link and an empty form. Chip banner is clear. Fetch draft goes full-width on phone. |
| Shop | `desktop-shop.png` | `phone-shop.png` | visual OK | Aisle groups, large check rows (`min-h-14`). Body text readable one-handed. Aisle label `meat_seafood` → “Meat seafood”. |
| Staples | `desktop-staples.png` | `phone-staples.png` | visual OK | Seed list is a long undifferentiated stack. **Remove** is terracotta text — small for a thumb. |

---

## Open design work

Check off or add items. Visual-only fixes can land on a later ticket; do not sneak product-scope changes in here.

### Phone / store (highest leverage)

- [ ] Make **Remove** and **Add to next empty night** real buttons (min ~44px), not text links.
- [ ] Friendlier week label than `Week of YYYY-MM-DD` (e.g. “Week of Sep 6”).
- [ ] Aisle titles: `Meat & seafood`, `Dairy`, … not raw enum leftovers.
- [ ] Confirm nav pills don’t wrap or clip on a real 390-wide device (capture looks OK).

### Kitchen / planner

- [ ] Restyle night `<select>` to match pills (or a button + sheet).
- [ ] Empty nights need less visual weight so a 1-dinner week doesn’t look broken.
- [ ] Suggestion CTA should feel like the primary next action after an anchor.

### Form / import

- [ ] Ingredient Amt / Unit / aisle: stack or use a two-line row on phone.
- [ ] Optional: hide aisle until the name is filled (defaults to `other`).

### Theme gaps

- [ ] Use `--sage-dark` on press/hover so sage buttons feel clickable.
- [ ] Focus rings (keyboard on the home server / laptop).
- [ ] Cook view with a photo (none in this pass).

### Later / not now

- [ ] Dark mode — not requested.
- [ ] Custom illustrations — not requested.
- [ ] Marketing site — out of scope.

---

## Visual checks

### 2026-09-12 — first household pass (`@08-ui-artist`)

Captured against a seeded local app (planner / planner): Lemon chicken as Sunday **anchor**, Garlic spinach pasta left in Suggestions so overlap chips show.

**Verdict:** Usable and on-brand. Paper / sage / terracotta hold together. Phone shop and cook are readable without pinch-zoom. Not a visual `[!]` for T020 — polish lives in Open design work.

**Coverage:** login, week, suggestions, library, form, cook, import (failed extract), shop, staples × desktop 1280×800 and phone 390×844.

**Gaps:** no recipe photo; suggestions full-page PNGs include a sticky-header stitch; no hover/focus/error-login frames; real device not used (Playwright Chromium).

---

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-12 | Keep the shipped paper/sage/terracotta tokens | Already in `globals.css`; architecture had no competing brand |
| 2026-09-12 | `docs/design.md` is the working design file | Requested living doc we can add to; UI_REVIEW stays the dated screenshot log |
| 2026-09-12 | T020 is visual OK, not `[!]` | Phone shop/cook readable; remaining items are polish |

---

## Capture index

`docs/ui-reviews/2026-09-12/`

```
desktop-login.png          phone-login.png
desktop-week-planner.png   phone-week-planner.png
desktop-suggestions.png    phone-suggestions.png
desktop-recipe-library.png phone-recipe-library.png
desktop-recipe-form.png    phone-recipe-form.png
desktop-recipe-cook.png    phone-recipe-cook.png
desktop-import-review.png  phone-import-review.png
desktop-shop.png           phone-shop.png
desktop-staples.png        phone-staples.png
```
