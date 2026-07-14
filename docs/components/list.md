# List

Grouped rows for vertical data organization — the settings-screen pattern.
Labeled groups of full-width rows; each row carries a leading icon, a label
(with optional support line), and a trailing value, control, or drill-in
chevron. The phone-first sibling of the [table](./table.md): use a list when
each record is a _destination or setting_, a table when you compare columns.

## Web

```html
<section class="juno-list">
  <h3 class="juno-list__header">Playback</h3>
  <ul class="juno-list__group">
    <li>
      <a class="juno-list__row" href="/settings/quality">
        <svg class="juno-icon juno-list__icon" aria-hidden="true">
          <use href="…#juno-i-sliders" />
        </svg>
        <span class="juno-list__main">
          <span class="juno-list__label">Quality</span>
          <span class="juno-list__support">Streaming resolution</span>
        </span>
        <span class="juno-list__value">1080p</span>
        <svg class="juno-icon juno-list__chevron" aria-hidden="true">
          <use href="…#juno-i-caret-right" />
        </svg>
      </a>
    </li>
    <li>
      <div class="juno-list__row">
        <span class="juno-list__main"><span class="juno-list__label">Autoplay</span></span>
        <label class="juno-switch juno-switch--sm"
          ><input class="juno-switch__input" type="checkbox" role="switch" checked /><span
            class="juno-switch__track"
          ></span
        ></label>
      </div>
    </li>
  </ul>
</section>
```

| Class                 | Effect                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `.juno-list`          | Stack of header + group(s).                                         |
| `.juno-list__header`  | Uppercase group label above the group.                              |
| `.juno-list__group`   | `s1` card frame; rows divided by hairlines, corners rounded.        |
| `.juno-list__row`     | Row ≥ `size.tap.comfortable`; `<a>`/`<button>` rows get hover.      |
| `.juno-list__icon`    | Leading glyph, label-toned.                                         |
| `.juno-list__main`    | Label + optional support line; truncates, takes the flexible space. |
| `.juno-list__label`   | Primary text.                                                       |
| `.juno-list__support` | Secondary line under the label.                                     |
| `.juno-list__value`   | Trailing mono value.                                                |
| `.juno-list__chevron` | Drill-in caret (`caret-right`), muted.                              |

## Anatomy (any platform)

- Group = `s1` surface, hairline `border`, `radius.8`; rows split by hairlines
  drawn between rows only (no doubled edges).
- Row ≥ `size.tap.comfortable` tall, `space.16` inline padding, `space.12`
  gap between slots. Label `font.size.13` data-toned; support `font.size.11`
  label-toned; value mono `font.size.12`.
- Only interactive rows respond: hover/focus fills `s2` (transitioned over
  `motion.duration.quick`); a tap deepens to `s3` and slides the drill-in chevron
  forward — mirrored under RTL, where the chevron also flips. See
  [motion.md](../motion.md).

## Usage

- Trailing slot takes whatever fits the row's job: a mono value, a
  [badge](./badge.md), a [switch](./switch.md), or the chevron when the row
  drills into a detail view (pair the pushed view with a
  [navbar](./navbar.md) back control).
- A chevron row must be an `<a>` (or `<button>`) — the whole row is the tap
  target, never just the caret.
- Static key→value screens can skip `<ul>`/`<li>` and stack `div.juno-list__row`
  directly inside `.juno-list__group`; keep list semantics when rows navigate.
- Don't put two controls in one row — a row is one target. Split it.
