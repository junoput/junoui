# Table / data grid

Dense, scannable rows that read like instrument readouts — numbers in mono and
right-aligned, semantic color reserved for status, and the active-cyan rail marking the
row in focus. junoui dresses a **real `<table>`** and ships the **look + the ARIA
contract**; the app owns sort, selection, inline-edit, pagination, and filtering.

## Web

```html
<div class="juno-table-scroll">
  <table class="juno-table juno-table--zebra juno-table--sticky">
    <thead>
      <tr>
        <th aria-sort="ascending">SERVICE</th>
        <th class="juno-table__num" aria-sort="none">CPU</th>
        <th>STATUS</th>
      </tr>
    </thead>
    <tbody>
      <tr aria-selected="true">
        <td class="juno-table__id">api-gateway</td>
        <td class="juno-table__num">62</td>
        <td><span class="juno-badge juno-badge--soft juno--nominal">HEALTHY</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

| Class                      | Effect                                                                  |
| -------------------------- | ----------------------------------------------------------------------- |
| `.juno-table-scroll`       | Overflow-scrolling viewport (`max-block-size: 480px`) + thin scrollbar. |
| `.juno-table`              | The `<table>`: header `s2`, mono numerics, `border` row rules.          |
| `.juno-table--sticky`      | Header holds (`position: sticky`) while the body scrolls.               |
| `.juno-table--zebra`       | Stripes even body rows (`s2` dark / `s1` light).                        |
| `.juno-table--compact`     | Tighter row padding (per-table; independent of global density).         |
| `.juno-table--stack`       | Phone mode: rows become label/value cards below 480px (see below).      |
| `th[aria-sort]`            | Marks a sortable column; `ascending` / `descending` draw the arrow.     |
| `tr[aria-selected="true"]` | Active rail (left) + cyan row wash.                                     |

### Cell flavors

| Class                   | Use                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `.juno-table__id`       | Identifier — mono, bold (codes, hostnames, IDs).                                                                           |
| `.juno-table__num`      | Numeric — mono, bold, end-aligned (measured values).                                                                       |
| `.juno-table__mono`     | Secondary mono (routes, sub-codes) — quieter `label` color.                                                                |
| `.juno-table__time`     | Timestamp — mono, end-aligned, muted.                                                                                      |
| `.juno-table__trend`    | Role-colored mono delta; author supplies the `▲` / `▼` + sign.                                                             |
| `.juno-table__meter`    | Inline track + role fill + value; set `--juno-table-fill` (0–100).                                                         |
| `.juno-table__actions`  | Icon buttons (`__action`), revealed on row hover / focus.                                                                  |
| `.juno-badge--soft`     | Status as a low-fill role chip (see [badge](./badge.md)).                                                                  |
| `.juno-table__check`    | Selection-column cell (44px, centered). Holds a `.juno-checkbox`.                                                          |
| `.juno-table__editable` | Editable cell: dashed `__mark` underline + hover ring. App swaps `__mark` for a `.juno-table__edit-input` on double-click. |

### Overflow (set on a cell)

| Class                   | Behavior                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `.juno-table__truncate` | Single line + ellipsis (default). Pair with a `title` / tooltip.      |
| `.juno-table__clamp`    | Two lines, then ellipsis. Wrap the text in `.juno-table__clamp-text`. |
| `.juno-table__wrap`     | Full value; row grows. Reserve for one descriptive column.            |

All three cap at `--juno-cell-max` (default 240px).

### Stacked mode (phone widths)

Wide tables don't shrink — they either scroll (the default: `.juno-table-scroll`
scrolls sideways too) or **stack**. Opt in with `.juno-table--stack`, give every
`td` a `data-label` echoing its column header, and make the wrapper a container:

```html
<div class="juno-table-scroll" style="container-type: inline-size">
  <table class="juno-table juno-table--stack">
    <tbody>
      <tr>
        <td data-label="FLIGHT" class="juno-table__id">JU-204</td>
        <td data-label="ALT" class="juno-table__num">37,000</td>
      </tr>
    </tbody>
  </table>
</div>
```

Below a 480px container the header row hides, each row becomes a bordered card,
and each cell renders as a label/value pair (the `data-label` becomes the label).
The selection rail moves to the card's edge, and row actions stay visible (no
hover on touch). Semantics stay a real `<table>` — only the display flips.

### Framing rows

`.juno-table__toolbar` (top), `.juno-table__foot` (bottom), and `.juno-table__bulk`
(the selection bar — role `active`, with `.juno-table__bulk-count`) are flex rows you
stack around the scroll viewport. Frame the whole thing in a [`.juno-card`](./card.md)
for the border + radius + clipped corners.

### States

- `.juno-table__skeleton` — shimmer bar for loading rows (honors `prefers-reduced-motion`).
- `.juno-table__empty` + `.juno-table__empty-icon` — the no-data block.

## Anatomy (any platform)

- Header: `s2`, `font.size.10` uppercase `label`, `control-edge` underline, sticky.
- Body cell: `space.12`/`space.16` padding (`space.8` block when compact), `border` rule,
  `data` text. Numerics mono + bold + end-aligned.
- Selected row: `active` left rail (`border.width.3`) + `color-mix(active 11%)` wash.
- Status is a soft badge per row; caution / warning tint **only the note**, never the
  whole row, so the grid stays calm.

## Usage (the app's half)

junoui can't sort or select in CSS — wire these and keep the ARIA in sync:

- **Sort:** click a `th`; set its `aria-sort` to `ascending` / `descending` (others to
  `none`) and reorder the rows.
- **Select:** a `.juno-checkbox` per row (in a `.juno-table__check` cell) toggles
  `aria-selected` on the `<tr>`; reflect the count in a `.juno-table__bulk` bar. The
  header "select all" checkbox drives every visible row (use `indeterminate` for a
  partial set).
- **Inline edit:** swap the cell's text for an [`.juno-input`](./input.md) on
  double-click; Enter commits, Esc cancels.
- **Paginate / filter:** owned by the app; `.juno-table__foot` is just the frame.

`showcase/app.js` (`initTables`) is a reference driver for sort + selection.
