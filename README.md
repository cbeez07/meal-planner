# Weekly Meals

Weekly Meals — product TBD at Gate 1

This repo is a **gated agent team** for Cursor and/or Antigravity. Agents read `docs/PROJECT_STATE.md` and do not skip gates.

**Stack preset:** Generic (stack chosen at Gate 2) (`generic`). Architect may change this at Gate 2.

## Start here

1. Open this folder in Cursor or Antigravity.
2. Run **`@01-researcher`** with your product idea (Gate 1).
3. Reply **`APPROVED`** to advance. Do not write application code until Gate 3 is checked off.

## Tracks

| Track | Path | Gates |
| --- | --- | --- |
| Build | greenfield → first production | 1 research → 2 architecture → 3 tickets → 4 production |
| Maintenance | feedback → hotfix/release | M1 backlog → M2 sprint → M3 release |

## Roles

| Mention | Role |
| --- | --- |
| `@01-researcher` | Market research, personas, post-launch triage |
| `@02-architect` | Stack, schema, APIs, structural impact |
| `@03-manager` | Tickets, cost, 60/20/20 sprint mix |
| `@04-dev-fullstack` | Implement tickets (after Gate 3 / M2) |
| `@08-ui-artist` | Screenshot visual pass (pixels, not only source) |
| `@06-dev-qa` | Verify, mark `[x]` / `[!]` |
| `@05-dev-ops` | CI, env, staging → production |
| `@07-dev-maintenance` | Bugs, refactors, tech debt |

## Approval phrases

Product/process gates live in `docs/PROJECT_STATE.md`. GitHub merges are a separate phrase layer:

- **`APPROVED`** — check off the current gate and continue to the next role
- **`MERGE TO STAGING`** — merge a feature/fix PR into `staging` (not Gate 4 / M3)
- **`DEPLOY TO PRODUCTION`** — merge `staging` → `main` and ship

## Ticket status (`docs/TASKS.md`)

`[ ]` todo · `[~]` implemented, awaiting visual + QA · `[x]` QA_PASSED · `[!]` blocked

## Branches

- `main` — production (protected; merge only after `DEPLOY TO PRODUCTION`)
- `staging` — integration
- `feature/ticket-*` / `fix/ticket-*` — branched from `staging`

Never commit directly to `main` or `staging`. Never force-push those branches.

## Local commands (preset)

- App dir: `src/`
- Analyze: `the project lint/analyze command`
- Test: `the project test command`
