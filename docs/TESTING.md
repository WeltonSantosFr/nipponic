# Nipponic Testing Guidelines & Regression Standards

This document establishes the mandatory testing standards, methodologies, and execution protocols for the Nipponic codebase. Every contribution—whether by human engineers or AI agents—must adhere to these rules.

---

## 1. The Nipponic Testing Pyramid

Nipponic enforces a multi-layered testing strategy designed to provide rapid feedback during development while preventing functional and visual regressions from reaching production:

```
                  ┌──────────────────────┐
                  │ Visual Regression    │ (Playwright: UI & Responsive 320px/1280px)
               ┌──┴──────────────────────┴──┐
               │   Bug Regression Testing   │ (Vitest: Targeted bug replication)
            ┌──┴────────────────────────────┴──┐
            │   Integration & Component Tests  │ (Vitest + JSDOM / React Testing Library)
         ┌──┴──────────────────────────────────┴──┐
         │       Unit Tests & Domain Logic        │ (Vitest: SRS algorithms, utilities, services)
         └────────────────────────────────────────┘
```

| Layer | Runner / Framework | Scope & Purpose | Script Command |
| :--- | :--- | :--- | :--- |
| **Unit** | Vitest | Pure functions, domain calculations (SRS, intervals, kana parsing), service methods. | `pnpm test` |
| **Integration** | Vitest + Testing Library | Component interaction, context providers, API route handlers, NestJS controllers. | `pnpm test` |
| **Bug Regression** | Vitest (`-t "regression"`) | Explicit tests reproducing resolved bugs to prevent future regressions. | `pnpm test:regression` |
| **Visual Regression** | Playwright (`@playwright/test`) | Pixel-level screenshot comparisons across 320px (mobile) and 1280px (desktop). | `pnpm test:visual` |
| **Pre-PR Master Gate** | Monorepo Pipeline | Runs type checks, lint, unit/integration, bug regressions, and visual tests. | `pnpm verify:pr` |

---

## 2. Bug Regression Testing Protocol

### 2.1 The Zero-Unverified-Fix Policy
> **MANDATORY**: Never push a bug fix without an automated regression test that specifically replicates the failing scenario. The test must fail before the fix and pass once the fix is applied.

### 2.2 Hybrid Organization Structure
Regression tests follow a standardized hybrid structure depending on scope:

1. **In-File Regressions (Local Unit Bugs)**:
   - For isolated bugs confined to a single component or utility, place regression tests directly in the existing `.spec.ts(x)` file.
   - Use an explicit `describe` block or test case tagged with `regression [BUG-<id>]`:
     ```typescript
     describe('regression [BUG-104]: empty notes reset on refresh', () => {
       it('preserves cached notes when server returns empty array on cold reload', async () => {
         // ...
       });
     });
     ```

2. **Dedicated Regression Files (Integration & Cross-Module Bugs)**:
   - For bugs involving state lifecycles, cross-context synchronization, offline storage, or multiple endpoints, create a dedicated regression test file:
     - Web: `apps/web/src/__tests__/regressions/<feature>.regression.spec.ts(x)`
     - API: `apps/api/src/common/<feature>.regression.spec.ts`
   - Must follow the naming format `*.regression.spec.ts(x)`.

### 2.3 Mandatory Regression Metadata
Every regression test block or file must document:
- **Bug ID / PR**: Reference to the issue or pull request (e.g., `[BUG-72]`, `[PR-85]`).
- **Symptom & Failure State**: What broke and under what exact conditions.
- **Root Cause**: The underlying flaw that caused the defect.
- **Edge Cases Tested**:
  - Offline mode / network timeout.
  - Page refresh (`F5`) / cold start.
  - Unauthenticated / token expiration states.
  - Debounce, cancellation, and rapid user interactions.

### 2.4 Running Bug Regressions
```bash
# Run all bug regressions across the entire monorepo
pnpm test:regression

# Run web bug regressions only
pnpm --filter web test:regression

# Run API bug regressions only
pnpm --filter api test:regression
```

---

## 3. Visual Regression Testing Protocol

Visual regression tests safeguard against layout clipping, CSS breaking changes, responsive overflow, and styling inconsistencies across screen sizes.

### 3.1 Playwright Setup & Baselines
Visual tests run in `apps/web/e2e/visual/` via `@playwright/test`:
- **Configuration**: [apps/web/playwright.config.ts](file:///home/weltonsf/Projetos/nipponic/apps/web/playwright.config.ts)
- **Target Projects**:
  1. `mobile-320px`: 320×667 viewport with mobile emulation (Strict compliance with **Critical Rule 5: 320px Mobile-First Baseline**).
  2. `desktop-1280px`: 1280×720 viewport.
- **Snapshot Parameters**:
  - `animations: 'disabled'` to prevent timing flakes.
  - `maxDiffPixelRatio: 0.02` tolerance for minor font antialiasing variations.

### 3.2 Required Visual Checks
1. **Zero Horizontal Overflow**:
   Visual tests must assert that document width does not exceed client width:
   ```typescript
   const hasHorizontalOverflow = await page.evaluate(() => {
     return document.documentElement.scrollWidth > document.documentElement.clientWidth;
   });
   expect(hasHorizontalOverflow).toBe(false);
   ```
2. **Page-Level Baseline**:
   ```typescript
   await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
   ```
3. **Component-Level Baseline**:
   ```typescript
   const header = page.locator('header').first();
   await expect(header).toHaveScreenshot('header-navigation.png');
   ```

### 3.3 Running and Updating Visual Snapshots
```bash
# Run visual regression tests against existing baselines
pnpm test:visual
# or for web only
pnpm --filter web test:visual

# Update snapshot baselines when an intentional design change is made
pnpm test:visual:update
# or for web only
pnpm --filter web test:visual:update
```

> [!NOTE]
> Snapshot images are tracked in git under `apps/web/e2e/visual/*-snapshots/`. Always generate and update snapshots on Linux (or Docker) to match the CI environment rendering.

---

## 4. Pre-PR Local Verification Gate (`pnpm verify:pr`)

Before submitting a pull request, developers and AI agents **MUST** execute the complete validation gate:

```bash
pnpm verify:pr
```

This single command executes all validation layers sequentially:
1. `pnpm check-types` — Type safety verification across all workspaces.
2. `pnpm lint` — Static code analysis.
3. `pnpm test` — Unit and integration test suites.
4. `pnpm test:regression` — Bug regression test suites.
5. `pnpm test:visual` — Visual regression screenshot comparisons.

If any check in this chain fails, the issue must be resolved locally before opening the PR.

---

## 5. CI/CD Workflow & PR Blocking Rules

GitHub Actions executes every pull request and push to `main` through [.github/workflows/ci.yml](file:///home/weltonsf/Projetos/nipponic/.github/workflows/ci.yml):

1. **`verify` Job**:
   - Runs `pnpm check-types`.
   - Runs `pnpm test` (Unit & Integration).
   - Runs `pnpm test:regression` (Bug Regressions).
   - Any failure fails the check run immediately.

2. **`visual-regression` Job**:
   - Builds the production web application (`pnpm --filter web build`).
   - Executes Playwright across `mobile-320px` and `desktop-1280px` viewports.
   - **PR Blocking**: Any visual pixel difference exceeding tolerance or test failure results in a failing check run (`conclusion: failure`), blocking PR merge.
   - **Artifact Upload**: When a visual test fails, GitHub Actions automatically uploads:
     - `playwright-visual-report`: Full interactive HTML test report.
     - `playwright-visual-diffs`: Actual, expected, and diff screenshot comparison images for immediate visual inspection.
