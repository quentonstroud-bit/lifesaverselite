# Cloudflare Setup (owner steps)

The Worker config is `wrangler.jsonc`. The site (`site/`), API (`worker/index.js`) and database schema (`migrations/`) are already in the repo. Vercel keeps running the current site until you switch the domain in step 7.

## 1. Cloudflare account and domain
1. Log in at dash.cloudflare.com (the account that owns `lifesavers-elite.reverendqs.workers.dev`).
2. **Add a domain** > `lifesaverselite.com` > Free plan. Cloudflare scans existing DNS records. Keep any MX/email records it finds.
3. In **Namecheap** > Domain List > Manage > **Nameservers** > *Custom DNS*, and paste the two nameservers Cloudflare gives you. Propagation can take up to a few hours.
4. If you use Namecheap's email forwarding for `info@lifesaverselite.com`, it stops working after the nameserver change. Replace it with **Cloudflare Email Routing** (Dashboard > Email > Email Routing) before switching.

## 2. Create the database
```bash
npx wrangler login
npx wrangler d1 create lifesavers-elite-db
```
Copy the `database_id` it prints into `wrangler.jsonc` (replace `REPLACE_WITH_D1_DATABASE_ID`), then:
```bash
npx wrangler d1 migrations apply lifesavers-elite-db --remote
```

## 3. Resend (email)
1. Create an account at resend.com > Domains > add `lifesaverselite.com`. Add the DNS records it shows in Cloudflare DNS.
2. Create an API key, then:
```bash
npx wrangler secret put RESEND_API_KEY
```

## 4. Deploy
```bash
npx wrangler deploy
```
Check https://lifesavers-elite.reverendqs.workers.dev/api/health returns `{"ok":true}`.

## 5. Auto-deploy from GitHub (optional, recommended)
Cloudflare Dashboard > Workers & Pages > `lifesavers-elite` > Settings > Builds > connect `quentonstroud-bit/lifesaverselite`. Production branch `main`, deploy command `npx wrangler deploy`. Merging an approved pull request then deploys automatically.

## 6. Stripe (when your account is ready)
1. In Stripe (test mode first), create the weekly subscription products listed in `README.md`.
2. Developers > Webhooks > add endpoint `https://lifesaverselite.com/api/stripe/webhook` (use the workers.dev URL until cutover).
3. Save the signing secret: `npx wrangler secret put STRIPE_WEBHOOK_SECRET`
4. Later: `npx wrangler secret put STRIPE_SECRET_KEY`. Never put keys in the repo.

## 7. Cutover to lifesaverselite.com
1. Confirm the domain shows **Active** in Cloudflare.
2. In `wrangler.jsonc`, uncomment `routes` and merge/deploy. Cloudflare attaches the domain and creates the certificate.
3. Remove the domain from the Vercel project so the two don't conflict.

## Not built yet
Login/sessions, dashboards on the API, importing existing Google Sheet data, agents/AI automation.
