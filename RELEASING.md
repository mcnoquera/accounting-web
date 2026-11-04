# Releasing Ledgerly Web

Gitflow: work lands on `develop` through `feature/*` branches; `main` only receives
`release/x.y.z` (and `hotfix/*`) merges. **Pushing `main` deploys to production** (Vercel
builds `main`). Release together with the API, using the same version number, and release
the API first when the web depends on new endpoints.

## 1. Before cutting a release
- [ ] Everything is merged into `develop`.
- [ ] CI is green on the latest `develop` commit (lint, typecheck, tests, `next build`).
- [ ] The matching API release is ready (or already deployed) if new endpoints are used.
- [ ] New environment variables, if any, are set in Vercel **before** releasing
      (today: `API_URL`, optional `DEMO_MODE`).

## 2. Cut and publish
```bash
git fetch origin
git switch -c release/1.4.0 origin/develop
npm version 1.4.0 --no-git-tag-version && git commit -am "Bump version to 1.4.0"
git switch main && git pull --ff-only
git merge --no-ff release/1.4.0 -m "Merge release/1.4.0 into main"
git diff --quiet release/1.4.0 HEAD && echo "main matches the release"
git tag -a v1.4.0 -m "Ledgerly 1.4.0 (Sprint N) ... release notes ..."
git push origin main v1.4.0                          # ← deploys
git switch develop && git merge --no-ff release/1.4.0 -m "Merge release/1.4.0 into develop"
git push origin develop
git branch -d release/1.4.0
```

## 3. After deploying
- [ ] CI is green on `main`; the Vercel deployment is "Ready".
- [ ] Sign in works against the production API (no CORS/`API_URL` errors).
- [ ] Smoke test: dashboard, a report, one CSV and one PDF download through `/export`,
      and every screen the release changed.

## Hotfixes and rollback
- Hotfix: branch `hotfix/x.y.z` from `main`, release as above, then merge into `develop`.
- Rollback: in Vercel, promote the previous production deployment (instant), then fix forward
  on `develop`. Don't move or delete tags.
