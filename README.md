# Weekly Meals

Private household app: save recipes, pick an **anchor dinner**, fill 3–5 nights from recipes that share ingredients, and shop for **five**.

Runs on a home server. Phones reach it over **Netbird** (or LAN). Do **not** port-forward 3000/80/443 to the public internet.

## Local commands

App lives in `src/`.

```bash
cp .env.example .env.local
# set AUTH_SECRET (openssl rand -base64 32) and household passwords

pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm test
pnpm test:e2e
pnpm build && pnpm start
```

Default seed users (override in env): `planner` / `planner` and `shopper` / `shopper`.

## Docker (home server)

```bash
cp .env.example .env
# set AUTH_SECRET, AUTH_URL (Netbird IP or MagicDNS), and passwords
docker compose up --build
```

- App: port **3000** on LAN / Netbird only.
- Data: Docker volume `meals-data` → `/data/app.db` and `/data/uploads`.
- Backup: copy the volume or `/data` directory.

Threat model is a **trusted tailnet + household passwords**. HTTP on Netbird is acceptable (the tunnel is already encrypted). Café Wi-Fi without Netbird is not.

## Env

See `.env.example`. `LLM_*` can stay empty — import still returns a draft to review (or an empty form with the URL saved).

## Agent workflow

Gated team — read `docs/PROJECT_STATE.md`. Do not skip gates.

- **`APPROVED`** — advance the current product gate
- **`MERGE TO STAGING`** — merge a feature PR into `staging`
- **`DEPLOY TO PRODUCTION`** — merge `staging` → `main` and ship to the home server
