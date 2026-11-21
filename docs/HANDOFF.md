# LifeSavers Elite - MasterKey Handoff

> **This is the single source of truth for the repo.** Read it first, update it whenever
> architecture, config, routes, or backend contracts change. If another doc disagrees with
> this one, this one wins (or fix it). Last verified against code: 2026-11-18.

---

## 1. What This Is

LifeSavers Elite (LSE) is a referral network platform:

- **LifeSavers** (referrers) submit life-insurance leads and earn when an agent accepts them.
- **Agents / Brokers** buy/accept leads from their LifeSavers and from a shared pool, on a weekly budget.
- **Admin** (operator: Quenton Stroud) oversees applications, leads, agents, revenue.

Tagline: **Refer. Earn. Protect.**

## 2. Architecture

```
Browser (React SPA, Vite, Tailwind)  --fetch-->  Google Apps Script Web App (backend/Code.gs)
        hosted on Vercel                              |-- Google Sheets (database)
                                                      '-- MailApp / Gmail (email)
Stripe: payments (NOT yet wired into code - see Section 9)
```

| Layer | Tech | Location |
|---|---|---|
| Frontend | React 18, React Router v6, Tailwind 3, Vite 5, lucide-react | `src/` |
| Backend | Google Apps Script `doGet` / `doPost` Web App | `backend/Code.gs` (paste into Apps Script editor; **not** auto-deployed from git) |
| Database | Google Sheets (spreadsheet ID in `Code.gs` `SPREADSHEET_ID`) | external |
| Email | `MailApp.sendEmail`, branded navy + red, signed Quenton Stroud | `Code.gs` |
| Hosting | Vercel, SPA rewrite in `vercel.json` | external |

## 3. Repo Map

```
backend/Code.gs                  entire backend (paste into Apps Script; ~1900 lines)
api/                             Vercel serverless functions: gw (gateway), auth/*, checkout, webhook, _lib/*
src/lib/                         api.js (gateway client), purchase.js, leadScore.js (live quality meter; mirrors Code.gs scoring)
src/main.jsx, App.jsx            entry + routes + ProtectedRoute
src/context/AuthContext.jsx      login, session (localStorage key `lse_user`), IC/training flags
src/components/                  Nav, Footer, BottomNav, StarRating, ICAgreementModal
src/pages/                       Landing, Apply, AgentEnroll, Login
src/pages/dashboard/             LifeSaverDashboard, AgentDashboard, AdminDashboard, Training
  lifesaver/  LSHome LSSubmit LSReferrals LSEarnings LSStars LSProfile
  agent/      AgentLeads AgentSpend AgentPool AgentLifeSavers AgentSettings
  admin/      AdminOverview AdminLeads AdminLifeSavers AdminAgents AdminRevenue AdminSettings
public/                          favicon, og-image (PNG is what Facebook uses)
vercel.json                      SPA rewrite -> /index.html
README.md                        step-by-step setup guide (partly stale, see Section 10)
docs/HANDOFF.md                  this file
```

## 4. Routes (`src/App.jsx`)

| Path | Access | Page |
|---|---|---|
| `/` | public | Landing |
| `/apply` | public | LifeSaver application |
| `/agents/enroll` | public | Agent/Broker enrollment (multi-page) |
| `/login` | public | Login |
| `/dashboard/lifesaver/*` | role `lifesaver` | LifeSaverDashboard (tabs) |
| `/dashboard/lifesaver/training` | role `lifesaver` | Training (5 modules + certificate) |
| `/dashboard/agent/*` | role `agent` | AgentDashboard |
| `/dashboard/admin/*` | role `admin` | AdminDashboard |
| `*` | - | redirect to `/` |

Post-application success redirects to Training Modules (not Cal.com).

## 5. Auth Model (rebuilt 2026-11-21)

**Sign-in = email magic link OR password.** Both end in the same thing: a signed, HttpOnly, Secure, SameSite=Lax session cookie (`lse_session`, 7 days; admin 12 hours). Nothing secret lives in the browser bundle any more.

- **Magic link:** `/login` -> `POST /api/auth/request-link` emails a single-use link (15 min) via Apps Script. The link opens `/auth/verify?token=...`; the user clicks **Sign In** (a deliberate click, so email scanners that pre-fetch links cannot burn the token) -> `POST /api/auth/verify` consumes the token and sets the cookie. The endpoint answers identically whether or not the email has an account.
- **Password (optional):** set under Settings/Profile (`POST /api/auth/set-password`, 10+ chars). Stored only as a salted **scrypt** hash in the `Credentials` sheet (auto-created). `POST /api/auth/login` throttles 8 tries / 15 min per email (30 per IP) and gives one generic error.
- **Who can sign in:** unchanged rules, now with proof of email ownership: admin = emails in Script Property `ADMIN_EMAILS` (default `reverendqs@gmail.com`); agents = anyone in `Agent_Broker_Applications`; LifeSavers = `Users` sheet (approved) or `LifeSaver_Applications` (pending, `Pending Activation`, training only - they cannot submit referrals until approved).
- **No more hardcoded admin password.** Admin signs in by magic link to the admin email (and may set a password in Settings).
- **After applying/enrolling,** the applicant is emailed a sign-in link automatically (replaces the old generated plaintext password, which was also being stored in the sheet - removed).
- Training/IC-agreement completion flags are a per-email convenience in the browser's localStorage, not a security control.

### The gateway (the key security change)
The browser **never calls Google Apps Script directly any more.** Every data call goes `browser -> POST /api/gw -> Apps Script`, and every Apps Script endpoint now requires the shared `SERVER_KEY` (direct calls get 403). `api/gw.js`:
- checks the session cookie and re-reads the user's role from the Sheet on every call;
- has an allow-list of GET queries and POST form types, each tied to a role (agent / lifesaver / admin; only the two application forms are public, rate-limited per IP);
- **injects identity from the session** (email, LifeSaver id/handle) and forwards only whitelisted fields, so a caller cannot read someone else's data, submit as another LifeSaver, or set their own stars/price;
- enforces same-origin + JSON for state-changing calls.
`payment_complete` is deliberately NOT reachable through the gateway (Stripe webhook only).

Local dev: the `/api` functions need `vercel dev` (plain `npm run dev` serves only the frontend).

## 6. Backend Contract (`backend/Code.gs`)

Base URL = Apps Script Web App `/exec` URL, supplied to the frontend as `VITE_WEBAPP_URL`.

**Config constants (top of Code.gs):** `SPREADSHEET_ID`, `ADMIN_EMAIL` (`qcandoit@gmail.com` - receives alerts), `CAL_URL`, `SIGN_OFF`, `PLATFORM_FEE = 2.00` (LSE fee per lead).

**GET `?query=`**

| query | handler | used by |
|---|---|---|
| `validate_login` | validateLogin | AuthContext |
| `ls_data` | getLSData | LifeSaver dashboard |
| `agent_leads` / `agent_lifesavers` / `agent_spend` / `pool_leads` | agent handlers | Agent dashboard |
| `admin_lifesavers` / `admin_agents` / `admin_leads` / `admin_revenue` / `dashboard_stats` | admin handlers | Admin dashboard |

**POST** (JSON body, discriminated by `formType`)

| formType | Effect |
|---|---|
| `application` | Append to `LifeSaver_Applications`; email applicant + admin |
| `agent_enrollment` | Append to `Agent_Broker_Applications`; email admin |
| `referral_submit` | Create Leads row; email LifeSaver + assigned agent; sets Expiry |
| `lead_rating` | Star rating on a lead |
| `lead_accept` | Mark accepted; write Transactions; email LifeSaver |
| `lead_decline` | Mark declined; email LifeSaver |
| `claim_from_pool` | Agent claims a pool lead |
| `approve_lifesaver` | No-op note (manual Users row) |

**Time trigger (must be created by hand):** `autoDeclineExpiredLeads`, hourly.

**Sheet tabs & columns** (exact names matter):

| Tab | Columns |
|---|---|
| `LifeSaver_Applications` | Timestamp, Name, Email, Phone, Facebook (labelled "Main Social Media" in UI), Positions, Employment, Insurance, Referral, Excites, Resume |
| `Agent_Broker_Applications` | Timestamp, Name, Agency, Email, Phone, License, States, Years, Lines, PayoutStructure, HearAbout, PaymentMethod |
| `Leads` | LeadID, Timestamp, LeadName, Phone, Email, City, State, Age, Beneficiaries, HealthRating, Smoking, PolicyInterest, Timeline, Notes, LifeSaverID, LifeSaverHandle, Status, StarRating, Expiry, LSEFee, PoolSource |
| `Transactions` | Timestamp, LeadID, AgentID, Type, Amount, LifeSaverID, Source |
| `Users` | UserID, Name, Role, Email, Status, Tier, AssignedAgentEmail |

> Verify against the sheet if you change columns - the code reads by position/header; keep them in sync.

## 7. Config, Env & Deploy

| Item | Where | Notes |
|---|---|---|
| `WEBAPP_URL` | **server-side** env var (Vercel) used by `/api/*` | The Apps Script `/exec` URL. The browser no longer needs it, so `VITE_WEBAPP_URL` is obsolete. |
| `SERVER_KEY`, `SESSION_SECRET`, `SITE_URL`, `STRIPE_*` | Vercel env vars (server-side) | `SERVER_KEY` must match the Apps Script property. `SESSION_SECRET` = long random string (rotating it signs everyone out). See `.env.example`. |
| `SPREADSHEET_ID` | `backend/Code.gs` | Currently set to the live sheet. |
| Apps Script deploy | Editor: Deploy > Web App, Execute as **Me**, Access **Anyone** | After editing Code.gs you must **re-deploy a new version** (Manage deployments > edit > New version) or the live URL keeps serving old code. |
| Frontend deploy | Vercel from this repo; `npm run build` -> `dist/` | `vercel.json` handles SPA routing. |

Local dev:

```bash
npm install
cp .env.example .env   # fill in server-side values
npx vercel dev     # runs the frontend AND /api functions
npm run build
```

Gotchas learned the hard way (see git history):
- **Code.gs must be pure ASCII.** Non-ASCII characters caused Apps Script syntax errors (`c88a3bd`).
- **CORS:** POSTs to Apps Script must avoid a preflight (`1c28864`). Keep the existing fetch pattern when adding new calls; don't add custom headers.
- Apps Script redeploys can change nothing if you only "Save" - always deploy a new version.

## 8. Security

**Fixed 2026-11-21:** hardcoded admin password removed; email-only login replaced by magic link/password; Apps Script endpoints locked behind `SERVER_KEY` and an authenticated, role-checked, identity-injecting gateway; plaintext agent passwords no longer generated or stored; lead decline restricted to the assigned agent; prices/payouts/ratings computed server-side.

**Still to do:**
1. **Rotate the old admin password** wherever else it was used - it is in git history and in earlier public bundles.
2. Deploy order matters: set `SERVER_KEY` + `SESSION_SECRET` + `WEBAPP_URL` in Vercel and `SERVER_KEY` in Apps Script BEFORE pasting the new `Code.gs`, or the live site will 403.
3. Magic-link email is sent by Apps Script `MailApp` (about 100 emails/day on a free Gmail, 1,500 on Workspace). Move to a transactional email service (Resend/Postmark) if volume grows.
4. Treat the Apps Script URL + `SERVER_KEY` as secrets; keep the Sheet's sharing locked down.
5. Never commit Stripe keys. They belong only in Vercel env vars.

## 9. Status

**Working:** public site, LifeSaver application, agent enrollment, role dashboards backed by real Sheets data (filler data removed), referral submit/accept/decline/rating, pool claiming, six email types, training + IC agreement flow, Vercel SPA routing, OG image.

**Not built / stubbed:**
- **Stripe is not integrated.** No Stripe code exists; only UI copy ("Charged every Sunday via Stripe", "Pay $X via Stripe" button in `AgentSettings.jsx`, "Stripe Settlements" panel in `AdminRevenue.jsx`). README Step 3 describes the intended products (weekly $50/$100/$250/$500/$1000 plans + one-time top-up links).
- LifeSaver approval is manual (Users sheet).
- `icSigned` / `trainingComplete` are not persisted server-side.
- No automated tests, no CI.

## 9A. Commerce & Rewards (owner-defined 2026-11-21; implemented in code, Stripe in TEST mode only until set up)

This is the agreed business model and the code implements it. Source of truth for the numbers is the
config block at the top of `backend/Code.gs` (`PRICE_BY_STARS`, `LEAD_FEE`, `STAR_THRESHOLDS`, `LEVELS`).

### Lead purchase flow
1. A LifeSaver submits a referral (lead). The backend **scores the form automatically** into a 1-5 star rating (see Star scoring below). Nobody can set it by hand.
2. Each Agent has LifeSavers assigned to them. When a lead arrives, the Agent may buy it via a **shopping cart** (Stripe Checkout) and it then unlocks into their Lead Center.
3. Charge = **lead price + LSE service fee**. Agent total below.

| Rating | Lead price | LSE fee | Agent pays | Notes |
|---|---|---|---|---|
| 1 star | $0 | $0 | $0 | Free unlock, no Stripe charge, LifeSaver earns $0 |
| 2 stars | $5 | $5 | $10 | |
| 3 stars | $18 | $5 | $23 | |
| 4 stars | $24 | $5 | $29 | |
| 5 stars | $30 | $5 | $35 | |

4. **LifeSaver earns** the lead price (per table) **minus Stripe processing fees** (LifeSaver bears the Stripe fee). LSE keeps the full $5 fee.
5. LifeSaver commissions are **banked** in the ledger and paid out **weekly (Sunday)**.
6. Price is computed **server-side only** from the rating. Never trust an amount from the browser.

**Decided:** the Stripe processing fee is taken from the **whole charge** (lead price + $5 fee) and borne by the LifeSaver.
Example 5-star: agent pays $35.00, Stripe fee about $1.20, LSE keeps $5.00, LifeSaver banks $30.00 - $1.20 = $28.80.
The real fee is read from Stripe after payment; the backend only estimates (2.9% + $0.30) if Stripe cannot be reached.

### Star scoring (computed from the referral form, 0-100 points)

| Field | Points |
|---|---|
| Phone (10+ digits) | 10 |
| Valid email | 5 |
| City and state | 5 |
| Beneficiaries | 2+ = 15, 1 = 10, 0 = 0 |
| Health rating | 7+ = 10, 4-6 = 5 |
| Smoking | Non-smoker 10, Former 6, Smoker 3 |
| Policy interest | Specific policy 15, "Other / Not sure" 3 |
| Purchase timeline | 1-3 months 20, 3-6 months 12, 6-12 months 6, just exploring 0 |
| Notes | 100+ chars 10, 30+ chars 6, any 3 |

Stars: 85+ = 5, 70+ = 4, 55+ = 3, 45+ = 2, below 45 = 1. **These thresholds are a first draft - tune `STAR_THRESHOLDS` and `scoreLead()` in `Code.gs` after looking at real leads.** Leads submitted before auto-scoring are scored the same way on the fly.

### 5-star rating definitions (shown to admins and LifeSavers)
- **5 - Top quality:** ready to buy in 1-3 months, beneficiaries listed, responsive, wants a specific policy, ready for consultation/quote.
- **4 - Good:** somewhat engaged, needs nurturing; minor hesitation (policy type unsure or beneficiaries not final).
- **3 - Medium:** some interest, not committed; needs info/reassurance; comparing options.
- **2 - Low:** very early research stage, not ready to engage, loosely interested.
- **1 - Lowest:** may not meet basic qualification (no beneficiaries, unsure about policy, unresponsive); needs heavy follow-up.

### LifeSaver levels (by lead count)

| Level | Leads | One-time cash bonus | Other perks |
|---|---|---|---|
| Supporter | 0-24 | none | - |
| Steward | 25-59 | $50 | Branded swag (T-shirt, bottle, etc.), personalized thank-you note |
| Specialist | 60-99 | $100 | Priority access to future training/coaching, lead-sharing toolkit |
| Sentinel | 100+ | $250 | VIP gift box, priority support / 1:1 coaching; featured social post, event mention, possible case study, digital badge + certificate, plaque/trophy |
| Supreme | 500+ lifetime; title held by the month's top LifeSaver | $500 (assumed per month held) | Luxury gift/experience, mastermind group; featured on all channels/newsletters, interview/testimonial, VIP event access, plaque/custom award, Supreme badge |

Cash bonuses are banked into the same weekly payout. Non-cash perks are fulfilled manually by the operator (track in Admin).

### Level rules (decided)
- **What counts:** leads a LifeSaver has submitted that were auto-rated **2 stars or higher** (quantity of qualifying leads). 1-star leads do not count.
- **Cash bonuses** (Steward $50, Specialist $100, Sentinel $250) are one-time, written to the `Transactions` ledger as `LEVEL_BONUS` the moment the threshold is crossed, and paid in the weekly payout.
- **Supreme** is **monthly and can change hands**: among LifeSavers with 500+ lifetime qualifying leads, whoever submitted the most qualifying leads in the calendar month is that month's Supreme (`getMonthlySupreme`). The LifeSaver home screen shows "Supreme" for the current holder.
- **Supreme bonus is one-time per LifeSaver, ever (decided).** `awardSupremeMonthly` runs on the 1st for the month just ended, banks $500 (`LEVEL_BONUS`, source `SUPREME:YYYY-MM`) only if that month's Supreme has never received it, and is idempotent. The title still rotates every month; a repeat holder simply is not paid again (it does not pass to the runner-up). Run `installMonthlyTriggers()` once in the Apps Script editor to schedule it (and the hourly auto-decline).
- Non-cash perks (swag, plaques, gift boxes, features) are fulfilled manually by the operator.
- The landing page's 1-5 star cards are the star rating system and stay. Level names are **revealed during onboarding** (Training, after the Compensation module) and are not shown publicly. The `LSStars.jsx` badge "Reach Star 5 Elite tier" still uses the old tier name and should be reworded.

### How purchasing works in code
1. Agent clicks **Buy** on a lead in Leads (assigned LifeSavers) or Pool -> browser calls `POST /api/checkout` with only `{ leadId, agentEmail }`.
2. `api/checkout.js` asks Apps Script `?query=lead_quote` (shared secret `SERVER_KEY`) for the price, which is computed from the stored star rating. It creates a Stripe Checkout Session with two line items (lead price, $5 service fee). The browser can never choose the amount.
3. Agent pays on Stripe. Stripe calls `POST /api/webhook` (signature verified). The function reads the real Stripe fee and calls Apps Script `payment_complete`.
4. Apps Script (under a lock, idempotent per Stripe session) re-checks the amount, marks the lead `ACCEPTED`, writes `LSE_FEE`, `LIFESAVER_PAYOUT`, `STRIPE_FEE` ledger rows, and **emails the agent the full contact details** and the LifeSaver the earnings.
5. If two agents pay for the same lead, or the amount is wrong, the lead is NOT unlocked: a `NEEDS_REFUND` ledger row is written and the admin is emailed to refund in Stripe.
6. 1-star leads cost $0: `lead_accept` / `claim_from_pool` unlock them directly and refuse paid leads (HTTP 402).

Why contact details are emailed rather than shown in-app: login is email-only (Section 8), so an in-app "show contact" endpoint would let anyone who knows an agent's email read customer phone numbers. Add one only after real authentication exists.

### Setup required before this works (none of it is done yet)
**Apps Script** (Project Settings > Script properties): `SERVER_KEY` = a long random string (same value as Vercel). Optional `ADMIN_EMAILS` (comma list; defaults to `reverendqs@gmail.com`). Then paste the new `Code.gs`, **Deploy > New version**, and run `installMonthlyTriggers()` once.
**Stripe** (start in Test mode): copy the secret key; create a webhook endpoint `https://<your-domain>/api/webhook` for event `checkout.session.completed` and copy its signing secret.
**Vercel** env vars (server-side, no `VITE_` prefix): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SERVER_KEY` (same value as Apps Script), `SESSION_SECRET` (new long random string), `SITE_URL` (e.g. `https://app.lifesaverselite.com`), `WEBAPP_URL` (the Apps Script `/exec` URL). Redeploy. See `.env.example`. **Never paste Stripe keys into chat, code, or git.**
Test with Stripe test card `4242 4242 4242 4242`, then check the `Transactions` sheet for three rows.

### Domain plan (decided)
`app.lifesaverselite.com` = this React app (Vercel). The existing static site stays on `lifesaverselite.com` (Cloudflare Workers) as the marketing front. DNS lives at Cloudflare: CNAME `app` -> the target Vercel shows, **DNS only (grey cloud)**. Before moving nameservers, screenshot the existing DNS records and keep all MX/TXT records (email). The static site's Login/Apply buttons must link to `https://app.lifesaverselite.com/login` and `/apply` (that site's source is not in this repo).

### Payroll report (Admin > Revenue > LifeSaver Payroll)
Owed to a LifeSaver = `LIFESAVER_PAYOUT` + `LEVEL_BONUS` rows earned up to a cutoff, minus rows already marked `PAYOUT_PAID`. The report lists who is owed what, downloads as **CSV** (formula-injection safe), and **Mark all paid** records the batch. Marking is guarded: it refuses if totals changed since you opened the report (409), is idempotent per batch id, and requires a confirm dialog. Workflow: open report -> Download CSV -> send the money -> Mark all paid. Payment method per LifeSaver is not stored yet (add a payout-method field to the application/profile when you choose a payout rail).

### Remaining gaps / known limits
- Payouts are a manual weekly run from the payroll report. Stripe Connect automation is a later phase.
- The Admin "override star rating" action works again, but only through the authenticated admin gateway.
- **Agent Agreement text still says "$2.00 per accepted lead"** (`AgentEnroll.jsx`, three places) and the Agent Settings "top up balance" screen predates the per-lead cart. These are contract/pricing terms: the owner must supply the final wording before real money is charged.
- The payout recorded for a lead is `max(0, lead price - Stripe fee)`; on a $5 (2-star) lead the LifeSaver nets about $4.41.

## 10. Known Doc Drift (README.md)

- README mentions `PASTE_*` placeholders; the code now uses `VITE_WEBAPP_URL` and a real `SPREADSHEET_ID`.
- README says admin email `qcandoit@gmail.com` for alerts (correct for backend) but the **admin login** is `reverendqs@gmail.com`.
- README says Login has a demo role selector; real login is now email lookup + hardcoded admin.

## 11. Contacts & Links

- Operator: Quenton Stroud, Executive Manager. Alerts inbox: `qcandoit@gmail.com`. Admin login account: `reverendqs@gmail.com`.
- Booking: https://cal.com/quenton-stroud/30min
- Domain target: `ao-gp.org` (per README).

## 12. Conventions for Future Work

- Update **this file** in the same commit as any change to routes, sheet columns, backend actions, env vars, or auth.
- Branding: dark navy + brand red `#C01428`, white text on red.
- Keep `Code.gs` ASCII-only; keep a hand-copied deploy step in mind (git is not the deploy).
- Commit style: `feat:`, `fix:` prefixes.
