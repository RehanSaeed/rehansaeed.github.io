# Code blocks

Fenced code blocks keep their build-time Shiki highlighting. Existing language,
`[Title]`, `{2,4-5}` highlighted-line and `line-numbers` options still work.

After JavaScript loads, each block has icon-only **Copy code** and **Wrap lines**
controls overlaid at its top right. They appear on hover or keyboard focus and
remain visible on touch screens. Both have tooltips (dismissible with Escape).
Single-line blocks vertically centre the controls; longer blocks keep them at
the top right.
The copy icon animates into a check mark on success; the wrap control animates
between wrapping and horizontal-line icons. Reduced-motion preferences disable
these animations.
Copying preserves the rendered source, including indentation and newlines, without
titles, line numbers or controls. Success is announced briefly; clipboard errors
show a manual-copy instruction. Clipboard access requires a secure context
(HTTPS or localhost) and browser permission.

Lines scroll horizontally by default. Readers can toggle wrapping without
changing the source; add `wrap` to a fence's metadata to enable it initially:

````markdown
```js [example.js] wrap line-numbers
const message = "A long line of code.";
```
````

Group alternatives using the existing container syntax, with blank lines around
the fences. Each group must contain at least two code fences and nothing else.
Use fence titles as tab labels; the language is the fallback label. Mermaid
diagrams are not code alternatives.

````markdown
::: code-group

```bash [Bash]
echo "Hello"
```

```powershell [PowerShell]
Write-Output "Hello"
```

:::
````

Tabs use the full-width Editor style: equal-width choices filling a rounded
header on the top edge of the code panel, with an accent top edge on the active tab.
Native buttons use the ARIA tablist/tab/tabpanel pattern, with selected
state, linked tab/panel IDs and roving keyboard focus.
Each alternative retains its language-specific styling, including PowerShell's
blue background and dark-theme syntax colours in both site themes.

The same pattern supports npm/pnpm or other alternatives. Each group is
independent. Left/Right arrows switch tabs, Home/End select the first/last tab,
and Tab moves into the controls and active panel. Wrapping is local to each block
or group; a reader's choice persists when switching that group's tabs.

Without JavaScript, all alternatives remain visible and interactive controls are
hidden. The `/cheat-sheet/` draft documents the Markdown syntax and demonstrates
wrapping and Bash/PowerShell alternatives.

## Comparing control styles locally

The blog uses the shared bordered `UButton` controls (option C). They appear at
the top right on code-block hover or keyboard focus; touch devices keep them
visible. Code groups use the Editor, full width tab style.

Run `npm run dev` and open `/dev/code-controls/` to compare the original controls,
the real shared `UButton` (plain and bordered), and soft/grouped alternatives.
The `#tab-styles` section also offers attached, underline, segmented, pill and
editor-style Bash/PowerShell tabs, with separate content-width and full-width
Editor examples. These use the real renderer and highlighting;
all styles retain the same accessible tab semantics and keyboard behaviour.
The attached-tab example keeps the code panel's exposed top-right corner rounded.
Each example uses the same build-time-highlighted sample and working copy/wrap
controls. Toggle all controls, narrow examples, or the theme to compare states;
the preference radio buttons do not change the production default.

This playground route is registered only in development and is not published.
Its browser tests are opt-in: set `CODE_CONTROLS_PLAYGROUND=1` and `BASE_URL` to
the dev server, then run `npx playwright test code-control-playground.spec.ts`.
