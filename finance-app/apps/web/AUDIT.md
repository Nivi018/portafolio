# Technical UI Audit — Finance App

**Scope:** `apps/web/src/app` and shared web UI components  
**Date:** 2026-07-30  
**Mode:** Operate — daily personal-finance workflows

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 3/4 | Labels and focus are solid; segmented controls and progress indicators need semantics. |
| 2 | Performance | 3/4 | Builds are clean and lists are bounded; client charts and un-aborted requests remain. |
| 3 | Responsive Design | 3/4 | Grids collapse well; a few controls remain below the 44px touch-target guideline. |
| 4 | Theming | 2/4 | Tokens exist, but component markup still relies widely on legacy literal color utilities. |
| 5 | Implementation Integrity | 2/4 | The visual system is coherent at runtime, but the legacy-color compatibility layer is repeated implementation drift. |
| **Total** |  | **13/20** | **Acceptable — significant work needed** |

## Implementation Integrity Verdict

**Conditional pass.** The rendered product expresses a clear finance-specific system: dark operational surfaces, blue progress/action states, coral attention states, shared elevation, and Spanish task-oriented copy. The Impeccable detector returned `[]`, and lint, typecheck, and production build all pass.

The code does not yet express that system directly enough. Many components still use the former mint literal (`#5ee8b2`) and depend on selector overrides in `src/app/globals.css` to render blue. That works in the current theme, but makes future theming, maintenance, and component reuse fragile.

## Executive Summary

- **Audit health:** **13/20** — Acceptable.
- **Issues:** 0 P0, 1 P1, 4 P2, 2 P3.
- **Strengths:** semantic label wrapping on reviewed forms, visible focus treatment, reduced-motion handling, bounded transaction fetches, clear loading/error work on dashboard and auth, and a passing detector/build pipeline.
- **Top priorities:** remove legacy color coupling, add semantic states to custom controls/progress, standardize retry/loading behavior, and make touch targets consistently mobile-safe.

## Detailed Findings

### [P1] Legacy color utilities bypass the token system

- **Location:** `src/app/globals.css:74-81`; widespread across `src/app/**` and `src/components/**`.
- **Category:** Theming / Implementation Integrity.
- **Impact:** The blue design system is implemented indirectly through `!important` selectors that remap mint Tailwind utilities. A new component can silently miss the mapping, and an alternate theme cannot reliably change all semantic roles.
- **Evidence:** `--accent` and related tokens exist, while many UI components still contain `bg-[#5ee8b2]`, `text-[#5ee8b2]`, and `focus:border-[#5ee8b2]`.
- **Recommendation:** Replace legacy literal utilities in component markup with semantic CSS variables or named component/token classes; then remove the migration aliases after verification.
- **Suggested command:** `/impeccable extract apps/web/src/app`

### [P2] Custom stateful controls do not expose selected/progress semantics

- **Location:** `src/app/(dashboard)/transactions/page.tsx:82`; progress bars in `goals/page.tsx:29`, `budgets/page.tsx:26`, and `components/dashboard/dashboard-view.tsx:91`.
- **Category:** Accessibility.
- **Impact:** A screen-reader user cannot reliably identify which transaction type is selected, or obtain goal/budget completion values from the visual bars.
- **WCAG/Standard:** WCAG 4.1.2 Name, Role, Value.
- **Recommendation:** Mark the expense/income selector as a radiogroup or expose `aria-pressed` on each button. Give progress indicators `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a readable label.
- **Suggested command:** `/impeccable harden apps/web/src/app`

### [P2] Recovery behavior is inconsistent outside dashboard/reports/auth

- **Location:** `accounts/page.tsx:22,32`, `budgets/page.tsx:20,25`, `goals/page.tsx:22,28`, `recurring/page.tsx:25,31`.
- **Category:** Accessibility / Resilience.
- **Impact:** When an initial fetch fails, several screens render an error message but no explicit retry action or loading-state distinction. Users may need to refresh the whole page, and errors in several forms are not announced with `role="alert"`.
- **WCAG/Standard:** WCAG 4.1.3 Status Messages.
- **Recommendation:** Standardize a local async-state pattern with loading, alert, retry, success, and disabled/submitting states for each data-dependent feature.
- **Suggested command:** `/impeccable harden apps/web/src/app`

### [P2] Some touch targets are below the 44×44px mobile guideline

- **Location:** `components/layout/header.tsx:34` (`size-9`, 36px); auth link controls; many compact form controls use approximately 40px heights.
- **Category:** Responsive Design / Accessibility.
- **Impact:** Small targets increase accidental taps and are harder for users with limited dexterity. The browser inspection found the Login “Crear cuenta” link at 36px tall.
- **WCAG/Standard:** WCAG 2.5.8 Target Size (Minimum), where applicable.
- **Recommendation:** Give standalone header icon actions and touch-only links a 44px hit area; retain compact visual glyphs inside the larger target.
- **Suggested command:** `/impeccable adapt apps/web/src/app`

### [P2] Report date serialization can shift the selected day by timezone

- **Location:** `src/app/(dashboard)/reports/page.tsx:12`.
- **Category:** Implementation Integrity / Resilience.
- **Impact:** `Date#toISOString()` serializes in UTC. Around local midnight, default report bounds can be one calendar day off for the user.
- **Recommendation:** Format local date parts for the date input instead of slicing a UTC ISO string.
- **Suggested command:** `/impeccable harden apps/web/src/app`

### [P3] Narrower-than-supported viewport overflows

- **Location:** `src/app/globals.css:30` (`min-width: 320px`).
- **Category:** Responsive Design.
- **Impact:** At the inspected 311px browser viewport, the document overflows horizontally. This is below the app’s stated 320px minimum, so it is not a supported-width release blocker; verify at exactly 320px and above after any layout changes.
- **Recommendation:** Keep the 320px contract documented or remove the fixed minimum if smaller embedded webviews are in scope.
- **Suggested command:** `/impeccable adapt apps/web/src/app`

### [P3] Data requests are not consistently cancellable

- **Location:** client route loaders in `accounts`, `budgets`, `goals`, `recurring`, and `reports` pages.
- **Category:** Performance / Resilience.
- **Impact:** A route change during a slow request can still resolve and attempt state updates. The impact is low for this small app but becomes visible with slow networks and more routes.
- **Recommendation:** Use `AbortController` through `apiFetch` and clean it up in route effects, or centralize server-state loading in a query layer.
- **Suggested command:** `/impeccable optimize apps/web/src/app`

## Patterns & Systemic Issues

1. **Legacy token migration:** color literals remain spread through page and shared-component markup while CSS remaps them globally.
2. **Async-state inconsistency:** dashboard, auth, transactions, and reports have meaningful states; accounts, budgets, goals, and recurring need the same standard.
3. **Compact controls:** visual density is good, but the 44px touch target has not been applied consistently to secondary actions.

## Positive Findings

- `pnpm --filter @finance/web lint`, `typecheck`, and production `build` pass.
- Impeccable detector returned no findings.
- Reviewed login inputs have associated labels and autocomplete hints; browser inspection found zero unlabeled inputs on that route.
- Global focus-visible styling and reduced-motion handling are present.
- Error recovery is already well implemented in the dashboard; report bounds prevent an invalid date range.
- Desktop/mobile layouts use grid breakpoints and flexible containers rather than fixed content widths.

## Recommended Actions

1. **[P1] `/impeccable extract apps/web/src/app`** — replace legacy mint utilities with explicit semantic tokens/classes and retire compatibility aliases.
2. **[P2] `/impeccable harden apps/web/src/app`** — standardize async recovery and add accessible state semantics to segmented/progress controls; also fix local-date formatting.
3. **[P2] `/impeccable adapt apps/web/src/app`** — enforce comfortable touch targets and verify the documented 320px minimum through wide layouts.
4. **[P3] `/impeccable optimize apps/web/src/app`** — add request cancellation or a shared query lifecycle for route data.
5. **[P3] `/impeccable polish apps/web/src/app`** — final visual/interaction pass after the system and responsive fixes.

Re-run `/impeccable audit apps/web/src/app` after fixes to measure the improvement.
