// ════════════════════════════════════════════════════════════════════════
//  junoui/pointer — the pointer-first conditions, for JS
// ════════════════════════════════════════════════════════════════════════
//  An app that chooses a COMPONENT (render a rail or a dock?) needs the same
//  answer the stylesheet uses to choose a rule. Two implementations of one
//  condition drift, and the drift is invisible: the CSS hides the rail while
//  the app still renders it, or the reverse.
//
//    import { COMPACT_NAV, matchesCompactNav, onCompactNav } from 'junoui/pointer';
//
//  The strings come from the same module the token build emits @custom-media
//  from, so `--juno-compact-nav` in CSS and COMPACT_NAV here cannot disagree.
//  A test asserts that against the BUILT stylesheet, not against this file.
// ════════════════════════════════════════════════════════════════════════

export {
  COARSE_POINTER,
  COMPACT_NAV,
  NARROW_MAX_PX,
  SHORT_MAX_PX,
  wantsCompactNav,
} from './pointer-first.mjs';

import { COARSE_POINTER, COMPACT_NAV } from './pointer-first.mjs';

/** Does this viewport want phone navigation right now? */
export const matchesCompactNav = () =>
  typeof matchMedia === 'function' ? matchMedia(COMPACT_NAV).matches : false;

/** Is the primary pointer coarse? Touch ergonomics, no size term. */
export const matchesCoarsePointer = () =>
  typeof matchMedia === 'function' ? matchMedia(COARSE_POINTER).matches : false;

/**
 * Subscribe to changes. Returns a teardown function.
 *
 * A listener rather than a one-shot read because this condition changes
 * WITHOUT a reload — rotating a phone crosses it in both directions, which is
 * exactly the case a width-only check got wrong.
 */
export function onCompactNav(handler) {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(COMPACT_NAV);
  const fire = (e) => handler(e.matches);
  mq.addEventListener('change', fire);
  handler(mq.matches);
  return () => mq.removeEventListener('change', fire);
}
