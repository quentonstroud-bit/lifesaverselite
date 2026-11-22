# LifeSavers Elite website (lifesaverselite.com)

The public marketing site: plain HTML/CSS/JS, no build step. It is a copy of the design deployed on
Cloudflare (lifesavers-elite.reverendqs.workers.dev), saved here so it lives in GitHub with the app.

Changes from the deployed copy:
- **Login** goes to `https://app.lifesaverselite.com/login`.
- The **Join** section's form was a placeholder that never submitted anywhere (Formspree `YOUR_FORM_ID`).
  It now sends people to the real application at `https://app.lifesaverselite.com/apply`, which also emails them a sign-in link.
- The Agents page button goes to agent enrollment: `https://app.lifesaverselite.com/agents/enroll`.

## Deploy (Cloudflare Workers / Pages)
Either upload this folder's contents the same way you did before (zip `index.html`, the other `.html` pages and `assets/`),
or connect the Cloudflare project to this GitHub repo with the root directory set to `website` and no build command.

These links only work once `app.lifesaverselite.com` points at the Vercel app (see `docs/HANDOFF.md`, Section 7).
