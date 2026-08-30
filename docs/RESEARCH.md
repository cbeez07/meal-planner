# Research: Weekly Meals

**Product:** Weekly Meals — a private household app for saving recipes (including social posts), planning 3–5 dinners around shared ingredients, and generating one shopping list scaled for five servings.

**Context:** Built for one household (Chris, wife, three kids). Self-hosted on a home server; phones reach it over **Netbird**, not the public internet. Research still uses the commercial market to show why existing apps do not fit this workflow.

**Date:** 2026-08-30  
**Status:** Gate 1 approved 2026-08-30. Open questions answered; scope refined.

---

## Problem / opportunity

Weekly dinner planning for a family of five fails in three places:

1. **Recipes live in too many places.** Inspiration arrives as a TikTok, an Instagram Reel, a YouTube video, a Pinterest pin, a food-blog tab, a screenshot, or a text from a friend. By Sunday there is no single list of “meals we actually want to cook.” Classic recipe managers (Paprika, Recipe Keeper) handle food blogs well and social video poorly. Newer import apps extract TikToks but then push a subscription catalog, not a private household library.

2. **Meals are chosen as isolated dishes.** Picking several unrelated recipes produces a long grocery list, half-used produce, and a bunch of cilantro that dies in the crisper. USDA estimates 30–40% of the U.S. food supply is wasted; the usual household culprit is produce bought for one recipe with no second job. Home cooks already know the fix — “ingredient bridging”: one protein, one set of vegetables, several different dinners. Almost no consumer app starts from *your* saved recipe and then recommends *your other saved recipes* that reuse those ingredients.

3. **The shopping list is a second chore — and the portions have to feed five.** After the plan is decided, someone still has to merge ingredients, scale a blog recipe written for 4 (or 8) up or down to this household, and remember staples. Planning and shopping may be split (she plans, he shops). A generated list scaled to **5 servings** is the handoff. (Two of the three kids eat adult portions, so “family of five” here means five adult-equivalent plates, not a “kids eat half” scaler.)

**The product opportunity is not “another AI meal planner.”** It is a quiet household tool with one distinctive loop:

> Save recipes in one place (typed or pasted from TikTok / Instagram / YouTube / Pinterest / blogs) → pick an **anchor dinner** for the week → see other saved recipes ranked by **ingredient overlap** → lock 3–5 dinners → get **one shopping list for 5**.

That loop is useful even with a small personal library. It does not require a 200k-recipe catalog, pantry barcode scanning, or a nutrition coach. It does require reliable save/import across the places this family actually finds food, a simple weekly picker, overlap ranking, and a clean list.

Self-hosting plus Netbird is part of the opportunity: the family does not need accounts on a vendor cloud, ads, or a $5–12/month subscription. The app stays on the home server; phones at the store join the same tailnet.

---

## Target personas

This is a **single-household family product**, not a multi-tenant marketplace. Personas below are the people who will use it.

### Primary — “The Weekly Planner” (wife)

- Plans **3–5 dinners** at the start of the week for a table of five.
- Wants healthy, varied dinners without deciding from scratch every night.
- Finds recipes on TikTok, Instagram, YouTube, Pinterest, and blogs — and currently loses them in saves, screenshots, or memory.
- Will use the app once a week to pick meals, when a post is worth saving, and during the week to cook from a saved recipe.
- Cares about: “Does this feel healthy?”, “Will we actually cook this?”, “Do I have to retype that TikTok?”, “Is this enough food for everyone?”
- Does **not** want a calorie tracker or a 40-field recipe form in v1.

**Jobs to be done**
- Capture a recipe in under a minute when she sees it, from any of the sources above.
- On planning day, pick one dinner she is excited about, then fill 2–4 more nights from suggestions that share ingredients.
- See a week that looks like *her* cooking, not a random catalog.

### Secondary — “The Shopper / Host” (Chris)

- Shops from the generated list; may cook some nights.
- Owns the home server and Netbird; will keep the app reachable on household phones.
- Cares about: a list he can take to the store, quantities that match five plates, no monthly SaaS tax, data that stays in the house.

**Jobs to be done**
- Open one shopping list after the week is locked — from a phone on Netbird at the store.
- Ingredients grouped (produce, protein, dairy, pantry), de-duplicated, and scaled to 5 servings.
- Reliable uptime on existing hardware; simple backup.

### Implicit — the three kids

- They eat the dinners; they do not use the app.
- Two eat adult portions. The household plate count is **5**, not “2 adults + 3 child portions.”
- No kid-specific menus, lunch boxes, or picky-eater profiles in MVP. If a recipe is a kid favorite, a tag is enough.

### Anti-persona (explicitly not designing for)

- Bodybuilders logging macros meal-by-meal.
- People who want the app to *invent* recipes from a photo of the fridge.
- Commercial recipe publishers or multi-household SaaS customers.
- School-lunch / breakfast / snack tracking (dinners only).

### Value propositions (one line each)

| Audience | Promise |
| --- | --- |
| Planner | Your recipes, one place — including the TikTok / pin you just saw. Pick one dinner; the app finds companions that share a grocery cart. |
| Shopper | Lock 3–5 dinners, walk into the store with one list for five. |
| Household | Healthy meals you already chose — not a content feed — hosted at home, reached over Netbird. |

---

## Competitors and gaps

Evaluated against the household loop: **save from TikTok / Instagram / YouTube / Pinterest / blogs → pick an anchor → suggest from *your* library by shared ingredients → shopping list for 5 → home server + Netbird.**

| Product | Save / import | Weekly plan | Similar-ingredient suggestions | Shopping list | Self-host / private | Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **Paprika 3** | Excellent for blogs and many Pinterest-linked posts; **no TikTok/Reel import** today (promised later) | Calendar planner | No — you pick meals independently | Strong, customizable | Local-first, paid once (~$5) | Closest “serious cookbook” — misses social-video save and overlap |
| **ReciMe / Preplo / Nutrola / Pantidy / Butler** | Strong TikTok / IG / YouTube AI extract; Pinterest mixed | Yes (various) | Usually AI diet/catalog suggestions or pantry match, not “your library + this week’s anchor” | Yes (often paywalled) | Cloud subscription | Import is closer; product is a SaaS feed, not a private household tool |
| **Mealime / eMeals** | **No personal import** — curated library only | Guided weekly plans | Catalog recommendations | Aisle-grouped lists | Cloud | Fast if you accept *their* recipes; useless for “our TikToks” |
| **Plan to Eat / AnyList** | URL / manual; family share | Shared calendar | Weak / none | Excellent shared lists | Cloud | Great grocery coordination; weak recipe-intelligence |
| **KitchenPal / The Pantry** | Mixed | Yes | **Pantry → what can I cook now** (barcode, fridge photo) | Pantry-aware lists | Cloud | Opposite starting point: inventory first, not “anchor recipe first” |
| **SummitPlate** | Catalog / AI week builder | AI builds a connected week | **Ingredient overlap is the pitch** — but AI *generates* the week from its catalog, not from *your* saved recipes | Yes | Cloud | Same *idea*, different owner of the recipe library |
| **Notes / screenshots / TikTok / Pinterest boards** | Capture is instant | None | None | None | Yes | Current default. Zero planning power. |

### Gaps Weekly Meals should own

1. **Anchor-then-overlap from the household library.** User picks one saved recipe. Remaining saved recipes are ranked by shared ingredients (weighted toward produce and proteins, down-weighted for salt/oil/water). As more dinners are added (up to 3–5), ranking refreshes against the *whole week* so the cart stays tight. This is the product’s reason to exist.

2. **Social save that lands in *that* library — all the places they actually browse.** Paste a URL from **TikTok, Instagram, YouTube, Pinterest, or a recipe blog** → structured draft (title, ingredients with amounts, steps, source URL, optional thumbnail) → human review before it is trusted for shopping. Fallback: manual entry. Always keep the original URL so a failed extract is still a bookmark.

   **Pinterest note:** many pins *are* bookmarks to blogs (often with `schema.org/Recipe`). Those should resolve pin → destination page → same blog extract. Native / video-only pins with no clean blog behind them use the same video/caption extract path as TikTok, then the same review step. Pinterest is in MVP because that is where recipes are saved today, not because it is a third engine.

3. **One shopping list from the locked week, always for 5 servings.** Merge duplicate ingredients, scale each recipe from its written yield to 5, sum amounts when units match, hide household staples. Shared between planner and shopper.

4. **Private, cheap, household-scale, reachable off-LAN via Netbird.** Two logins if cheap, else one shared household login. No public ingress required. No growth loops, no recipe marketplace.

### What we should *not* try to beat

- Paprika’s 15-year cookbook UX and offline desktop apps.
- Mealime’s polished “pick 5 from our catalog” onboarding.
- KitchenPal-class barcode pantry inventory (high effort, low value until the recipe library is large).
- Full-fidelity TikTok / Instagram / YouTube playback inside the app (ToS and hosting risk). Store the **extracted recipe + original URL**, not the video file.

---

## Proposed scope

Scoped for a **household MVP** on a home server, reached from phones over Netbird. Features are ordered by the weekly loop.

### MVP (must ship for the product to be useful)

**Recipe library**
- Create / edit / delete a recipe: title, optional photo, **written servings** (whatever the source says), time, tags (e.g. healthy, high-protein, vegetarian, quick, kid-favorite), ingredients (name, amount, unit), steps, source URL, notes.
- Browse and search the household library (name, ingredient, tag).
- Manual entry is first-class — social import must not be the only way in.
- Start empty (no Paprika/CSV import in v1).

**Social / URL save (MVP, not later)**  
All of these are in-scope for the first version:

- TikTok
- Instagram
- YouTube
- Pinterest (resolve to the linked blog when present; otherwise extract from the pin)
- Recipe blogs / any page with `schema.org/Recipe`

Behavior:

- Paste a URL → extract a **draft** recipe.
- Planner **reviews and edits** before save. Never silently trust a video extract for the shopping list.
- Always keep the original URL. If extract fails, the link is still saved and the user can type ingredients/steps once.
- Do not re-host video files.

**Weekly plan (anchor workflow)**
- Create a week (default: upcoming week). **Dinners only.** Target **3–5 planned dinners**.
- Optional leftover / eat-out / skip nights (no extra shop items) so a 3-dinner week is a valid plan, not a failed one.
- Pick **one anchor dinner** from the library.
- See a ranked list of other saved recipes by ingredient overlap with the anchor (and, after the second pick, with the accumulating week).
- Show *why* a recipe ranked (e.g. “shares chicken, spinach, garlic”).
- Add / remove dinners until the week is set. Allow picking a recipe that is *not* in the top suggestions so the algorithm never traps the planner.
- Dietary preference in MVP is **tags only** (filter or badge). No hard blockers (“never show pork”).

**Shopping list**
- Generated from all planned dinners in the week.
- **Household yield is always 5 servings.** Scale each planned recipe from its written servings → 5 before merging (a 4-serving blog recipe is multiplied by 5/4; an 8-serving freezer batch is multiplied by 5/8).
- De-duplicate the same ingredient; sum amounts when units match.
- Group by simple store sections (produce, meat/seafood, dairy, bakery, pantry/other).
- **Staples hide list** from day one (oil, salt, pepper, common spices, and whatever this household marks “we always have this”). Hidden items do not appear on the list.
- Check off items while shopping; list belongs to the week.

**Household access**
- Two user accounts if it stays cheap to build (planner vs shopper); otherwise one shared household login.
- Mobile-friendly web app (planning + shopping on a phone; editing easier on desktop). No native apps.
- Deploy on the home server (Docker or equivalent). Reachable on the LAN and via **Netbird** for phones away from home. Assume no public port-forward / no public hostname required.
- Simple auth still required (Netbird is the network, not the user identity).

**Healthy (lightweight in MVP)**
- “Healthy” is a household definition: tags + optional short note (“high protein,” “lots of veg”).
- **No calorie/macro calculation in MVP.**

### Later (valuable, not required to start using it)

- Share-sheet / PWA “Save to Weekly Meals” from the phone (paste-URL is the MVP capture).
- Overlap scoring that prefers perishable produce and de-prioritizes pantry staples more aggressively; “use it up” suggestions mid-week.
- **Week-balance health recommendations:** if dinners already on the week lean high-fat (or similarly heavy), rank remaining suggestions toward lighter / lower-fat / more veg options from the library — compared to *this week’s other meals*, not a global diet score. Needs some fat/heaviness signal (tags at first, optional nutrition later).
- Recurring favorite weeks (“taco week”) as a saved template.
- Optional nutrition lookup to power the balancer more accurately.
- Multi-week history and “we cooked this 3 weeks ago.”
- CSV / Paprika import if a pile of existing recipes appears.

### Suggested first-week user story (acceptance north star)

1. Save 8–15 recipes (mix of typed recipes and pasted TikTok / Instagram / YouTube / Pinterest / blog URLs).
2. Sunday: pick one dinner as the anchor.
3. Add 2–4 more dinners (3–5 total) from the overlap list (or override).
4. Open the shopping list on a phone over Netbird at the store; quantities look like food for five; staples are absent; check items off.
5. Open a recipe on a phone while cooking.

If that story is pleasant, the product works.

---

## Non-goals

Out of scope for the first production version (and should stay out unless a later gate reopens them):

- Public recipe social network, comments, or follower feeds.
- Selling or syndicating recipes; scraping a commercial catalog to seed the library.
- AI that *invents* a full week of new recipes from preferences (that is SummitPlate / Mealime’s job). Suggestions must come from **saved household recipes**.
- Barcode pantry, receipt OCR, fridge photography.
- Instacart / Amazon Fresh checkout, store-specific pricing, or coupon engines.
- Calorie, macro, or GLP-1 coaching in MVP (week-balance health ranking is a **later** feature).
- Native iOS/Android App Store apps.
- Multi-tenant SaaS, billing, teams, or “invite 12 families.”
- Storing or re-hosting full TikTok / Instagram / YouTube / Pinterest video files.
- Kid lunch boxes, breakfast/snack tracking, picky-eater profiles, or restaurant reservations.
- Allergen legal claims or medical diet advice.
- Exposing the app on the public internet (Netbird is the remote-access path).

---

## Open questions

User answers from 2026-08-30 are locked below. Remaining items are small and can be assumed at Gate 2 if unanswered.

### Locked decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Week shape | **3–5 planned dinners** per week. Dinners only. Leftover / eat-out / skip nights allowed. |
| 2 | Servings | **Always 5** (two adults + three kids; two kids eat adult portions). Scale every planned recipe to 5 on the shopping list. |
| 3 | Diet rules | **Tags only** in MVP. No hard filters. |
| 4 | Import sources | **MVP:** TikTok, Instagram, YouTube, Pinterest, and recipe blogs. Pinterest often resolves to a blog; still treat the pin URL as a first-class save. |
| 5 | Import quality | **Draft + required review.** Never silently trust extract for the shopping list. |
| 6 | Logins | **Two accounts if trivial; else one shared login.** |
| 7 | Hosting / remote access | **Home server + Netbird.** Phones at the store use the tailnet. No public ingress assumed. |
| 8 | Staples | **Household “don’t shop” list from day one.** |
| 9 | Healthy in MVP | **Tags / notes only. No macros.** *Future:* recommend healthier / lighter options relative to other meals already on the week (e.g. one high-fat dinner → prefer a lower-fat next pick). |
| 10 | Existing library | **Start empty.** CSV / Paprika later if needed. |
| 11 | Name | **Weekly Meals** until renamed. |

### Still optional for Gate 2

- Exact staple starter set (oil, salt, pepper, garlic powder, …) vs an empty list the household fills.
- Whether “2 accounts if trivial” is judged trivial once a stack is chosen — architect may pick one shared login without another research pass.
- Week start day (Sunday vs Monday). *Assume Sunday unless you say otherwise.*

---

## Recommendation

Proceed to architecture if this refined household picture is right: **family of five, 3–5 dinners, scale-to-5 list, full social/Pinterest save with review, home server + Netbird.**

The risky piece is still **social extract quality across five source types**, not meal-planning UX. Gate 2 should design **one URL-in → draft-recipe-out pipeline** (blog JSON-LD, Pinterest-to-destination, caption/transcript for video) with a mandatory review step, and treat **anchor + overlap + scale-to-5 shopping list** as the core that must work even when the user types the recipe by hand.

I have generated the market research and feature scope in `docs/RESEARCH.md`. Please review. Reply with **'APPROVED'** to proceed to the Architecture phase, or provide feedback to refine.
