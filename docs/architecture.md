# Smart-Run Architecture Overview

This document provides a high-level tour of the Smart-Run code base. It is intended for new contributors and for the upcoming refactor that will introduce first-class monorepo support and a stricter clean-architecture layout.

---

## 1 – Execution Flow

1. **Binary entry-point** – `src/cli.ts`
   * Declares the `smart-run` CLI with *Commander*.
   * Delegates to feature modules by **lazy dynamic import** to keep start-up fast.

2. **Interactive runtime** – `src/index.ts`
   * Houses the primary `runSmartRun()` function that drives the interactive menu.
   * Detects the package manager, configuration format, builds the script menu and executes the selected script with `spawn`.

3. **Feature modules** – Single-responsibility helpers that are dynamically loaded by the CLI or the interactive runtime:
   | Module | Responsibility |
   | ------ | -------------- |
   | `ai-analysis.ts` | Orchestrates end-to-end AI analysis flow (prompt generation, calling `AIService`, config file creation). |
   | `ai-service.ts` | Thin wrapper around external LLM providers (currently OpenAI).  Provides `analyzeScripts()` and clipboard helpers. |
   | `config-linter.ts` | Static checks for `package-meta.yaml` / `scriptsMeta` best-practices.  Exposed via the `lint` command and the Git hook setup. |
   | `list-scripts.ts` | Non-interactive listing in JSON / table format. |
   | `migration.ts` | Converts legacy conventions (ntl, npm-scripts-info, better-scripts…) to Smart-Run native format. |
   | `preview.ts` | Pretty command preview outside of the interactive menu. |
   | `setup-aliases.ts` | Global shell alias installation. |
   | `git-hooks.ts` | Simple Git hook manager used by `smart-run hooks`. |

4. **Type declarations** – Domain types live alongside implementation today (mostly in `index.ts`).  They will be extracted to dedicated `types/` files during the clean-architecture refactor.

---

## 2 – Present Layering

```
CLI (Commander)            →  src/cli.ts
└─► Presentation Layer      →  src/index.ts (Inquirer/autocomplete UI)
    ├─► Domain Services     →  ai-service.ts, migration.ts, config-linter.ts …
    ├─► Infrastructure      →  child_process, fs, path, yaml, shiny-command-line
    └─► External Interfaces →  OpenAI API via ai-service.ts
```

Currently **presentation** and **domain logic** are intermixed inside `index.ts`.  The refactor will:

1. Extract pure domain logic (script discovery, grouping, validation) to a `core/` directory.
2. Keep all side-effectful infrastructure (fs, child_process) behind interfaces/adapters.
3. Isolate the Inquirer UI as a delivery mechanism, enabling future GUI or API front-ends.

---

## 3 – Configuration Support

Smart-Run recognises several configuration sources in **priority order**:

1. `package-meta.yaml` / `.json` – **Native** declarative format.
2. `scriptsMeta` object within `package.json`.
3. Conventional patterns parsed from `package.json`:
   * *npm-scripts-info* (`?` prefix or `scripts-info` field).
   * *ntl* and *better-scripts* descriptions.
   * Category comments (`\n# BUILD:`) for **npm-scripts organisation**.

Detection utilities live in `index.ts` and `migration.ts` today and will move to `core/config-detect.ts`.

---

## 4 – Upcoming Monorepo Support (Design Sketch)

* **Workspace detector** – Walk up from cwd until a root `package.json` / `pnpm-workspace.yaml` / `lerna.json` / `turbo.json` is found.
* **Package discovery** – Glob `**/package.json` inside declared workspace folders.
* **Aggregation service** – Builds a hierarchical model `{ workspace → package → scripts }`.
* **UI adaptation** – Adds a *Workspace & Package* selector layer above the existing script menu.

These features will live in a new `core/monorepo/` namespace with thin adapters for the CLI.

---

## 5 – External Dependencies

* **Commander** – CLI argument parsing.
* **Inquirer / autocomplete-standalone** – Interactive menus.
* **js-yaml** – YAML support.
* **shiny-command-line** – Command prettification.
* **OpenAI** – AI script grouping (optional).

---

## 6 – Testing Strategy

* Unit tests use **Vitest** (`test/` + `__tests__/` folders).
* Integration smoke tests live under `demo/` and `dist/` for built bundle validation.
* Pre-commit Git hooks can enforce config linting via `smart-run lint`.

---

## 7 – Build & Distribution

* TypeScript is compiled with `tsc` (`tsconfig.json`).
* Packages are published via **npm** with semantic-release (`.releaserc.json`).
* The final CLI entry (`bin`) is declared in `package.json` and built artefacts are placed in `dist/`.

---

## 8 – Known Pain-Points To Address

1. **God-file** `index.ts` exceeds 1 KLOC – split by concern.
2. Duplicate type definitions scattered across modules.
3. Tight coupling between UI and script-execution logic.
4. Limited test coverage on migration & linter paths.

These issues will be targeted in the clean-architecture refactor.

---

*End of document*
