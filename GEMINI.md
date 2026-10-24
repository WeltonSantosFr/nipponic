# Nipponic - Project Rules & Guidelines

These rules are mandatory for all AI agents and developers working on the Nipponic codebase. They must be consulted and strictly followed on every request.

---

## 1. Language & Internationalization (CRITICAL RULE)

> **MANDATORY**: ALL in-app texts MUST ALWAYS be written in **English**. There are NO exceptions to this rule.

- **In-App Copy Scope**:
  - UI components (buttons, headers, navigation, footers, tabs, cards, dropdowns)
  - Modals, dialogs, drawers, and forms
  - Placeholder texts and input labels
  - Notifications (push notifications, local device notifications, scheduled study reminders, channel names & descriptions)
  - Toast messages, banners, and snackbars
  - Error messages, loading indicators, and empty states
  - Offline fallback pages (`offline.html`) and service worker communications
- **Language Boundaries**:
  - **English (`en`)**: Mandatory for all application interfaces, UX copy, and notification texts.
  - **Japanese (`ja`)**: Reserved exclusively for learning content (kanji, kana, example sentences, vocabulary definitions, audio transcriptions).
  - **Portuguese (`pt-BR`)**: May be used for communicating with the user in chat or repository documentation (`README.md`) when requested, but **NEVER inside the application UI, notifications, or source code strings**.

---

## 2. Git & Branching Strategy

- **Never commit directly to `main`**.
- Always create a new feature or fix branch off `main` before applying code changes:
  - `feat/<feature-name>` for new features or enhancements.
  - `fix/<issue-name>` for bug fixes and UI corrections.
  - `chore/<task-name>` for maintenance, dependencies, or type syncing.
  - `docs/<subject>` for documentation updates.
- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `fix(notifications): translate notification channel and alerts to English`
  - `feat(mobile): add offline study sessions`

---

## 3. Architecture & Monorepo Structure

- **Monorepo Management**: Powered by **pnpm workspaces** and **Turborepo**.
  - `apps/web`: Next.js frontend, PWA, and Capacitor Android mobile wrapper.
  - `apps/api`: NestJS backend API.
  - `packages/shared`: Shared types, DTOs, and SRS algorithms.
- **Dependency Management**: Use `pnpm` exclusively (never `npm` or `yarn`). Run workspace commands using `--filter` (e.g. `pnpm --filter web <command>`).

---

## 4. Code Quality & Testing

- **Strict Typing**: Maintain strict TypeScript adherence without bypassing types with `any`.
- **Automated Verification**:
  - Always run the relevant test suite before completing any modification (`pnpm --filter web test`, `pnpm --filter api test`, etc.).
  - Ensure existing tests pass and add unit tests for new services, utilities, or behavioral logic.
  - Check for type errors and build status when applicable.
- **Mandatory Bug Regression Testing**:
  - For every bug fix, always create dedicated automated regression tests that specifically replicate and validate the failing scenario before marking the task complete.
  - Ensure tests cover edge cases (e.g., offline mode, page reload/refresh, unauthenticated state, debounce/flush lifecycles).

---

## 5. Mobile-First Responsive Layout & Breakpoint Standards (CRITICAL RULE)

> **MANDATORY**: ALL user interfaces MUST be designed mobile-first and strictly support viewports down to **320px** (e.g., iPhone SE, Galaxy Fold outer display, narrow split screens, mobile PWA / Capacitor). There must be ZERO horizontal overflow or horizontal page body scrolling.

- **Baseline Viewport (320px)**:
  - Every screen, modal, card, drawer, and interactive component must render legibly and correctly at `320px` width without content clipping or horizontal overflow.
  - Root containers and scroll views must enforce `w-full min-w-0 max-w-full overflow-x-hidden`.
- **Padding Scaling & Safe Areas**:
  - Never use static large paddings (e.g. `p-6`, `p-8`) on outer page containers. Always use responsive scaling:
    - Main page containers: `p-3 sm:p-6 md:p-8`.
    - Cards & panels: `p-3.5 sm:p-5` or `p-3.5 sm:p-6 md:p-8`.
  - Always apply safe area padding utilities for mobile notches and system bars: `pb-safe`, `pt-safe`.
- **Flexbox Shrinking & Overflow Prevention (`min-w-0`)**:
  - In CSS flexbox, flex items default to `min-width: auto`. Any flex child that contains text with `truncate`, `line-clamp`, or flexible wrapping MUST explicitly include `min-w-0` (and `flex-1` when expanding).
  - Avoid fixed minimum widths on cards or inner elements (e.g. avoid `min-w-[260px]` without responsive prefixes; use `sm:min-w-[260px] min-w-0 w-full sm:w-auto`).
- **Action Stacking & Form Controls**:
  - Action buttons positioned side-by-side must stack vertically on mobile: `flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full`.
  - Action buttons inside stacked bars must expand to full width on mobile for easy touch targeting: `w-full sm:w-auto justify-center`.
  - Inline forms (input + submit button) must stack on mobile: `flex flex-col sm:flex-row gap-2 w-full min-w-0`, with input `w-full sm:flex-1 min-w-0` and button `w-full sm:w-auto justify-center`.
  - Option buttons and selection chips must use `w-full min-w-0 break-words`.
- **Compact Navigation on Small Screens**:
  - Multi-step wizards, tab bars, and header navigation must adapt gracefully on screens `< 640px`.
  - Use compact indicators (e.g. icon + step number `1`, `2`, `3`, `4`) with screen-reader accessible attributes (`aria-label="1. Theory"`, `aria-hidden="true"` on mobile text), expanding to full text labels on `sm+`.
- **Text & Media Wrapping**:
  - Headings, blockquotes, lists, and paragraphs in user-facing content or Markdown renderers must include `break-words min-w-0`.
  - Tables and code blocks must always be enclosed in isolated horizontal scroll containers (`overflow-x-auto rounded-xl border border-border/80 bg-card min-w-0 max-w-full`) so they never force the page to scroll horizontally.

