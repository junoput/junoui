# Thumb

A media frame that never shows the browser's broken-image glyph. A muted
placeholder (icon on `s2`) sits under the media; the image covers it while
present. **Loading** is [skeleton](./skeleton.md)'s job — thumb handles media
that is **missing or failed**.

## Web

```html
<!-- normal: image covers the placeholder; aspect defaults to square -->
<figure class="juno-thumb">
  <img src="…" alt="Sunset clip" onerror="this.remove()" />
</figure>

<!-- non-square: override the ratio, not the aspect-ratio property -->
<figure
  class="juno-thumb juno-thumb--video"
  style="--juno-thumb-ratio: 16/9"
  role="img"
  aria-label="Preview unavailable"
>
  <figcaption class="juno-thumb__label">Unavailable</figcaption>
</figure>

<!-- selected, with corner overlays: a check top-left, a duration top-right -->
<figure class="juno-thumb juno-thumb--selected">
  <img src="…" alt="Sunset clip" onerror="this.remove()" />
  <span class="juno-thumb__corner juno-thumb__corner--top-start badge badge--sm">✓</span>
  <span class="juno-thumb__corner juno-thumb__corner--top-end badge badge--sm">0:42</span>
</figure>
```

| Class / attr                                                                          | Effect                                                                                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.juno-thumb`                                                                         | Frame: `s2` fill, hairline border, `radius.3`, centered glyph, aspect locked to `--juno-thumb-ratio` (default `1`).                              |
| `.juno-thumb--flush`                                                                  | Drops the border/radius — full-bleed tiles in a tight wall.                                                                                      |
| `.juno-thumb--selected`                                                               | Inset outline (`--juno-active`) — never a border, so nothing reflows on toggle. Apps own the state; junoui never adds/removes the class.         |
| `.juno-thumb--video`                                                                  | Play glyph instead of the image glyph.                                                                                                           |
| `.juno-thumb__label`                                                                  | Optional uppercase micro-caption under the glyph.                                                                                                |
| `.juno-thumb__corner`                                                                 | Absolutely-positioned slot over the media, `space.4` inset from the frame edge, above the media (`z-index: 1`). Pair with one position modifier. |
| `.juno-thumb__corner--top-start` / `--top-right` / `--bottom-left` / `--bottom-right` | Anchors the slot to a corner using logical `inset-block-*` / `inset-inline-*` — start/end swap correctly under `dir="rtl"`.                      |
| `> img` / `> video`                                                                   | Covers the frame (`object-fit: cover`).                                                                                                          |
| `onerror="this.remove()"`                                                             | The whole JS contract — optional, stateless, one attribute.                                                                                      |

## Anatomy (any platform)

- Frame: surface `s2`, 1px `border`, radius `3`; aspect locked by
  `--juno-thumb-ratio` (default square) so a media wall's scroll height is
  stable before anything loads — override per instance
  (`style="--juno-thumb-ratio: 16/9"`) or via the [tiles grid](../layout.md).
- Glyph: 28% of the frame (capped `space.32`), `muted` color — a missing thumb
  is **not** a warning state; the placeholder stays neutral.
- Media covers the full frame, center-cropped.
- Selection is an inset outline, not a border — the frame's box never
  changes size, so a wall re-flowing selection doesn't jitter.
- Corner slots are presentational anchors only; what occupies them (check
  icon, duration chip, storage-tier badge) is app vocabulary.

## Failure contract

There is no portable CSS-only way to detect a broken image, so the contract is
explicit:

- **Failed to load** → `onerror="this.remove()"`: the broken element removes
  itself, the placeholder underneath shows.
- **Known missing** (offline node, purged cache, no permission) → render no
  media element at all.
- When no media renders, the alt text is gone too — put the accessible name on
  the figure (`role="img"` + `aria-label`) or show a `__label`.

## Usage

- Media walls (pairs with `.juno-grid-auto--tiles`), avatars' big cousin,
  video poster slots, attachment previews.
- Keep the placeholder neutral; if failure _matters_ (broken pipeline), say it
  with a [badge](./badge.md) or [alert](./alert.md) next to the thumb.
- Multi-select galleries: toggle `--selected` per tile and put a check in a
  `__corner` slot; duration/storage-tier chips are `__corner` occupants too.
- Retry, lazy-load, LQIP/blur-up, and the selection/click behavior itself:
  app or `junoui-<framework>` territory.
