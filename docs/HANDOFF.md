# LifeSavers Elite: Project Handoff

Paste this file (or tell the new chat to read `docs/HANDOFF.md`) at the start of a new session. It captures everything decided so far.

## Roles and rules
- **Owner / executive:** GitHub user `quentonstroud-bit`. Approves and merges everything.
- **Coder:** a collaborator with their own Claude account. Works on `coder/<topic>` branches. Not yet invited (owner must invite with Write access and protect `main`; see `CONTRIBUTING.md`).
- Repo: `quentonstroud-bit/lifesaverselite`. Claude sessions never push to `main`, never merge their own PRs, work on a branch and open **draft pull requests**. Rules are in `CLAUDE.md`.
- Never commit secrets (Stripe keys, Resend key, `.env`). Use `wrangler secret put`.

## Goal
Convert the current site/webapp into a more robust webapp with integrations, AI agents, and automatic processes and procedures, hosted on Cloudflare at **lifesaverselite.com**.

- Current site (Vercel, React + Vite + Tailwind + Google Apps Script backend + Google Sheets): https://lifesaverselite.vercel.app/
- New prototype (static marketing site, dark/gold/burgundy design, Playfair Display + Inter): https://lifesavers-elite.reverendqs.workers.dev
- Final domain: **LifeSaversElite.com**, registered at **Namecheap**, not yet in Cloudflare.

## Decisions made
- Backend: **Cloudflare-native** (Worker API + D1 database + cron + later R2/Queues). Replaces Google Sheets and Apps Script (`backend/Code.gs`).
- Email: **Resend** (owner will create the account).
- Payments: **Stripe**; owner has an account but products are not set up. Use test mode first.
- Phase 1: migrate the site plus a real backend, and integrations. Automations and AI agents come in phase 2.

## What exists in the repo (PR #1, branch `claude/blissful-carson-sxdt48`)
- `CONTRIBUTING.md`, `CLAUDE.md`, `.github/CODEOWNERS`, `.github/pull_request_template.md`: collaboration and review rules.
- `wrangler.jsonc`: Worker `lifesavers-elite`, static assets from `site/`, D1 binding `DB` (database_id is a placeholder), hourly cron, vars (`ADMIN_EMAIL`, `FROM_EMAIL`, `CAL_URL`), custom-domain routes commented out until cutover.
- `site/`: prototype pages (index, agents, contact, privacy, terms). The apply form posts to `/api/apply`.
- `worker/index.js`: `/api/health`, `/api/apply` (saves to D1, emails via Resend), `/api/stripe/webhook` (signature-verified, stores events), hourly job that releases expired leads to the pool.
- `migrations/0001_init.sql`: tables `users`, `lifesaver_applications`, `agent_applications`, `leads`, `transactions`, `stripe_events`.
- `docs/CLOUDFLARE_SETUP.md`: owner steps for Cloudflare, Namecheap nameservers, D1, Resend, deploy, Stripe webhook, cutover.
- Existing React app (login, dashboards, lead submission, agent enrollment) is still in `src/` and still talks to Google Apps Script. Original backend: `backend/Code.gs`, tab structure in `README.md`.
- Tested locally with `npx wrangler@4 dev --local` and a local D1. Not deployed. The live Vercel site is untouched.

## Owner to-do (not done yet)
1. Merge PR #1 once reviewed.
2. Invite the coder (Write access) and enable branch protection on `main`.
3. Add `lifesaverselite.com` to Cloudflare; change Namecheap nameservers. Set up Cloudflare Email Routing first if using Namecheap email forwarding for `info@lifesaverselite.com`.
4. `wrangler d1 create`, put the id in `wrangler.jsonc`, apply migrations with `--remote`.
5. Create Resend account, verify the domain, `wrangler secret put RESEND_API_KEY`.
6. `npx wrangler deploy`; connect the GitHub repo in Cloudflare Workers Builds for auto-deploy.
7. Set up Stripe products and webhook; `wrangler secret put STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY`.
8. Cutover: uncomment `routes`, deploy, remove the domain from Vercel.

## Next to build (suggested order)
1. **Auth:** login and sessions on the Worker (hashed passwords, session cookies, roles LIFESAVER / AGENT / ADMIN).
2. Port the dashboard endpoints from `backend/Code.gs` (`getLSData`, `getAgentLeads`, `getAdminLeads`, lead accept/decline/claim, etc.) to the Worker and D1. Move the React app under `/app` and restyle it to match the prototype.
3. Script to import existing Google Sheet data into D1.
4. Stripe event handling (subscriptions, top-ups -> `transactions`).
5. Phase 2: scheduled automations and Claude-powered agents (lead qualification, applicant screening, follow-ups).

## Environment note for Claude sessions
Cloud sessions have restricted network access. The environment named `lifesaverselite` allows `lifesaverselite.vercel.app` and `lifesavers-elite.reverendqs.workers.dev`. A new session may need these hosts allowed again and the repo attached. Wrangler runs via `npx wrangler@4` (it is intentionally not in `package.json`, so Vercel's build is unaffected).

## Business context from the code
- Referral network. LifeSavers submit leads; agents/brokers buy and accept them. Leads expire after 48 hours and return to a pool. Admin reviews applications and revenue.
- Admin notification address and Cal.com booking link are in `wrangler.jsonc`.
