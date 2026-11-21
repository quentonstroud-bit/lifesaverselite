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
backend/Code.gs                  entire backend (~1100 lines)
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

## 5. Auth Model

- **Admin:** credentials are hardcoded in `src/context/AuthContext.jsx` (email `reverendqs@gmail.com`). **See Security, Section 8.**
- **LifeSaver / Agent:** email-only lookup. Frontend calls `GET ?query=validate_login&email=...`; backend matches the `Users` sheet and returns `{status, role, ...}`. No password.
- Session is stored in `localStorage['lse_user']`. `icSigned` and `trainingComplete` are client-side flags only (reset to `false` on every login).
- New agents are auto-logged-in after enrollment via `loginDirect`.
- Approving a LifeSaver is **manual**: add the row to the `Users` sheet (`approve_lifesaver` only returns a note).

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
| `VITE_WEBAPP_URL` | env var read by every page and AuthContext | Set in Vercel (Production + Preview) and a local `.env` (git-ignored). **If empty, the app shows "Backend not configured" and forms fail.** Replaces the old `PASTE_YOUR_WEBAPP_URL_HERE` placeholders (none remain in `src/`). |
| `SPREADSHEET_ID` | `backend/Code.gs` | Currently set to the live sheet. |
| Apps Script deploy | Editor: Deploy > Web App, Execute as **Me**, Access **Anyone** | After editing Code.gs you must **re-deploy a new version** (Manage deployments > edit > New version) or the live URL keeps serving old code. |
| Frontend deploy | Vercel from this repo; `npm run build` -> `dist/` | `vercel.json` handles SPA routing. |

Local dev:

```bash
npm install
echo "VITE_WEBAPP_URL=<your /exec url>" > .env
npm run dev        # http://localhost:5173
npm run build
```

Gotchas learned the hard way (see git history):
- **Code.gs must be pure ASCII.** Non-ASCII characters caused Apps Script syntax errors (`c88a3bd`).
- **CORS:** POSTs to Apps Script must avoid a preflight (`1c28864`). Keep the existing fetch pattern when adding new calls; don't add custom headers.
- Apps Script redeploys can change nothing if you only "Save" - always deploy a new version.

## 8. Security - Action Items

1. **Hardcoded admin password in `src/context/AuthContext.jsx` ships in the public JS bundle.** Anyone can read it. Rotate it now (it is also in git history), then move admin auth server-side (e.g. check against an Apps Script property with a signed session token) or at minimum remove the literal from the client.
2. **GET endpoints are unauthenticated.** `admin_*`, `agent_*`, and `ls_data` return data to anyone who knows the URL and parameters. Add a token check in `doGet` before launch.
3. `validate_login` is email-only; anyone knowing an email can log in as that user.
4. `SPREADSHEET_ID` and `ADMIN_EMAIL` are in the repo - fine for an ID, but treat the sheet's sharing settings as the real protection.
5. Never commit Stripe secret keys. `STRIPE_SECRET_KEY` belongs only in a server-side store (Apps Script Script Properties), never `src/`.

## 9. Status

**Working:** public site, LifeSaver application, agent enrollment, role dashboards backed by real Sheets data (filler data removed), referral submit/accept/decline/rating, pool claiming, six email types, training + IC agreement flow, Vercel SPA routing, OG image.

**Not built / stubbed:**
- **Stripe is not integrated.** No Stripe code exists; only UI copy ("Charged every Sunday via Stripe", "Pay $X via Stripe" button in `AgentSettings.jsx`, "Stripe Settlements" panel in `AdminRevenue.jsx`). README Step 3 describes the intended products (weekly $50/$100/$250/$500/$1000 plans + one-time top-up links).
- LifeSaver approval is manual (Users sheet).
- `icSigned` / `trainingComplete` are not persisted server-side.
- No automated tests, no CI.

## 9A. Commerce & Rewards Spec (owner-defined 2026-11-21; NOT yet implemented)

This is the agreed business model. Code must match it. Current code still uses the old
$2.00 fee and a browser-supplied payout (see "Gaps" below).

### Lead purchase flow
1. A LifeSaver submits a referral (lead). Admin assigns a **star rating 1-5**.
2. Each Agent has LifeSavers assigned to them. When a lead arrives, the Agent may buy it via a **shopping cart** (Stripe Checkout) and it then unlocks into their Lead Center.
3. Charge = **lead price + LSE service fee**. Agent total below.

| Rating | Lead price | LSE fee | Agent pays | Notes |
|---|---|---|---|---|
| 1 star | $0 | $0 | $0 | Free unlock, no Stripe charge, LifeSaver earns $0 |
| 2-5 stars | $5 | $5 | $10 | Same price for every star from 2 up |

4. **LifeSaver earns** the lead price ($5) **minus Stripe processing fees** (LifeSaver bears the Stripe fee). LSE keeps the full $5 fee.
5. LifeSaver commissions are **banked** in the ledger and paid out **weekly (Sunday)**.
6. Price is computed **server-side only** from the rating. Never trust an amount from the browser.

Open detail: Stripe fee is ~2.9% + $0.30 of the whole $10 charge (about $0.59), so the LifeSaver would net about $4.41 per lead. Confirm this is the intended calculation (vs. prorating the fee to the $5 lead price only).

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
| Supreme | 500+ ("there can be only one") | $500 | Luxury gift/experience, mastermind group; featured on all channels/newsletters, interview/testimonial, VIP event access, plaque/custom award, Supreme badge |

Cash bonuses are banked into the same weekly payout. Non-cash perks are fulfilled manually by the operator (track in Admin).

### Open questions (decide before building levels)
- **What counts toward a level:** leads *submitted*, leads *accepted/purchased*, or leads rated 2+ stars? (Recommend: purchased leads, so levels can't be inflated with junk.)
- **Supreme "only one":** does it go to the first LifeSaver to hit 500, or the current top LifeSaver (can be taken over)?
- The existing `Star 1`...`Star 5 Elite` tier names, the `stars * 6` earnings display, and the "Five earning tiers" copy on the landing page conflict with this spec and must be replaced.

### Gaps in current code to fix as part of this work
- `PLATFORM_FEE = 2.00` in `backend/Code.gs` and `-$2.00` in `AgentLeads.jsx` / `AgentPool.jsx` -> must be $5 and rating-driven.
- `lead_accept` / `claim_from_pool` store `d.lifesaverPayout` sent by the browser -> compute server-side.
- `lead_rating` POST has no authorization -> anyone can set stars (and therefore price). Restrict to admin.
- No Stripe code exists. Plan: Vercel `api/` functions (`checkout`, `webhook` with signature verification). Secret keys only in Vercel env vars; build in Stripe **test mode** first.
- Weekly payout is a ledger + report first (manual/batched); Stripe Connect automation is a later phase.

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
