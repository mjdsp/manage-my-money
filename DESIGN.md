---
name: Manage My Money
description: A private peso ledger, issued like a monthly statement of account.
colors:
  issuer-teal: "oklch(0.394 0.063 210.5)"
  issuer-teal-deep: "oklch(0.35 0.056 211.2)"
  issuer-teal-mist: "oklch(0.819 0.037 205.2)"
  teal-wash: "oklch(0.943 0.013 202.9)"
  desk: "oklch(0.945 0.005 197.1)"
  paper: "oklch(1 0 0)"
  paper-shade: "oklch(0.967 0.004 197)"
  printers-ink: "oklch(0.222 0.012 237.3)"
  ink-secondary: "oklch(0.486 0.02 242.7)"
  ink-tertiary: "oklch(0.528 0.018 239.4)"
  rule: "oklch(0.899 0.008 207.1)"
  rule-soft: "oklch(0.939 0.005 197.1)"
  field-stroke: "oklch(0.663 0.015 226.7)"
  highlighter: "oklch(0.953 0.093 98.6)"
  highlighter-ink: "oklch(0.423 0.087 96.2)"
  past-due: "oklch(0.54 0.198 29)"
  past-due-wash: "oklch(0.95 0.019 25.6)"
  credit: "oklch(0.514 0.115 155.8)"
  credit-wash: "oklch(0.949 0.017 159.1)"
  spot-ink-1: "oklch(0.394 0.063 210.5)"
  spot-ink-2: "oklch(0.541 0.111 87.7)"
  spot-ink-3: "oklch(0.486 0.02 242.7)"
  spot-ink-4: "oklch(0.554 0.078 204.3)"
  spot-ink-5: "oklch(0.515 0.106 36.5)"
  spot-ink-6: "oklch(0.468 0.099 294.1)"
  spot-ink-7: "oklch(0.529 0.121 133.8)"
  spot-ink-8: "oklch(0.531 0.077 340)"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 13cqi, 3.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 116"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 106"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 108"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.71875rem"
    fontWeight: 600
    lineHeight: 1rem
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 78"
  stamp:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.65625rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 80"
rounded:
  stamp: "3px"
  sheet: "5px"
  control: "6px"
  dialog: "8px"
  bottom-sheet: "16px"
  round: "9999px"
spacing:
  row: "12px"
  sheet-inset: "20px"
  sheet-inset-wide: "24px"
  statement-inset: "28px"
  stack: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.issuer-teal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.issuer-teal-deep}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.printers-ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-outline-hover:
    backgroundColor: "{colors.paper-shade}"
  button-ghost:
    textColor: "{colors.printers-ink}"
    rounded: "{rounded.control}"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-shade}"
  button-destructive:
    textColor: "{colors.past-due}"
    rounded: "{rounded.control}"
  button-destructive-hover:
    backgroundColor: "{colors.past-due-wash}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.printers-ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "4px 12px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.printers-ink}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  amount-due-box:
    backgroundColor: "{colors.highlighter}"
    textColor: "{colors.printers-ink}"
    rounded: "{rounded.stamp}"
    padding: "24px"
  past-due-strip:
    backgroundColor: "{colors.past-due}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "6px 16px"
  stamp-past-due:
    backgroundColor: "{colors.past-due-wash}"
    textColor: "{colors.past-due}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    height: "18px"
  stamp-credit:
    backgroundColor: "{colors.credit-wash}"
    textColor: "{colors.credit}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    height: "18px"
  stamp-outline:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    height: "18px"
  issuer-band:
    backgroundColor: "{colors.issuer-teal}"
    textColor: "{colors.paper}"
    height: "64px"
  band-tab-active:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.printers-ink}"
    height: "44px"
  tab-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-secondary}"
    height: "64px"
  tab-bar-active:
    textColor: "{colors.issuer-teal}"
---

# Design System: Manage My Money

## Overview

**Creative North Star: "The Statement"**

Money is issued to its owner the way a bank or a utility issues a monthly statement of account. Every screen is a white sheet resting on a cool desk, headed by one teal issuer band. Figures are set in tabular numerals, itemised on hairline rules, and closed off with a single rule above a total and a double rule below the grand total. The amount you have to act on is boxed in highlighter yellow, the only yellow anywhere, and scheduled payments are tear-off stubs with a perforation you can post along.

It is an operating surface first. Density is statement-like: calm, exact and scannable, with brand living in the details (the ruled ladder, the stamps, the perforation) rather than in decoration. Structure carries the hierarchy: the net-worth total is the one display-size figure, and scale does the work that extra boxes would otherwise do. On a phone the statement arrives folded: what you stand on and what is due come first, while breakdowns unfold in place.

This world was chosen to replace a generic dashboard of equal KPI tiles and a category donut. It rejects that arrangement, and it rejects cream-paper nostalgia too: the desk is cool grey-green and the paper is plain white.

**Key Characteristics:**
- White statement sheets on a cool grey-green desk, one teal issuer band on top.
- Archivo variable throughout, with its width axis used for expanded display figures and condensed caps labels.
- Tabular lining figures, a true minus sign, and ruled totals: single rule above, double rule below.
- Highlighter yellow reserved for the amount due; red reserved for money that is late.
- Scheduled payments rendered as notched, perforated stubs whose payment slip tears off when posted.

## Colors

A restrained statement palette: neutrals of paper, desk and ink, one committed teal band, and three reserved meanings.

### Primary
- **Issuer Teal** (oklch(0.394 0.063 210.5), ≈ #0D4F59): the issuer band across the top of every page, primary buttons, links, the active tab-bar item, itemised bars and focus rings. White on it clears 9:1.
- **Deep Issuer Teal** (oklch(0.35 0.056 211.2), ≈ #0A424B): primary button hover.
- **Teal Mist** (oklch(0.819 0.037 205.2), ≈ #A9CBCF): inactive nav text on the band (5.3:1 on teal).
- **Teal Wash** (oklch(0.943 0.013 202.9), ≈ #E3EFF0): selected rows and menu items, secondary buttons, the "auto-post" stamp.

### Neutral
- **Desk** (oklch(0.945 0.005 197.1), ≈ #E9EEEE): the page ground everything rests on, and the active tab cut into the band.
- **Statement White** (oklch(1 0 0)): sheets, dialogs, menus, inputs and the phone tab bar.
- **Paper Shade** (oklch(0.967 0.004 197)): hover fills and sheet footers.
- **Printer's Ink** (oklch(0.222 0.012 237.3), ≈ #161C20): text, amounts, strong rules under table headings, the total rules.
- **Secondary Ink** (oklch(0.486 0.02 242.7), ≈ #56616A): descriptions, meta lines and labels (6.3:1 on paper, 5.4:1 on desk).
- **Tertiary Ink** (oklch(0.528 0.018 239.4), ≈ #626D75): placeholders and the faintest meta (4.5:1 or better on both grounds).
- **Rule** (oklch(0.899 0.008 207.1)) and **Soft Rule** (oklch(0.939 0.005 197.1)): hairlines between lines, and the tracks behind bars.
- **Field Stroke** (oklch(0.663 0.015 226.7), ≈ #8A959A): input and select borders (3:1 on paper), and the perforation holes.

### Reserved meanings
- **Highlighter** (oklch(0.953 0.093 98.6), ≈ #FFF1A8) with **Highlighter Ink** (oklch(0.423 0.087 96.2)): the Amount Due box and text selection. Nothing else.
- **Past-Due Red** (oklch(0.54 0.198 29), ≈ #C8261D) with its **wash** (oklch(0.95 0.019 25.6)): late bills, the past-due strip, a negative net worth, destructive actions and field errors.
- **Credit Green** (oklch(0.514 0.115 155.8), ≈ #1B7A4A) with its **wash** (oklch(0.949 0.017 159.1)): money coming in, collection progress and success notices.
- **Spot inks 1–8**: the category chart on the monthly report, largest share first, each 4.5:1 or better on paper and always named in the legend.

### Named Rules
**The Highlighter Rule.** Yellow marks the amount due and nothing else. If a second thing on the page turns yellow, the first one stops meaning "pay this".

**The Red Means Late Rule.** Red is for money that is late (and a net worth below zero). Expenses are printed in ink with a minus sign, not in red.

**The One Band Rule.** Teal owns the issuer band and the primary action. It never floods a whole region of the page.

## Typography

**Display Font:** Archivo Variable (with ui-sans-serif, system-ui)
**Body Font:** Archivo Variable
**Label Font:** Archivo Variable at 78–80% width

**Character:** One grotesk carries everything, like a statement printed in a single family. The width axis does the work a second typeface would: expanded and heavy for the figures that matter, condensed caps for field labels and stamps, regular width for reading.

### Hierarchy
- **Display** (700, clamp(1.75rem, 13cqi, 3.5rem), 0.95, 116% width): the net-worth total, the amount due and the month's net-worth change. It is sized against its container so eight-digit peso amounts still fit. The peso sign steps down to 0.52em and the centavos to 0.46em, so the pesos lead.
- **Headline** (600, 1.75rem rising to 2rem from sm, 1.1, 106% width): page titles, including the statement period ("September 2026").
- **Title** (600, 1.0625rem, -0.01em): section and sheet headings.
- **Figure** (600, 1.375rem, 108% width): stub amounts and line totals, with the peso sign and centavos at 0.72em.
- **Body** (400, 0.9375rem, 1.5): row names and running text. Secondary copy is 0.875rem in Secondary Ink.
- **Label** (600, 0.71875rem, 0.06em, uppercase, 78% width): statement field labels such as ISSUED, PERIOD, AMOUNT DUE, and table headings.
- **Stamp** (600, 0.65625rem, 0.06em, uppercase, 80% width): status marks such as PAST DUE, INCOMING, AUTO-POST, TRANSFER and DEFAULT.

### Named Rules
**The Ruled Figure Rule.** Every amount is set in tabular lining figures with a true minus sign (−) and explicit direction (+ for money in). Amounts align column to column.

**The Label Over Value Rule.** Condensed caps label a value, the way a statement labels a field. They never sit above a heading as an eyebrow.

## Layout

A statement column: content sits in a max-width container of 80rem (1280px) with 16px side gutters, 24px from sm and 32px from lg. Pages are headed by the title and one line of purpose, with actions on the right. They are built from sheets separated by 24px, with 40px before a new section. Inside a sheet, space comes from 20px, 24px or 28px insets, and hairline rules split sections instead of nested containers.

The dashboard sheet is a two-column statement from lg: the net-worth ladder and this month's movement on the left (7 of 12 columns at xl, 6 at lg), and the amount-due column spanning both on the right. Below lg it reads top to bottom as net worth, then amount due, then movement. Upcoming stubs sit in a grid of 1, 2, 3 or 4 columns (base, sm, lg, xl).

Phones get a bottom tab bar (Dashboard, Transactions, Scheduled, Accounts, More) with a safe-area inset, and the desktop nav moves into the issuer band from lg. Tables become ledger lists below md, with each line opening its editor, and dialogs become bottom sheets below sm. Controls grow to 44px on coarse pointers, and inputs use 16px text there so iOS never zooms.

### Named Rules
**The Nothing Due Folds Rule.** On a phone, sections such as spending, interest and accounts may arrive folded, but net worth and anything due never do.

## Elevation & Depth

Paper on a desk: surfaces are flat white sheets lifted off the desk by one soft, offset shadow. Depth only means "this sits above": sheets above the desk, menus and dialogs above sheets. Nothing glows, and nothing is glass.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 0 0 1px oklch(0.222 0.012 237 / 0.07), 0 1px 2px oklch(0.222 0.012 237 / 0.06), 0 12px 28px -16px oklch(0.222 0.012 237 / 0.22)`): every statement sheet.
- **Stub** (`filter: drop-shadow(0 0 0.5px oklch(0.222 0.012 237 / 0.34)) drop-shadow(0 1px 1.5px oklch(0.222 0.012 237 / 0.08))`): payment stubs, as a drop-shadow so the outline follows the notches.
- **Pop** (`box-shadow: 0 0 0 1px oklch(0.222 0.012 237 / 0.08), 0 4px 10px -4px oklch(0.222 0.012 237 / 0.12), 0 20px 44px -16px oklch(0.222 0.012 237 / 0.32)`): menus, selects, dialogs, bottom sheets and toasts.

### Named Rules
**The One Sheet Deep Rule.** Sheets never nest. A section inside a sheet is divided by a rule, not boxed in another card.

## Shapes

Printed corners: 3px on stamps and the amount-due box, 5px on sheets and stubs, 6px on controls, 8px on centered dialogs, and 16px on the top corners of a phone bottom sheet. The only round shapes are the account initials and the sheet grabber. Stubs carry two 6px notches where the perforation meets their edges, and the perforation is a row of 1px holes at a 7px pitch.

## Components

### Buttons
- **Shape:** printed-control corners (6px); 36px tall, 44px on coarse pointers.
- **Primary:** Issuer Teal with white semibold 14px text, 14px side padding, darkening to Deep Issuer Teal on hover.
- **Outline / Ghost / Secondary:** a paper field with a Field Stroke border, a transparent field, or a Teal Wash field, each warming to Paper Shade on hover.
- **Destructive:** Past-Due Red text, with a red wash on hover. Solid red is used only to confirm deleting an account.
- **Press:** every button presses to scale(0.97) over 160ms on the strong ease-out curve (cubic-bezier(0.23, 1, 0.32, 1)). Focus is a 2px teal outline offset by 2px.

### Chips (Stamps)
- **Style:** small ruled rectangles (3px, 18px tall) in condensed caps, like marks printed beside a statement line. PAST DUE is red on a red wash; INCOMING is green; AUTO-POST is teal on its wash; TRANSFER, ADJUSTMENT, DEFAULT, PAUSED and ARCHIVED are secondary ink on an outline.

### Cards / Containers (Sheets)
- **Corner Style:** 5px.
- **Background:** Statement White on the desk.
- **Shadow Strategy:** the Sheet shadow (see Elevation & Depth).
- **Internal Padding:** 20px, rising to 24px from sm; the dashboard statement uses 28px.

### Inputs / Fields
- **Style:** Statement White field, 1px Field Stroke border, 6px corners, 36px tall (44px on touch), and a teal caret.
- **Focus:** the border turns teal, with a 3px teal ring at 20%.
- **Error / Disabled:** a red border and ring, with the message in red beneath; disabled fields fade to 60% on Paper Shade.

### Navigation
- **Issuer band:** Issuer Teal, 56px (64px from lg), sticky, and padded for the notch. It carries the mark and the "Manage My Money" wordmark (expanded to 112% width), with the account initials menu on the right.
- **Desktop tabs:** Teal Mist text. The current section is a desk-colored tab cut into the bottom of the band, joining the page below.
- **Phone tab bar:** Statement White with a top rule, four sections plus More, icons with 11px labels. The active item is teal with a 2px bar along its top edge. More opens a bottom sheet with the remaining sections, the profile and log out.

### Summary Ladder (signature)
Assets, then − Liabilities, a single ink rule, then = Net worth at display size, closed by a double rule. Money owed to you is printed beneath as a sentence and is not counted.

### Amount Due Box (signature)
A highlighter-yellow field in a 1.5px ink frame. It holds the display-size total of bills in their reminder window, a Pay by date with its lateness, and a count. When anything is late, a red past-due strip runs across its top. With nothing due, it becomes a dashed empty slot with a link to schedules.

### Payment Stub (signature)
A 5px paper stub. The top half holds the payee, stamps, the amount at figure size, the due date with "Due in N days" or "N days late" (red), and the schedule and account lines. It is notched and perforated above a tear-off slip holding Post and Skip. Posting tears the slip away (translateY(14px), rotate(-1.25deg), fade, over 240ms ease-out); under reduced motion it only fades.

### Itemised Breakdown
Hairline-ruled lines, each with a name, amount, percentage and a 5px teal share bar on a soft track. Lines past five fold behind "See N more", and the total is ruled single above and double below.

## Do's and Don'ts

### Do:
- **Do** set every amount through the shared Amount treatment: tabular figures, a true minus (−), and + for money in.
- **Do** close totals with a single Printer's Ink rule above and a 3px double rule below.
- **Do** keep label caps (11.5px, 78% width, +0.06em) for field labels and table headings only.
- **Do** gate hover styles behind hover-capable pointers and give every pressable element :active feedback (scale 0.97).
- **Do** keep UI motion at or under 300ms on the strong ease-out curve (cubic-bezier(0.23, 1, 0.32, 1)); bottom sheets use the drawer curve (cubic-bezier(0.32, 0.72, 0, 1)).
- **Do** use lucide icons at one stroke weight for every pictogram, including the arrow between two accounts.

### Don't:
- **Don't** put yellow anywhere except the amount due and text selection.
- **Don't** colour expenses red; red means late.
- **Don't** rebuild the dashboard as equal KPI tiles with a category donut; the statement ladder and the Amount Due box replace them.
- **Don't** nest cards, or box a section that a rule can separate.
- **Don't** place an eyebrow or kicker above a heading.
- **Don't** use emoji or Unicode glyphs as icons (📎, ✕, →).
- **Don't** add gradients, glass or glows; depth is one soft shadow.
- **Don't** switch on dark mode by inverting these tokens; it has not been designed yet.
