# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the TypeScript source. The public entry point is `src/index.ts`; core modules live in `src/client.ts`, `src/types.ts`, `src/encryption.ts`, and `src/errors.ts`.
- `docs/` holds documentation; `docs/TECHNICAL_DOC.md` is the authoritative API and behavior reference.
- `dist/` is the compiled output from `tsc` and is published to npm (do not edit by hand).
- Root configuration lives in `package.json`, `tsconfig.json`, `oxlint.json`, and `oxfmt.json`.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies (pnpm is required).
- `pnpm build`: compile TypeScript to `dist/` via `tsc -p tsconfig.json`.
- `pnpm lint`: run `oxlint` on `src/**/*.ts`.
- `pnpm format`: run `oxfmt` on source and docs.
- `pnpm prepare`: install Husky hooks (runs on install and configures pre-commit checks).

## Coding Style & Naming Conventions

- TypeScript with ESM (`"type": "module"`). Use `.js` extensions in local imports inside `src/` (example: `./errors.js`) to match emitted output.
- Indentation is 2 spaces; keep functions focused with early validation (see `src/client.ts`).
- Public types and interfaces are prefixed with `Bark` (example: `BarkPushOptions`).
- SDK-facing option names are camelCase (`deviceKey`, `autoCopy`) and mapped to API fields internally.
- Formatting and linting are enforced by `oxfmt` and `oxlint` (Husky runs both on commit).

## Testing Guidelines

- No test framework or `pnpm test` script is configured yet, and there are no coverage targets.
- If adding tests, introduce a `tests/` (or `src/__tests__/`) directory, adopt a `*.test.ts` naming pattern, and add a `pnpm test` script.

## Commit & Pull Request Guidelines

- Git history only contains an `init` commit, so there is no established commit convention.
- Use short, imperative commit messages and keep commits scoped to one change.
- For PRs: include a concise description, link issues, and call out any API or docs changes.
- Run `pnpm lint`, `pnpm format`, and `pnpm build` before release-related changes.

## Configuration & API Tips

- The SDK defaults to `https://api.day.app` and requires a `deviceKey`; pass `baseUrl` for self-hosted servers.
- Runtime requires Node.js >= 18 and a `fetch` implementation (custom `fetch` can be injected via `BarkClient` options).
