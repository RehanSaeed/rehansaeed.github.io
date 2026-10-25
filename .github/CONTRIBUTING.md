# Contributing

All contributions, however small, are valued!

## Pull requests

Open a pull request directly; you do not need to raise an issue or get approval
before contributing. Keep changes focused and explain what changed and why.
Link an existing issue if it provides useful context, but an issue is not required.

## Coding guidelines

- Follow [`.editorconfig`](../.editorconfig) and the existing code conventions.
- Use ESLint for linting and Prettier for formatting.
- The pre-commit hook formats staged Markdown, JSON and stylesheet files with
  Prettier, and runs ESLint fixes and Prettier on staged JavaScript, TypeScript
  and Vue files.
- Add tests for behavior changes and make sure checks pass.

## Dependency updates

Commit `package.json` and its regenerated `package-lock.json` together. Run
`npm ci`, `npm run build`, `npm run typecheck`, `npm run lint`, and the relevant
Playwright tests before merging an update.

Renovate uses full installs (`skipInstalls: false`) to update the lockfile.
npm's lockfile-only path tries to inspect bundled dependencies, including
`@mdream/rust-wasm32-wasi`, by fetching their resolved tarball URLs. With npm 12's
remote-fetch policy this fails with `EALLOWREMOTE`, even for registry packages.
Full installs avoid that path without enabling arbitrary remote dependencies.
Renovate's default lifecycle-script restrictions remain enabled.

Keep TypeScript on version 6 while `vue-tsc` requires its JavaScript compiler
API. A direct TypeScript 7 upgrade fails resolving `typescript/lib/tsc`; a
regenerated lockfile does not fix this. Remove the version restrictions from
`renovate.json` and `.github/dependabot.yml` only after Vue/Nuxt checking supports
the native compiler and the project's type checking passes. See Microsoft's
[embedded-language compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#typescript-and-embedded-languages).
