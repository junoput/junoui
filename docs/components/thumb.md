# Thumb

A media frame that never shows the browser's broken-image glyph. A muted
placeholder (icon on `s2`) sits under the media; the image covers it while
present. **Loading** is [skeleton](./skeleton.md)'s job — thumb handles media
that is **missing or failed**.

## Web

```html
<!-- normal: image covers the placeholder -->
<figure class="juno-thumb" style="aspect-ratio: 1">
  <img src="…" alt="Sunset clip" onerror="this.remove()" />
</figure>

<!-- known-missing: ship no <img>; the placeholder just shows -->
<figure
  class="juno-thumb juno-thumb--video"
  style="aspect-ratio: 16/9"
  role="img"
  aria-label="Preview unavailable"
>
  <figcaption class="juno-thumb__label">Unavailable</figcaption>
</figure>
```

| Class / attr              | Effect                                                         |
| ------------------------- | -------------------------------------------------------------- |
| `.juno-thumb`             | Frame: `s2` fill, hairline border, `radius.3`, centered glyph. |
| `.juno-thumb--video`      | Play glyph instead of the image glyph.                         |
| `.juno-thumb__label`      | Optional uppercase micro-caption under the glyph.              |
| `> img` / `> video`       | Covers the frame (`object-fit: cover`).                        |
| `onerror="this.remove()"` | The whole JS contract — optional, stateless, one attribute.    |

## Anatomy (any platform)

- Frame: surface `s2`, 1px `border`, radius `3`; size from the app
  (`aspect-ratio` inline or the [tiles grid](../layout.md)).
- Glyph: 28% of the frame (capped `space.32`), `muted` color — a missing thumb
  is **not** a warning state; the placeholder stays neutral.
- Media covers the full frame, center-cropped.

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
- Retry, lazy-load, LQIP/blur-up: app or `junoui-<framework>` territory.
