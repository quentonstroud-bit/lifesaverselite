# LifeSavers Elite

Full-stack referral network platform. React + Tailwind frontend. Google Apps Script backend. Stripe payments.

---

## Tech Stack

- **Frontend:** React 18, React Router v6, Tailwind CSS, Vite
- **Backend:** Google Apps Script (doPost Web App)
- **Payments:** Stripe (recurring weekly subscriptions + one-time top-up links)
- **Database:** Google Sheets
- **Email:** Gmail via MailApp (Google Apps Script)

---

## Placeholder Keys

Before going live, replace every placeholder in the codebase:

| Placeholder | Where | What to paste |
|---|---|---|
| `PASTE_YOUR_WEBAPP_URL_HERE` | `src/pages/Apply.jsx`, `src/pages/AgentEnroll.jsx`, `src/pages/dashboard/lifesaver/LSSubmit.jsx` | Your deployed Apps Script Web App URL |
| `PASTE_YOUR_SPREADSHEET_ID_HERE` | `backend/Code.gs` | Your Google Sheet ID (from the URL) |
| `STRIPE_SECRET_KEY_HERE` | Your server/webhook handler | Stripe secret key from dashboard |
| `STRIPE_PUBLISHABLE_KEY_HERE` | Frontend Stripe.js init | Stripe publishable key from dashboard |

---

## Step 1 - Set Up Google Sheets

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it **LifeSavers Elite**.
3. Copy the Spreadsheet ID from the URL bar:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
4. Create the following tabs (click the + at the bottom to add sheets):

| Tab Name | Column Headers |
|---|---|
| `LifeSaver_Applications` | Timestamp, Name, Email, Phone, Facebook, Positions, Employment, Insurance, Referral, Excites, Resume |
| `Agent_Broker_Applications` | Timestamp, Name, Agency, Email, Phone, License, States, Years, Lines, PayoutStructure, HearAbout, PaymentMethod |
| `Leads` | LeadID, Timestamp, LeadName, Phone, Email, City, State, Age, Beneficiaries, HealthRating, Smoking, PolicyInterest, Timeline, Notes, LifeSaverID, LifeSaverHandle, Status, StarRating, Expiry, LSEFee, PoolSource |
| `Transactions` | Timestamp, LeadID, AgentID, Type, Amount, LifeSaverID, Source |
| `Users` | UserID, Name, Role, Email, Status, Tier, AssignedAgentEmail |

---

## Step 2 - Deploy Google Apps Script

1. Open your Google Sheet.
2. Click **Extensions > Apps Script**.
3. Delete the default `myFunction` code.
4. Copy the full contents of `backend/Code.gs` and paste it into the editor.
5. Replace `PASTE_YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID.
6. Click **Deploy > New Deployment**.
7. Select type: **Web App**.
8. Set **Execute as:** Me.
9. Set **Who has access:** Anyone.
10. Click **Deploy** and authorize permissions.
11. Copy the Web App URL that appears. It will look like:
    `https://script.google.com/macros/s/AKfyc.../exec`
12. Paste this URL into every file that has `PASTE_YOUR_WEBAPP_URL_HERE`.

### Set Up the Auto-Decline Trigger

1. In the Apps Script editor, click the **clock icon** (Triggers) in the left sidebar.
2. Click **Add Trigger**.
3. Function: `autoDeclineExpiredLeads`
4. Event source: Time-driven
5. Type: Hour timer
6. Every: 1 hour
7. Save.

---

## Step 3 - Set Up Stripe

### Weekly Recurring Subscription Products

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Click **Products > Add Product**.
3. Create one product per budget tier:

| Product Name | Price | Billing |
|---|---|---|
| LSE Budget - $50/week | $50.00 | Recurring, weekly |
| LSE Budget - $100/week | $100.00 | Recurring, weekly |
| LSE Budget - $250/week | $250.00 | Recurring, weekly |
| LSE Budget - $500/week | $500.00 | Recurring, weekly |
| LSE Budget - $1,000/week | $1,000.00 | Recurring, weekly |

4. Copy each product's **Price ID** (starts with `price_`) and store them.

### One-Time Top-Up Payment Link

1. In Stripe, go to **Payment Links > Create payment link**.
2. Set as a one-time payment with a custom amount (or create fixed top-up amounts: $50, $100, $250).
3. Copy the payment link URL.

### Add API Keys

1. In your Stripe dashboard, go to **Developers > API Keys**.
2. Copy your **Publishable key** (starts with `pk_live_` or `pk_test_`).
3. Copy your **Secret key** (starts with `sk_live_` or `sk_test_`).
4. Replace `STRIPE_PUBLISHABLE_KEY_HERE` and `STRIPE_SECRET_KEY_HERE` in the codebase.

---

## Step 4 - Install and Run Locally

```bash
cd lifesaverselite
npm install
npm run dev
```

App runs at: `http://localhost:5173`

### Demo Login

On the Login page, use the **Demo role selector** to switch between:
- **LifeSaver** - Accesses `/dashboard/lifesaver`
- **Agent** - Accesses `/dashboard/agent`
- **Admin** - Accesses `/dashboard/admin`

---

## Step 5 - Build and Deploy Frontend

```bash
npm run build
```

The `dist/` folder contains the built app. Deploy to:
- **Netlify:** Drag and drop `dist/` at netlify.com
- **Vercel:** `vercel --prod` from the project root
- **GitHub Pages:** Push `dist/` to `gh-pages` branch

Set your custom domain to `ao-gp.org` or your chosen domain in your hosting provider.

---

## Folder Structure

```
lifesaverselite/
  backend/
    Code.gs                     Google Apps Script backend
  src/
    context/
      AuthContext.jsx           Role-based auth (LifeSaver / Agent / Admin)
    components/
      Nav.jsx                   Public nav bar
      Footer.jsx                Public footer
      BottomNav.jsx             Dashboard bottom navigation
      StarRating.jsx            Reusable star display
      ICAgreementModal.jsx      IC Agreement modal (2 parts)
    pages/
      Landing.jsx               Public landing page
      Apply.jsx                 LifeSaver application form
      AgentEnroll.jsx           Agent/Broker enrollment (4 pages)
      Login.jsx                 Login page with demo role selector
      dashboard/
        LifeSaverDashboard.jsx  LifeSaver shell (6 tabs)
        AgentDashboard.jsx      Agent shell (5 tabs)
        AdminDashboard.jsx      Admin shell (6 tabs)
        Training.jsx            5-module training system + certificate
        lifesaver/
          LSHome.jsx
          LSSubmit.jsx
          LSReferrals.jsx
          LSEarnings.jsx
          LSStars.jsx
          LSProfile.jsx
        agent/
          AgentLeads.jsx
          AgentSpend.jsx
          AgentPool.jsx
          AgentLifeSavers.jsx
          AgentSettings.jsx
        admin/
          AdminOverview.jsx
          AdminLeads.jsx
          AdminLifeSavers.jsx
          AdminAgents.jsx
          AdminRevenue.jsx
          AdminSettings.jsx
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  README.md
```

---

## Email System

All 6 email types are handled in `Code.gs`:

| Email | Trigger | Recipient |
|---|---|---|
| Application confirmation | LifeSaver submits application | Applicant + Admin |
| Agent enrollment alert | Agent submits enrollment | Admin |
| Referral submitted | LifeSaver submits referral | LifeSaver + assigned Agent |
| Lead accepted | Agent accepts lead | LifeSaver |
| Lead declined | Agent declines lead | LifeSaver |
| (Admin alert) | New applications pending | Admin |

All emails are branded dark navy + red, max width 600px, signed by Quenton Stroud.

---

## Contact

Operator: Quenton Stroud, Executive Manager, LifeSavers Elite
Email: qcandoit@gmail.com
Booking: https://cal.com/quenton-stroud/30min
