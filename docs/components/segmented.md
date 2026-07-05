# Segmented control

An exclusive-choice pill row — filters (`ALL / PHOTOS / VIDEO`), mode switchers,
sort pickers. Native radios carry the state; zero JS.

## Web

```html
<fieldset class="juno-seg juno--active">
  <label class="juno-seg__opt"><input type="radio" name="kind" checked /><span>ALL</span></label>
  <label class="juno-seg__opt"><input type="radio" name="kind" /><span>PHOTOS</span></label>
  <label class="juno-seg__opt"><input type="radio" name="kind" /><span>VIDEO</span></label>
</fieldset>
```

JS-driven apps may use buttons instead — the app flips `aria-pressed`:

```html
<div class="juno-seg" role="group" aria-label="Kind">
  <button class="juno-seg__opt" aria-pressed="true">ALL</button>
  <button class="juno-seg__opt" aria-pressed="false">PHOTOS</button>
</div>
```

| Class            | Effect                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| `.juno-seg`      | The row (a `<fieldset>` or `role="group"`); wraps, `space.4` gap.       |
| `.juno-seg__opt` | One pill: label + hidden radio + `<span>`, or an `aria-pressed` button. |
| `.juno-seg--sm`  | Dense-toolbar size (`font.size.10`), matches `.juno-btn--sm`.           |
| `.juno--<role>`  | Color of the checked pill (default `data`-neutral).                     |

## Anatomy (any platform)

- Pill: B612, 700 weight, `font.size.11`, uppercase, tracking `font.tracking.label`,
  `space.4` × `space.10` padding, `radius.3`, 1px `border` outline.
- Checked: background `s3`, border + text take the role color.
- Hover (unchecked): background `s2`. Focus ring on the pill via `:focus-visible`.

## Usage

- Exclusive choice among 2–5 short options that should all stay visible; more than
  that, use a [select](./select.md).
- The radio flavor is a working form control with arrow-key group navigation for
  free — prefer it; reach for `aria-pressed` buttons only when state lives in JS.
- Wrap the radio flavor in a `<fieldset>` with a `<legend>` (may be visually hidden)
  so the group is announced.
