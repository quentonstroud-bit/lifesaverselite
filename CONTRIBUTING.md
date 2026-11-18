# Collaboration Guide

Two people, two Claude accounts, one repo (`quentonstroud-bit/lifesaverselite`).

| Role | Who | Can do |
|---|---|---|
| Executive / owner | `quentonstroud-bit` | Approve and merge pull requests, manage settings |
| Coder | (collaborator's GitHub username) | Create branches, push, open pull requests |

**Rule: nothing reaches `main` without the owner's approval.**

## Workflow
1. Coder starts from the latest `main`: `git pull origin main`.
2. Coder creates a branch: `git checkout -b coder/<short-topic>`.
3. Coder (or their Claude) makes edits and commits.
4. Push the branch: `git push -u origin coder/<short-topic>`.
5. Open a pull request into `main` using the PR template.
6. Owner reviews, requests changes or approves, then merges.
7. After merging, everyone pulls `main` again.

Designs and assets go in the repo too (e.g. `public/` or a `design/` folder) and follow the same pull request process.

## One-time setup: owner (GitHub settings, cannot be done from code)
1. **Invite the coder:** Repo > Settings > Collaborators > Add people. Give **Write** access (not Admin).
2. **Protect `main`:** Repo > Settings > Branches > Add branch protection rule for `main`:
   - Require a pull request before merging
   - Require approvals: 1
   - Require review from Code Owners (uses `.github/CODEOWNERS`)
   - Do not allow bypassing the above settings
   - Restrict force pushes and deletions
   (If your plan only offers this on public repos or paid plans, use Settings > Rules > Rulesets, or tell the coder to follow the rules above by agreement.)

## One-time setup: coder (connecting their Claude)
1. Create/have a GitHub account and accept the collaborator invite from `quentonstroud-bit`.
2. In their own Claude Code (claude.ai/code), connect GitHub: https://claude.ai/connect-github
3. Install the Claude GitHub App on the repo: https://github.com/apps/claude/installations/select_target (select `lifesaverselite`). If it needs an org owner, ask the owner.
4. Start a Claude Code session and attach `quentonstroud-bit/lifesaverselite` as the repository.
5. Tell their Claude: "Read CLAUDE.md and CONTRIBUTING.md first. Work only on a `coder/<topic>` branch and open draft pull requests."

## Do not
- Push to `main`, force-push, or merge your own pull request.
- Commit secrets or `.env` files.
