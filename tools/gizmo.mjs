// ════════════════════════════════════════════════════════════════════════
//  junoui/gizmo — bearing language and keyboard traversal for .juno-gizmo
// ════════════════════════════════════════════════════════════════════════
//  Two things a stylesheet cannot do, and both are the reason the component
//  belongs upstream rather than in each app:
//
//  1. SAYING THE BEARING. "N" is a letter, not an accessible name, and
//     "37deg" is a number a screen-reader user has to convert. `bearingLabel`
//     turns an angle into the words a person would use.
//  2. ONE FOCUS STOP. The gizmo is a composite widget: Tab reaches it once,
//     arrow keys move between marks (wrapping, because a compass ring wraps),
//     Enter activates. Eight separate tab stops for eight compass points is
//     the thing apps ship and the thing that makes the widget unusable by
//     keyboard.
//
//  Stateless, like junoui/tree: the app owns the camera. This moves focus and
//  lets the marks' own click handlers fire; it never writes an angle.
// ════════════════════════════════════════════════════════════════════════

const MARK = '.juno-gizmo__mark';

/** The 16 compass points, as words rather than letters. */
const POINTS = [
  'north',
  'north-north-east',
  'north-east',
  'east-north-east',
  'east',
  'east-south-east',
  'south-east',
  'south-south-east',
  'south',
  'south-south-west',
  'south-west',
  'west-south-west',
  'west',
  'west-north-west',
  'north-west',
  'north-north-west',
];

/** Normalise any angle into [0, 360). */
export const normalizeBearing = (deg) => ((Number(deg) % 360) + 360) % 360;

/**
 * A bearing as a person would say it: `37` → `"north-east"`.
 *
 * Sixteen points, nearest wins, and the boundaries are half a sector wide so
 * 348.75..360 and 0..11.25 are both "north" — a naive `Math.round(deg / 22.5)`
 * yields index 16 near 360 and reads off the end of the table.
 */
export function bearingLabel(deg) {
  const d = normalizeBearing(deg);
  return POINTS[Math.round(d / 22.5) % 16];
}

/**
 * The full spoken description: direction, degrees, and the tilt when there is
 * one. This is what goes in the live region — the ring itself is decoration to
 * a screen reader, and a rotating needle announces nothing.
 */
export function orientationLabel(heading, pitch = null) {
  const d = Math.round(normalizeBearing(heading));
  const base = `Facing ${bearingLabel(d)}, ${d} degrees`;
  return pitch === null || pitch === undefined
    ? `${base}.`
    : `${base}. Tilted ${Math.round(Number(pitch))} degrees.`;
}

/**
 * Wire the gizmo as one focus stop. Returns a teardown function.
 *
 * Idempotent — enhancing twice replaces the first listener rather than
 * stacking two, so a framework re-running an effect does not double-move focus
 * on every keypress.
 */
export function enhanceGizmo(root) {
  if (!root) throw new Error('enhanceGizmo: no root element');
  root._junoGizmoTeardown?.();

  const marks = () => [...root.querySelectorAll(MARK)].filter((m) => !m.disabled);

  // Seed the roving tabindex: the mark the app marks current, else the first.
  const seed = () => {
    const list = marks();
    if (!list.length) return;
    for (const m of list) m.tabIndex = -1;
    (list.find((m) => m.getAttribute('aria-current') === 'true') ?? list[0]).tabIndex = 0;
  };
  seed();

  const onKeyDown = (event) => {
    const list = marks();
    const at = list.indexOf(event.target.closest(MARK));
    if (at < 0) return;

    // WRAPPING, because a compass ring wraps. Clamping at the ends is the
    // behaviour of a slider, and it would make west unreachable from north by
    // the short way round.
    const move = (next) => {
      event.preventDefault();
      const target = list[(next + list.length) % list.length];
      for (const m of list) m.tabIndex = -1;
      target.tabIndex = 0;
      target.focus();
    };

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        return move(at + 1);
      case 'ArrowLeft':
      case 'ArrowUp':
        return move(at - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(list.length - 1);
      default:
        // Enter and Space are the button's own; intercepting them would mean
        // reimplementing activation, and a <button> already does it right.
        return;
    }
  };

  const onFocusIn = (event) => {
    const mark = event.target.closest(MARK);
    if (!mark || !root.contains(mark)) return;
    // The pointer path: a click focuses a mark without passing through the
    // keyboard move above, and the invariant has to hold for both.
    for (const m of marks()) m.tabIndex = -1;
    mark.tabIndex = 0;
  };

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('focusin', onFocusIn);
  const teardown = () => {
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('focusin', onFocusIn);
    delete root._junoGizmoTeardown;
  };
  root._junoGizmoTeardown = teardown;
  return teardown;
}
