# Reload

The non-blocking counterpart to the [skeleton](./skeleton.md). A skeleton
stands in for content that isn't there yet (first paint); the reload indicator
signals a refresh happening _over_ content that's already on screen — the stale
data stays readable and interactive while fresh data lands.

It's a small pulsing dot with a soft halo, centered as a fixed overlay that
eats no pointer events, so the page underneath stays fully usable.

## Web

```html
<div class="juno-reload" role="status" aria-label="Reloading">
  <span class="juno-reload__dot"></span>
</div>
```

| Class / prop        | Effect                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `.juno-reload`      | Fixed, centered, `pointer-events: none` overlay.                    |
| `.juno-reload__dot` | `space.16` role-colored dot with a soft halo, gentle opacity pulse. |
| `.juno--<role>`     | Dot color (default `active`).                                       |

## Usage

- Render it while a **background refetch is in flight over existing content**;
  drop it when the request settles. For first-paint (no content yet) use the
  [skeleton](./skeleton.md) instead.
- The app owns the state (zero JS in the component) — mount/unmount it, or
  toggle a `hidden` attribute.
- The pulse uses the shared `juno-pulse` keyframe — a soft dim, not a full
  blink. `prefers-reduced-motion` stops the pulse (via the base layer); the
  dot stays visible so the "refreshing" state is still conveyed.

## Accessibility

- `role="status"` + `aria-label` announces the refresh **politely**, without
  stealing focus — it's a status, not an alert. Don't use `role="alert"`.
- Keep it non-blocking: `pointer-events: none` ensures it never traps clicks on
  the content it floats over.
