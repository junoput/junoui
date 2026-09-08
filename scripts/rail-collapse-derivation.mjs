// The rail's collapse/floor threshold, derived once from built tokens and
// imported everywhere it is needed — not restated. 20260908-005 computed
// this for the auto-collapse @container threshold; 20260908-036 reuses the
// SAME number as the width clamp's floor rather than deriving a second one,
// because two computations of one quantity is the defect this programme
// keeps removing (20260906-056 is the concrete instance: two things that
// must agree, agreeing by coincidence instead of by construction).
//
// THE FLOOR: the point below which an item can no longer fit its icon once
// the label has truncated away to zero. .juno-rail__label already
// ellipsis-truncates, so there is no "minimum label width" to guess —
// every term below is a token junoui already owns:
//
//   2 x --juno-space-16        item's own inline padding           32px
//   1 x --juno-border-width-2  item's border-inline-start           2px
//   1.25em icon size at --juno-font-size-12 (12px x 1.25)          15px
//   1 x --juno-gap-control, comfortable density (--juno-space-8)    8px
//                                                            ───────────
//                                                                   57px
//
// DENSITY: --juno-gap-control is the only term that moves under
// [data-juno-density='compact'] (--juno-space-4 = 4px), giving an exact
// compact floor of 53px. Both the collapse threshold and the width clamp
// use the comfortable 57px uniformly — a deliberate simplification also
// documented in rail.css: compact collapses up to 4px earlier than its own
// exact floor, and the clamp is up to 4px more conservative than strictly
// required, but never in the direction that lets an item's icon overflow.
import { CORE } from '../dist/js/tokens.js';

function px(token) {
  if (typeof token !== 'string' || !/^[\d.]+px$/.test(token)) {
    throw new Error(`rail-collapse-derivation: expected a plain px token, got "${token}"`);
  }
  return Number.parseFloat(token);
}

const ITEM_PADDING_INLINE = 2 * px(CORE.space['16']); // both sides of .juno-rail__item
const ITEM_BORDER_INLINE_START = px(CORE.border.width['2']);
const ICON_SIZE = 1.25 * px(CORE.font.size['12']); // 1.25em at the item's own font-size
const GAP_COMFORTABLE = px(CORE.space['8']); // --juno-gap-control, comfortable density
const GAP_COMPACT = px(CORE.space['4']); // --juno-gap-control, compact density

export const TERMS = {
  ITEM_PADDING_INLINE,
  ITEM_BORDER_INLINE_START,
  ICON_SIZE,
  GAP_COMFORTABLE,
  GAP_COMPACT,
};

export const DERIVED_FLOOR_COMFORTABLE =
  ITEM_PADDING_INLINE + ITEM_BORDER_INLINE_START + ICON_SIZE + GAP_COMFORTABLE;
export const DERIVED_FLOOR_COMPACT =
  ITEM_PADDING_INLINE + ITEM_BORDER_INLINE_START + ICON_SIZE + GAP_COMPACT;
