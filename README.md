# Ledgerly Web

Next.js 14 (App Router) + TypeScript + Tailwind front end for the
[`accounting-api`](https://github.com/mcnoquera/accounting-api).

## Quick start

Start the API first (see its README), then:

```bash
npm install
cp .env.example .env.local   # API_URL=http://localhost:8000/api/v1
npm run dev                  # http://localhost:3000
```

Sign in with a demo user (password `password`): `accountant@example.com` to record and post entries,
`controller@example.com` as a second accountant to post someone else's entries, `auditor@example.com`
for the audit views, or `admin@example.com` for everything.

```bash
npm test            # Vitest + Testing Library
npm run lint
npm run typecheck
npm run build
```

## Deploy (Vercel)

Deploy the API first (see its README) and copy its URL. Then:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmcnoquera%2Faccounting-web&env=API_URL&envDescription=Base%20URL%20of%20the%20Ledgerly%20API%2C%20e.g.%20https%3A%2F%2Fledgerly-api.onrender.com%2Fapi%2Fv1)

or import the repository in the Vercel dashboard. Environment variables:

| Name | Value |
|---|---|
| `API_URL` | `https://<your-api>.onrender.com/api/v1` (required) |
| `DEMO_MODE` | `true` to show the demo logins on the sign-in page; leave unset for real use |

Vercel builds with `npm run build` and redeploys on every push to `main`. Server-side requests are
allowed up to 60 seconds so a sleeping free-tier API has time to wake.

## Screens

- **Dashboard**: balances, YTD P&L, drafts waiting, open findings, books-in-balance check.
- **First-run setup**: until an admin saves the company profile, every page shows a setup banner.
- **Settings → Company**: BIR registered name, TIN (formatted as you type), RDO, address, VAT status, fiscal-year start. The company name shows in the sidebar header. Admins edit; everyone else sees it read-only.
- **Settings → Users** (admins): add users with a temporary password, change roles, deactivate/reactivate, unlock after 5 failed sign-ins. The API stops you demoting or deactivating the last admin.
- **Chart of accounts**: tree view with group accounts, search and type/status filters, "group under" when adding or editing, and a one-click Philippine starter chart for an empty chart. Group accounts aren't offered on journal lines.
- **Settings → Periods**: month-end close. Every month from the first entry to today with posted/draft counts; close the next month in order (warns about drafts left in it), and admins can reopen the latest with a reason. Entries in closed months show a lock notice, can't be posted or voided, and date pickers start at the first open date.
- Per-account **general ledger** with running balance.
- **Journal entries**: filterable list; entry form with live debit/credit totals, a one-click "balance with this line", and validation that mirrors the API; draft → post workflow with a segregation-of-duties warning when you post your own entry. Posted entries are corrected by **reversing** (a new dated entry that swaps debits and credits, linked both ways and tagged in the list) or **voiding** (removed from all reports).
- **Reports**: trial balance, balance sheet, income statement, each with date filters.
- **Audit**: exception tests, the append-only audit trail with field-level diffs, and findings (raise / resolve).

## How it talks to the API

All API calls happen on the server (`src/lib/api`). After sign-in the Sanctum token is stored in an
`httpOnly` cookie, so browser JavaScript never sees it. Pages are server components; mutations are server
actions in `src/app/actions`. `src/middleware.ts` sends signed-out users to `/login`, and a 401 from the API
does the same.
