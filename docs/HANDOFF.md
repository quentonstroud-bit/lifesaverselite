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
- **ASSUMPTION - confirm:** the $500 Supreme bonus is paid to each month's Supreme. It is only banked if you create a monthly time trigger for `awardSupremeMonthly` (runs on the 1st, idempotent). Nothing is paid until that trigger exists.
- Non-cash perks (swag, plaques, gift boxes, features) are fulfilled manually by the operator.
- Old tier names (`Star 1`...`Star 5 Elite`), the badge "Reach Star 5 Elite tier", and the landing page copy "Five earning tiers" still exist and conflict with this model. Replace them.

### How purchasing works in code
1. Agent clicks **Buy** on a lead in Leads (assigned LifeSavers) or Pool -> browser calls `POST /api/checkout` with only `{ leadId, agentEmail }`.
2. `api/checkout.js` asks Apps Script `?query=lead_quote` (shared secret `SERVER_KEY`) for the price, which is computed from the stored star rating. It creates a Stripe Checkout Session with two line items (lead price, $5 service fee). The browser can never choose the amount.
3. Agent pays on Stripe. Stripe calls `POST /api/webhook` (signature verified). The function reads the real Stripe fee and calls Apps Script `payment_complete`.
4. Apps Script (under a lock, idempotent per Stripe session) re-checks the amount, marks the lead `ACCEPTED`, writes `LSE_FEE`, `LIFESAVER_PAYOUT`, `STRIPE_FEE` ledger rows, and **emails the agent the full contact details** and the LifeSaver the earnings.
5. If two agents pay for the same lead, or the amount is wrong, the lead is NOT unlocked: a `NEEDS_REFUND` ledger row is written and the admin is emailed to refund in Stripe.
6. 1-star leads cost $0: `lead_accept` / `claim_from_pool` unlock them directly and refuse paid leads (HTTP 402).

Why contact details are emailed rather than shown in-app: login is email-only (Section 8), so an in-app "show contact" endpoint would let anyone who knows an agent's email read customer phone numbers. Add one only after real authentication exists.

### Setup required before this works (none of it is done yet)
**Apps Script** (Project Settings > Script properties): `SERVER_KEY` = a long random string. Optional `ADMIN_API_KEY` for the manual rating override. Then paste the new `Code.gs`, **Deploy > New version**. Optionally add a monthly trigger for `awardSupremeMonthly`.
**Stripe** (start in Test mode): copy the secret key; create a webhook endpoint `https://<your-domain>/api/webhook` for event `checkout.session.completed` and copy its signing secret.
**Vercel** env vars (server-side, no `VITE_` prefix): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SERVER_KEY` (same value as Apps Script), `SITE_URL` (e.g. `https://app.lifesaverselite.com`); `VITE_WEBAPP_URL` as before. Redeploy. See `.env.example`. **Never paste Stripe keys into chat, code, or git.**
Test with Stripe test card `4242 4242 4242 4242`, then check the `Transactions` sheet for three rows.

### Domain plan (decided)
`app.lifesaverselite.com` = this React app (Vercel). The existing static site stays on `lifesaverselite.com` (Cloudflare Workers) as the marketing front. DNS lives at Cloudflare: CNAME `app` -> the target Vercel shows, **DNS only (grey cloud)**. Before moving nameservers, screenshot the existing DNS records and keep all MX/TXT records (email). The static site's Login/Apply buttons must link to `https://app.lifesaverselite.com/login` and `/apply` (that site's source is not in this repo).

### Remaining gaps / known limits
- No automated weekly payout run yet: earnings are banked in the ledger (`LIFESAVER_PAYOUT`, `LEVEL_BONUS`) and the LifeSaver dashboard shows them. A Sunday payout report/CSV for the admin is the next piece; Stripe Connect automation is a later phase.
- The Admin "override star rating" action now returns 403 (the old endpoint let anyone change a lead's price). Re-enable it after admin authentication is built.
- Admin password hardcoded in the client bundle, unauthenticated GET endpoints and email-only login remain (Section 8). These matter more now that real money moves.
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
