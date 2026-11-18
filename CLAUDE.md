# Instructions for Claude sessions working in this repo

This repo has two roles:
- **Executive (owner):** `quentonstroud-bit`. Reviews and approves everything.
- **Coder:** a collaborator who builds features. Does not merge to `main`.

Rules for any Claude session here:
1. Never push directly to `main`. Work on a branch (`coder/<topic>` for the coder, the session's assigned branch for the owner).
2. Open a **draft pull request** into `main` when pushing. Only the owner marks it ready and merges.
3. Never merge or approve your own pull request.
4. Never commit secrets (API keys, tokens, passwords, `.env` files).
5. Follow `CONTRIBUTING.md` and fill in the PR template.
