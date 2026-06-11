# Contributing

This is the **Stellar Scaffold UI monorepo** — the source for the official
frontend templates. `stellar scaffold init` instantiates it into a single-app
project; this guide is for contributors working on the monorepo itself, not for
users of a scaffolded project.

## Layout

| Path                     | What it is                                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/<framework>/` | Per-framework starter apps (React, Svelte, …)                                                                                                                                                                         |
| `app-lib/`               | `@stellar-scaffold/app-lib` — shared, framework-agnostic layer (util, env reader, display/business helpers, `styles.css`) plus the CLI-generated `app-lib/clients/` (Binding packages + flattened Clients `index.ts`) |
| `contracts/`             | Example Soroban contracts (Tutorial + vendored OpenZeppelin)                                                                                                                                                          |
| `e2e/`                   | Playwright parity + visual suite                                                                                                                                                                                      |

`init` keeps `app/` + `app-lib/` + `contracts/`, plus a slimmed `e2e/` — its
self-adapting config targets the single `app/`, and the per-framework snapshot
baselines are pruned. Only the contributor-only `templates/` is removed.

## Developing a template in place

There is no single app to run at the monorepo root — `npm start` there just
signposts (see `scripts/dev-guard.mjs`). Run a specific template instead:

```bash
npm install                            # once, at the root (workspaces)
npm start --workspace templates/react
npm start --workspace templates/svelte
```

Each runs `stellar scaffold watch --build-clients` alongside the dev server, so
you need the **Stellar CLI** and **Stellar Scaffold CLI** installed (the root
`npm start` prints install instructions if either is missing).

Shared code lives in `app-lib/`; changes there are picked up by every template
via the `@stellar-scaffold/app-lib` workspace package. Keep framework-specific
code (providers/stores, UI components) in the templates.

## Tests

The `e2e/` Playwright suite runs the **same specs against every framework**, so
a feature that works in React but not Svelte (or vice versa) fails the build —
this is how parity between templates is enforced.

```bash
npm test --workspace e2e               # or: cd e2e && npx playwright test
```

- **Smoke parity** (`smoke.spec.ts`) — framework-agnostic assertions: app
  mounts, wallet Connect button, Contract Explorer link, GuessTheNumber form.
- **Visual regression** (`visual.spec.ts`) — per-framework screenshot baselines.
  An intended visual change is reviewed and re-baselined:

  ```bash
  cd e2e && npx playwright test --update-snapshots
  ```

  Baselines are committed and platform-specific (`*-darwin.png` locally; CI on
  Linux needs its own set).

`e2e/playwright.config.ts` self-adapts: it targets every
`templates/<framework>/` in the monorepo, and the single `app/` after `init`.
