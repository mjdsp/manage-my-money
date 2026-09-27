# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person running their own household money in Philippine pesos. Each login sees only its own ledger; nothing is shared between users. They use it on a phone and on a laptop about equally: quick checks and entries on the phone, sit-down reviews and report-making on the big screen.

## Product Purpose

A private ledger that answers two questions every time it opens: **where do I stand** (net worth, balances, what this month's money did) and **what's coming due** (scheduled bills, debt payments, overdue items, payoff progress). Success is never being surprised by a balance or a due date.

## Positioning

It keeps three kinds of account side by side: the money you have, the money you owe, and the money family and friends owe you. Net worth is what you have minus what you owe; money owed to you is tracked right beside it but only counts once it is collected into a real account. Informal loans to people you know are first-class: a borrower, a flat/add-on monthly interest plan, a collection schedule, and the interest they earn you counted as passive income.

## Operating Context

- Amounts are entered and read in pesos (₱, `en-PH` formatting, centavo precision, stored as integer cents).
- Recurring bills, subscriptions and loan payments are scheduled by day of month with a reminder lead time; they can be posted, skipped or auto-posted, and they feed the dashboard's "Upcoming" list.
- Month is the unit of review: a monthly report (income, expenses, savings, interest, net worth start → end) exported as a PDF.
- Reimbursement claims are built as itemised reports (quantity × unit price) with receipt photos that can be OCR-scanned into line items, then exported as a PDF to hand to whoever reimburses.

## Capabilities and Constraints

- Sections: Dashboard, Transactions, Scheduled, Accounts, Categories, Reimbursements, Reports, Profile, plus sign-in/registration.
- Account kinds: asset (cash, bank, savings with annual rate), liability (debt/loan with lender, term, due day, repayment plan), receivable (money owed to me, with borrower, date borrowed, repayment plan). Accounts can be archived.
- Transaction types: income, expense, transfer, adjustment (opening balances and corrections; excluded from monthly activity).
- Stack: Laravel + Inertia + React + TypeScript, Tailwind CSS 4, shadcn/ui on Radix, Sonner toasts, lucide icons. PDFs are rendered server-side from Blade views.
- Undecided: dark mode (tokens exist but nothing switches it on today).

## Brand Commitments

- Name: "Manage My Money". No logo exists yet (the Laravel Breeze placeholder mark is still in place).
- Voice, from the existing copy: plain, warm, second person, a little wry ("Every peso in and out, one row at a time."). Uses Filipino-English money words naturally: peso, centavo, "money owed to me".

## Evidence on Hand

The only content is the user's own financial data. Never put real balances, names or borrowers in shared material. There are no testimonials, customers or metrics, and none should be invented.

## Product Principles

1. Standing first: net worth and this month's movement read in one glance, on a phone as well as a desktop.
2. Nothing due slips by: overdue and due-soon items are never buried below the fold or behind a click.
3. Every centavo exact: full-precision amounts, aligned numerals, signs and direction always explicit.
4. Private and calm: a personal tool, not a feed; no gamification, no alarms beyond what a due date deserves.
