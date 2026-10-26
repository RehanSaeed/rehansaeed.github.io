# Code blocks

Fenced code blocks keep their build-time Shiki highlighting. Existing language,
`[Title]`, `{2,4-5}` highlighted-line and `line-numbers` options still work.

After JavaScript loads, each block has icon-only **Copy code** and **Wrap lines**
controls overlaid at its top right. They appear on hover or keyboard focus and
remain visible on touch screens. Both have tooltips (dismissible with Escape).
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

The same pattern supports npm/pnpm or other alternatives. Each group is
independent. Left/Right arrows switch tabs, Home/End select the first/last tab,
and Tab moves into the controls and active panel. Wrapping is local to each block
or group; a reader's choice persists when switching that group's tabs.

Without JavaScript, all alternatives remain visible and interactive controls are
hidden. The `/cheat-sheet/` draft demonstrates wrapping and multiple groups.
