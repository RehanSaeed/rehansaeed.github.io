# Tooltips

Use the auto-imported `u-tooltip` instead of a native `title` attribute:

```vue
<u-tooltip v-slot="{ trigger }" text="Search" placement="left">
  <u-button v-bind="trigger" aria-label="Open search" @click="openSearch">
    <u-icon name="feather:search" />
  </u-button>
</u-tooltip>
```

Bind `trigger` to one native element or a component that forwards attributes and
events to its native root. Keep an accessible name on icon-only controls; a
tooltip provides a description, not a replacement name. Non-interactive elements
that need a keyboard-accessible tooltip should have `tabindex="0"`.

`placement` accepts `top` (default), `right`, `bottom` or `left`. Tooltips flip to
other sides when needed, stay within the viewport, and point back to their
trigger. Placement is a preference, not a fixed side: Floating UI handles
collision detection, shifting, arrow positioning and updates during scrolling,
resizing and trigger animations. Updates run only while the tooltip is mounted.
Tooltips appear on hover or keyboard-visible focus, remain open while hovered,
and dismiss on Escape, blur, pointer exit or activation. Pointer focus does not
keep a hover tooltip open after the pointer leaves. A native dialog's initial
autofocus does not open a tooltip; using Tab within the dialog still does.
Touch taps activate the control without waiting for a tooltip.

The component adds no wrapper around its trigger, preserving grid/flex placement.
When converting a component's root to `u-tooltip`, disable attribute inheritance
and forward `$attrs` to the trigger (as in `avatar.vue` and `theme-button.vue`).
The tooltip is teleported to `body` (or its trigger's native dialog) and uses the
popover top layer, so clipping does not hide it and modals do not make it inert.

Style `.tooltip` and its directional arrow in `tooltip.vue`. It uses the site's
accent, page background and text colours in both themes. Global overrides can
set `--tooltip-border-color`, `--tooltip-background` and `--tooltip-color` on
`:root` or a theme selector. Trigger-local variables do not inherit through the
teleport. Tooltip text is plain text; keep interactive content in a dialog.

Icon-only controls and image links use tooltips to explain their action or
destination. Generated article heading links use the global Content component
`SectionLink`, whose required `label` prop supplies both the tooltip text and
accessible name. The Markdown pipeline passes "Link to this section". Its native
link keeps the section fragment, while only the decorative SVG is hidden from
assistive technology.
