# Load state

A vocabulary for every way a load can go, so nothing spins forever. junoui already had
"resolving" (arc/beacon/bar, both indeterminate and determinate) and "layout known, not
loaded yet" ([skeleton](./skeleton.md)). This adds the two treatments those don't cover —
**working with no ETA** and **failed** — plus a table-agnostic **empty** state and an
optional CSS-only switch to show exactly one at a time. Zero JS: junoui ships the look and
the ARIA contract per state; deciding _when_ a load becomes a fault or an empty result is
the app's job.

## The decision table

| State                           | Treatment                 | Why                                                          |
| ------------------------------- | ------------------------- | ------------------------------------------------------------ |
| No data yet, about to fetch     | `.juno-beacon`            | "no bytes yet" — a pulse, not a promise of progress.         |
| Fetching, will resolve          | `.juno-arc` / `.juno-bar` | Real progress or a bounded wait — see [loader](./loader.md). |
| Layout known, content pending   | `.juno-skeleton`          | Placeholder mirrors the shape of what's coming.              |
| Server working, **no ETA**      | `.juno-shimmer`           | Motion _without_ a completion promise.                       |
| Failed — **terminal**           | `.juno-fault`             | Static. A spinner on a 404 spins forever.                    |
| Legitimately nothing — terminal | `.juno-empty`             | Static. Not a failure — don't tint it like one.              |

`.juno-shimmer` and `.juno-fault` are the two treatments this ticket adds; `.juno-empty` is
the generalized, table-agnostic form of the existing `.juno-table__empty` (same anatomy,
usable outside a table).

## Web

### Shimmer — work in progress, no completion promise

```html
<div class="juno-shimmer" style="block-size: 120px;" aria-busy="true" aria-live="polite"></div>
```

Shares `.juno-skeleton`'s compositor-only band (same `@keyframes juno-skeleton-shimmer`,
defined once in `skeleton.css`) — one shimmer implementation, applied to a solid fill
instead of a placeholder shape. Override cadence with `--juno-shimmer-dur` (default
`1.4s`).

### Fault — terminal, never animates

```html
<div class="juno-fault" role="status">
  <span class="juno-fault__icon" aria-hidden="true">!</span>
  <p>Couldn't load this image.</p>
</div>
```

Role defaults to `caution`; add a `.juno--<role>` class to recolor (`.juno--warning` for a
harder failure) — never hardcode a color. `role="status"` on the fault itself is a
per-region, polite announcement (this fired once, doesn't need to interrupt); for a
page-level urgent message use [`.juno-alert`](./alert.md) with `role="alert"` instead.

### Empty — legitimately nothing, terminal

```html
<div class="juno-empty">
  <span class="juno-empty__icon" aria-hidden="true">∅</span>
  <p>Nothing here yet.</p>
</div>
```

### The switch (optional)

CSS-only, one visible child at a time. The app sets `data-juno-state` on the parent as
its fetch/rendition state changes; junoui does no state inference.

```html
<div class="juno-state" data-juno-state="processing">
  <div data-juno-when="loading">
    <div class="juno-arc juno-arc--indeterminate" role="status" aria-label="Loading"></div>
  </div>
  <div data-juno-when="processing" aria-busy="true" aria-live="polite">
    <div class="juno-shimmer" style="block-size: 120px;"></div>
  </div>
  <div data-juno-when="error">
    <div class="juno-fault" role="status">
      <span class="juno-fault__icon" aria-hidden="true">!</span>
      <p>Couldn't load this.</p>
    </div>
  </div>
  <div data-juno-when="empty">
    <div class="juno-empty">
      <span class="juno-empty__icon" aria-hidden="true">∅</span>
      <p>Nothing here yet.</p>
    </div>
  </div>
</div>
```

| Class / attribute                   | Effect                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.juno-state`                       | Switch container.                                                                                             |
| `[data-juno-when]`                  | A wrapper hidden by default; shown when its (space-separated) token list contains the parent's current state. |
| `.juno-state[data-juno-state='…']`  | Set by the app: `loading` \| `processing` \| `error` \| `empty`.                                              |
| `.juno-shimmer`                     | Compositor-only shimmer band on a solid fill (shares skeleton's `@keyframes`).                                |
| `--juno-shimmer-dur`                | Shimmer cycle length (default `1.4s`).                                                                        |
| `.juno-fault` / `.juno-fault__icon` | Terminal failure card. Role `caution` by default.                                                             |
| `.juno-empty` / `.juno-empty__icon` | Terminal empty-result card. Neutral (`label`/`muted`), same anatomy as `.juno-table__empty`.                  |

## Anatomy (any platform)

- Shimmer: solid `s2` fill, `s3` highlight band at 70% opacity sliding on `transform`
  only, 1.4s ease-in-out loop — identical mechanism to skeleton, different semantic use.
- Fault: column, centered, `space.8` gap, `space.24` padding, role-colored text and icon
  outline (`radius.8` box, `border.width.1`). Never animates.
- Empty: column, centered, `space.12` gap, `space.56`/`space.24` padding, `label`/`muted`
  text and icon outline (`radius.8` box). Never animates.

## Usage

- **Shimmer vs. skeleton:** skeleton implies a known layout waiting for content (first
  paint); shimmer implies ongoing server-side work with no bound on when it finishes
  (transcoding, indexing, re-encoding). Don't use skeleton for the latter — the moment a
  skeleton is on screen, the layout it promises should be about to land.
  Reference: `web/src/media/loadview.ts` (nexora) — spinner only while nothing has
  started, shimmer for `processing`, static fault for `error`; "a spinner on a 404 spins
  forever."
- **Fault vs. alert:** a fault is a _region_ replacing content that failed to load
  (an image tile, a card). An [alert](./alert.md) is a page-level message. Don't reach for
  `.juno-alert` inside a grid cell.
- **Empty is not a failure:** legitimately-zero-results (an empty search, a fresh account)
  is a distinct terminal state from an error — keep it neutral, offer a next action
  (a button/link) rather than an apology.
- **The switch is optional.** Nothing stops rendering `.juno-shimmer` / `.juno-fault` /
  `.juno-empty` directly and swapping them with app-side conditional rendering; `.juno-state`
  exists for markup that's easier to keep all-present (e.g. server-rendered) and toggle
  by attribute.
- **a11y, per state:** `loading`/`processing` → `aria-busy="true"` (+ `aria-live="polite"`
  if the region isn't otherwise announced); `.juno-fault` → `role="status"` on itself;
  `.juno-empty` → no extra role, it's static content. See
  [accessibility.md](../accessibility.md) for the full per-component ARIA contract.
