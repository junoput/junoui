# Tabs

A horizontal tablist with an active-cyan underline; the selected tab shows its panel.
junoui ships the look + the ARIA contract; the app owns switching, panel visibility, and
arrow-key roving focus.

## Web

```html
<div class="juno-tabs">
  <div class="juno-tabs__list" role="tablist" aria-label="Service detail">
    <button class="juno-tabs__tab" role="tab" id="t1" aria-controls="p1" aria-selected="true">
      OVERVIEW
    </button>
    <button class="juno-tabs__tab" role="tab" id="t2" aria-controls="p2" aria-selected="false">
      METRICS
    </button>
    <button
      class="juno-tabs__tab"
      role="tab"
      id="t3"
      aria-controls="p3"
      aria-selected="false"
      disabled
    >
      CONFIG
    </button>
  </div>
  <div class="juno-tabs__panel" role="tabpanel" id="p1" aria-labelledby="t1">…</div>
  <div class="juno-tabs__panel" role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
  <div class="juno-tabs__panel" role="tabpanel" id="p3" aria-labelledby="t3" hidden>…</div>
</div>
```

| Class                            | Effect                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| `.juno-tabs__list`               | The `role="tablist"` row; bottom rule the tabs sit on.         |
| `.juno-tabs__tab`                | A tab button. `label` at rest → `data` on hover.               |
| `.juno-tabs__tab[aria-selected]` | Selected: `active` text + `active` underline indicator.        |
| `.juno-tabs__tab:disabled`       | Dimmed, not selectable.                                        |
| `.juno-tabs__panel`              | The `role="tabpanel"`; `[hidden]` when its tab isn't selected. |

## Anatomy (any platform)

- Tabs sit on a 1px `border` rule; the selected tab paints a `border.width.2` `active`
  underline that overlaps the rule. Text `label` → `active` when selected.
- Panel gets `space.20` of leading space above its content.

## Usage (the app's half)

junoui can't switch panels in CSS — wire it and keep the ARIA in sync:

- On tab activation: set its `aria-selected="true"` (others `false`), unhide its panel
  (`[hidden]` on the rest), and move the roving `tabindex` (selected = `0`, rest = `-1`).
- **Keyboard:** `←` / `→` move between tabs (wrapping), `Home` / `End` jump to the ends;
  activation follows focus. `showcase/app.js` (`initTabs`) is a reference driver.
- For a stable layout, give panels equal-ish height or let content flow; don't animate
  height unless you measure it.
- Tabs never wrap: when the strip runs out of room (phone widths) it scrolls
  sideways, so every tab stays reachable. Keep labels short anyway — a scrolled
  tab is a hidden tab until swiped to.
