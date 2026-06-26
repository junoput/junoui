# Checkbox & Radio

Custom-styled native inputs (`appearance: none`) — keyboard and screen-reader support
come for free. The checkbox is a **targeting-reticle** square whose solid core drops in
on check; the radio is a ring with a center dot. Wrap with `.juno-choice` for a label row.

## Web

```html
<label class="juno-choice"> <input class="juno-checkbox" type="checkbox" checked /> TCAS </label>

<label class="juno-choice"> <input class="juno-radio" type="radio" name="mode" /> SELECTED </label>
<label class="juno-choice">
  <input class="juno-radio juno--target" type="radio" name="mode" checked /> MANAGED
</label>

<label class="juno-choice">
  <input class="juno-checkbox" type="checkbox" disabled /> Restricted
</label>
```

| Class            | Effect                                                    |
| ---------------- | --------------------------------------------------------- |
| `.juno-checkbox` | `space.16` reticle square; checked core + role ring-glow. |
| `.juno-radio`    | Same as a circle with a center dot.                       |
| `.juno-choice`   | Inline-flex label row; `gap-control`, `data` text.        |
| `.juno--<role>`  | Recolors the core/dot (default `active`).                 |
| `:checked`       | Border → role, 3px role glow, core scales in (spring).    |
| `:disabled`      | `s1` + dimmed; row text → `muted`.                        |

## Anatomy (any platform)

- Box `space.16` on `control-surface` with a `control-edge` border; checked adds a
  `border-width.3` ring at 22% role and a `space.8` core (spring scale-in).
- Label row: B612 `font.size.13`, `data`, `gap-control` between box and text.

## Usage

- Checkbox = independent toggles; radio = one-of-many (share a `name`).
- Keep the label inside the same `<label>` so the hit area covers both.
- For a single on/off with an emphasized track, use the [switch](./switch.md).
