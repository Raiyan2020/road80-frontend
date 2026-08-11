---
name: git-safe-changes
description: Safe change workflow for road-80, where multiple AI agents and people edit the same repo — branching, scoped commits, what must never be committed, and the two-repo layout. Use before committing, branching, staging, or when a working tree has unexpected changes.
---

# Safe Change Workflow (road-80)

Multiple agents and people modify this repo. The cost of a sloppy commit is not
just mess — it is another agent building on top of a half-finished change.

## Two separate repositories

```
road-80-full/                 ← NOT a git repo, just a container folder
├── road-80/                  ← git repo: github.com/Raiyan2020/road80-frontend
└── backend/Raod80-backend/   ← a DIFFERENT git repo (Laravel 12)
```

**Never assume a change spans both.** A frontend commit cannot include a backend
change; they are independent repos with independent history. If a feature needs
both, that is two commits in two repos, and the API contract change must land
first (see `laravel-api-contract`).

## Before you touch anything

```bash
git status          # know what was already dirty before you started
git branch --show-current
```

If the tree is already dirty, those changes are **not yours**. Do not stage them,
do not revert them, do not `git add -A`. Work around them and mention them.

## Branching

Current branch: `feature/push-notifications`. Convention is `feature/<slug>`.

- Never commit directly to `main`.
- Branch from an up-to-date `main` for new work.
- One branch per feature. A branch carrying two unrelated features cannot be
  reviewed or reverted cleanly.

## Commits

**Stage explicitly. Never `git add -A` or `git add .`** — in a shared tree that
sweeps up other agents' work.

```bash
git add features/post-ad/services/post-ad.service.ts features/post-ad/hooks/useUpload.ts
git commit -m "feat(post-ad): add chunked video upload retry"
```

The repo uses Conventional Commits — see history: `feat(video-upload): …`,
`feat: …`. Match that.

One logical change per commit. If the message needs "and", it is two commits.

## Never commit

- `.env`, `.env.local`, API keys, `GEMINI_API_KEY` — `vite.config.ts` inlines env
  values into the bundle at build time, so a leaked key is shipped to every client
- `dist/`, `node_modules/`
- `ios/` and `android/` build artifacts (Pods, `.gradle`, build dirs) — the native
  project files themselves *are* tracked
- `routeTree.gen.ts` changes made by hand — regenerate instead
- debugging leftovers: `console.log`, commented-out code, `.only` in tests

## `.claude/` — decide deliberately

`.gitignore` currently has no entry for `.claude/`, so the skills in
`.claude/skills/` **will be committed**. That is usually what you want — they are
project knowledge that should travel with the repo and be reviewed like code.
Just make it a deliberate choice, and keep secrets out of `.claude/settings.json`
(use `settings.local.json`, which should be ignored).

## Before committing

Run the gate in `verification-done`. Do not commit code you have not built.

```bash
git diff --staged       # read it — every line should be intentional
```

If the diff contains a file you don't recognise, stop and find out why.

## Do not rewrite shared history

- No `git push --force` on a shared branch
- No rebasing anything already pushed
- No `git reset --hard` on a tree with other agents' work

If you need to undo, prefer `git revert` — it is additive and safe.

## Recovering a dirty tree

```bash
git stash list          # someone may have stashed
git diff                # unstaged
git diff --staged       # staged
```

Understand before you discard. `git checkout -- <file>` is unrecoverable for
uncommitted work.

## Checklist

- [ ] Right repo (frontend vs backend)
- [ ] On a feature branch, not `main`
- [ ] Pre-existing dirty files left alone
- [ ] Files staged explicitly, never `-A`
- [ ] `git diff --staged` read in full
- [ ] No secrets, `dist/`, or build artifacts
- [ ] Conventional Commit message, one logical change
- [ ] Verification gate passed
