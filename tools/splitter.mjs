// ════════════════════════════════════════════════════════════════════════
//  junoui/splitter — the keyboard half of a resize separator
// ════════════════════════════════════════════════════════════════════════
//  layout.md says behaviour that needs state belongs in the app, and it still
//  does: there is no pointer capture here, no width arithmetic, no
//  persistence, no collapse policy. What there is, is the keyboard model the
//  ARIA separator pattern specifies — arrows resize, Home/End go to the
//  extremes, Enter toggles collapse — because that is the part consumers omit
//  and it is identical in every app that has two panes.
//
//    import { enhanceSplitter } from 'junoui/splitter';
//    const stop = enhanceSplitter(el, { step: 16 });
//    el.addEventListener('juno-splitter-move', (e) => setWidth(e.detail.value));
//
//  STATELESS. The position lives in `aria-valuenow`, which the app owns and
//  which the screen reader reads. This computes a REQUESTED value from it and
//  asks; it never writes the attribute, because whether a pane can actually be
//  320px wide is a layout question only the app can answer.
// ════════════════════════════════════════════════════════════════════════

const num = (el, attr, fallback) => {
  const v = Number(el.getAttribute(attr));
  return Number.isFinite(v) ? v : fallback;
};

/**
 * Clamp a requested position into the separator's declared range.
 *
 * Pure and exported so the arithmetic is testable without a DOM — the same
 * reason scripts/gate-currency.mjs exists. A separator whose value can leave
 * [min, max] announces a position the app will refuse, which is worse than not
 * moving: the screen reader says 700 and the pane is at 640.
 */
export function nextValue({ now, min, max, delta }) {
  const target = now + delta;
  if (!Number.isFinite(target)) return now;
  return Math.min(max, Math.max(min, target));
}

/**
 * Which way an arrow key moves this separator.
 *
 * A VERTICAL separator (the default) divides panes side by side, so it is
 * Left/Right that move it — the axis names the separator, not the motion, and
 * getting that backwards is the classic implementation bug. Returns 0 for a key
 * that does not apply, so a Down arrow on a vertical splitter scrolls the page
 * as it should instead of being swallowed.
 */
export function arrowDelta(key, orientation, step) {
  const vertical = orientation !== 'horizontal';
  if (vertical) {
    if (key === 'ArrowLeft') return -step;
    if (key === 'ArrowRight') return step;
    return 0;
  }
  if (key === 'ArrowUp') return -step;
  if (key === 'ArrowDown') return step;
  return 0;
}

/**
 * Wire the keyboard model. Returns a teardown function.
 *
 * @param options.step   pixels per arrow press (default 16)
 * @param options.bigStep pixels per Page key (default 10x step)
 */
export function enhanceSplitter(root, options = {}) {
  if (!root) throw new Error('enhanceSplitter: no root element');
  root._junoSplitterTeardown?.();

  const step = options.step ?? 16;
  const bigStep = options.bigStep ?? step * 10;

  const ask = (type, value) =>
    root.dispatchEvent(
      new CustomEvent(type, { bubbles: true, cancelable: true, detail: { value, element: root } }),
    );

  const onKeyDown = (event) => {
    if (root.getAttribute('aria-disabled') === 'true' || root.disabled) return;
    const orientation = root.getAttribute('aria-orientation') ?? 'vertical';
    const min = num(root, 'aria-valuemin', 0);
    const max = num(root, 'aria-valuemax', Number.MAX_SAFE_INTEGER);
    const now = num(root, 'aria-valuenow', min);

    const move = (delta) => {
      event.preventDefault();
      ask('juno-splitter-move', nextValue({ now, min, max, delta }));
    };

    const arrow = arrowDelta(event.key, orientation, step);
    if (arrow !== 0) return move(arrow);

    switch (event.key) {
      case 'PageUp':
        return move(-bigStep);
      case 'PageDown':
        return move(bigStep);
      case 'Home':
        // The pattern's "go to minimum". For most apps that IS collapse, but
        // saying so is the app's call — this reports a position, not an intent.
        event.preventDefault();
        return void ask('juno-splitter-move', min);
      case 'End':
        event.preventDefault();
        return void ask('juno-splitter-move', max);
      case 'Enter':
        // Toggle collapse. A separate event because it is a different
        // question: "put this pane away" survives a later resize, and an app
        // that restores to the previous width needs to know which one happened.
        event.preventDefault();
        return void ask('juno-splitter-collapse', now);
      default:
        return;
    }
  };

  root.addEventListener('keydown', onKeyDown);
  const teardown = () => {
    root.removeEventListener('keydown', onKeyDown);
    delete root._junoSplitterTeardown;
  };
  root._junoSplitterTeardown = teardown;
  return teardown;
}
