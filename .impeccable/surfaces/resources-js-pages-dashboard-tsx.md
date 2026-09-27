---
version: 1
slug: "resources-js-pages-dashboard-tsx"
primary_target: "resources/js/Pages/Dashboard.tsx"
related_targets: ["resources/js/Layouts/AuthenticatedLayout.tsx","resources/js/Layouts/GuestLayout.tsx"]
---

# Surface brief: Dashboard (and the app shell it sets)

## Scope and mode
The signed-in app, led by the Dashboard; the shell, sheets and components it establishes carry every other page (Transactions, Scheduled, Accounts, Categories, Reimbursements, Reports, Profile, auth). Visitor mode: Operate.

## Audience and job
One person, phone and laptop about equally. Jobs, confirmed: see where I stand; stay ahead of bills and debts. Action on the dashboard: post (or skip) the next scheduled payment; drill into accounts.

## Content and constraints
Real personal data only; never invent balances or claims. Net worth = assets − liabilities; money owed to you is shown beside it, not counted. Amounts are exact to the centavo. Overdue and due-soon items are never folded away or behind a click.

## Direction contract
THESIS: Your money issued as a monthly statement of account: net worth ruled and totaled, the amount due boxed and dated. Refuses the four-KPI-tiles-and-a-donut dashboard.
OWN-WORLD: White statement sheets on a cool grey-green desk (#E9EEEE), ink #161C20, a teal issuer band #0D4F59 as the only large color, highlighter yellow #FFF1A8 reserved for the amount due, past-due red #C8261D, credit green #1B7A4A for money in. Archivo variable: expanded heavy tabular numerals for the figures that matter, condensed caps for field labels, regular width for text. Hairline-ruled itemized tables, single rule above a total and double rule below, rectangular stamp chips, a boxed Amount Due, perforated tear-off stubs for scheduled payments.
STORY: In one glance the visitor knows what they stand on and what is due; the ruled totals make the numbers believable; they post the next bill or open an account.
FIRST VIEWPORT: Teal band with wordmark, nav and account holder. Statement header: period as the H1, issued date. One sheet: left seven columns hold the summary ladder (money you have − you owe = net worth at display size, double-ruled; owed-to-you on its own line, not counted); right five columns hold the yellow Amount Due box (total due in the reminder window, earliest due date, count; a red past-due strip when late). Directly below, a perforation and one stub per upcoming payment, Post as the primary action. On a phone: band, net worth, Amount Due, stubs; spending, interest and accounts unfold in place below. Signature interaction: posting tears the stub off along its perforation (≈220ms ease-out); press feedback scale 0.97; dialogs fade-scale from 0.97, bottom sheets on phones; no motion on navigation or keyboard actions.
FORM: Statement of account (Philippine utility and credit-card SOA), position 3 of 7 on the ordered list, seed key c50fc855. Raises: scale courage (from the type specimen), stepped deployment on phones (from the Miura sheet).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
Dark mode (not requested; tokens stay coherent but nothing switches it on). PDF templates (Blade/DomPDF) keep their current look.
