# Contributing

All contributions, however small, are valued!

## Pull requests

Open a pull request directly; you do not need to raise an issue or get approval
before contributing. Keep changes focused and explain what changed and why.
Link an existing issue if it provides useful context, but an issue is not required.

## Coding guidelines

- Follow [`.editorconfig`](../.editorconfig) and the existing code conventions.
- Use ESLint for linting and Prettier for formatting.
- The pre-commit hook lints and formats staged files.
- Add tests for behaviour changes.

## Checking your changes

Install dependencies with `npm ci` and preview the site with `npm run dev`.
Before submitting code changes, run `npm run build`, `npm run typecheck`,
`npm run lint` and the relevant Playwright tests. `npm test` runs the browser
suite against the built site.

For dependency updates, commit `package.json` and `package-lock.json` together.

## Images

Optimise new or changed images without reducing their required quality. Use PNG
for images with transparency and `.jpg` for photographs. Keep images tracked
with Git LFS as configured in [`.gitattributes`](../.gitattributes).

After adding or changing an image in `public/` or `content/`, run
`npm run images:avif` and include its generated `.avif` companion alongside the
original.
