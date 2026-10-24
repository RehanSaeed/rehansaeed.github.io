# Contributing

All contributions, however small, are valued!

## Pull requests

Open a pull request directly; you do not need to raise an issue or get approval
before contributing. Keep changes focused and explain what changed and why.
Link an existing issue if it provides useful context, but an issue is not required.

## Coding guidelines

- Follow [`.editorconfig`](../.editorconfig) and the existing code conventions.
- Use ESLint for JavaScript, TypeScript and Vue linting. Fix all lint warnings
  before submitting; `npm run lint:fix` applies available fixes.
- Use Prettier for formatting. Its configuration and lint-staged rules are in
  [`package.json`](../package.json). The Husky pre-commit hook runs ESLint fixes
  followed by Prettier on staged JavaScript, TypeScript and Vue files, and Prettier
  on staged JSON and stylesheet files.
- For other supported files, including Markdown, format the files you changed
  with `npx --no-install prettier --write <file>`. Check formatting without changing
  files with `npx --no-install prettier --check <file>`. Avoid unrelated formatting
  changes.
- Add regression tests for behavior changes. Run `npm run build`,
  `npm run typecheck`, `npm run lint`, and `npm test` before submitting code changes,
  and include the results in your pull request. For documentation-only changes,
  check formatting and links.

## Special thanks

As thanks for all contributions, your username will be posted to the front page of the project with a short description of how you helped.
