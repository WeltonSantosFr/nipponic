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
