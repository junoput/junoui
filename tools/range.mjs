// ════════════════════════════════════════════════════════════════════════
//  junoui/range — the two decisions a dual-thumb slider has to get right
// ════════════════════════════════════════════════════════════════════════
//  Same boundary as junoui/slider and junoui/scrubber: the app owns the
//  values. What this ships is the two rules that are identical in every
//  two-thumb control and that hand-rolled ones get wrong.
//
//  ── DECISION 1: WHICH THUMB DOES A TAP GRAB? ──────────────────────────
//  Two thumbs can meet and fully overlap. At 44px on a coarse pointer they
//  overlap well before they meet — a tap between two thumbs 30px apart is on
//  both. So "which one" is a rule, not an accident of z-order, and the three
//  obvious rules each fail somewhere:
//
//    nearest centre   ties exactly when they coincide, which is the case it
//                     most needs to answer, and jitters when near-equal.
//    last moved       needs state, and is wrong at a limit: both thumbs at
//                     max, last-moved is the upper, and the upper cannot go
//                     anywhere.
//    keeps range valid  under-determined while the thumbs are apart, where
//                     either choice is valid and only one is natural.
//
//  So: NEAREST CENTRE WHEN THE TAP IS BETWEEN THE THUMBS, DIRECTION OF
//  TRAVEL WHEN IT IS OUTSIDE THEM. A tap left of both can only sensibly move
//  the lower; right of both, only the upper. Together they are total — every
//  tap resolves to a thumb that can actually move toward it, which is swept
//  in the tests rather than argued.
//
//  Worth stating plainly, because it is easy to oversell: OUTSIDE the pair the
//  two rules always agree, since the nearer thumb is by definition the one on
//  that side. The direction rule earns its place on COINCIDENT thumbs, where
//  nearest-centre has no answer at all — every tap is equidistant.
//
//  The one genuine tie left is a tap exactly on two coincident thumbs. There
//  `last` breaks it if the caller tracks it, and failing that the thumb that
//  is NOT pinned at a limit wins, because the other one cannot move at all.
//
//  ── DECISION 2: WHAT IF YOU DRAG ONE PAST THE OTHER? ──────────────────
//  It CLAMPS. It does not swap and it does not push.
//
//    swapping  changes which bound you are dragging in the middle of the
//              gesture. `aria-valuenow` on the thumb under the finger
//              silently starts meaning the other end, so a screen-reader user
//              who grabbed "Minimum" is now dragging the maximum and is told
//              nothing. An app that bound the low thumb to a field sees that
//              field jump to the high value.
//    pushing   moves a value the user did not touch. On a price filter that
//              is a silent edit of the other bound.
//    clamping  is the only one where the identity of the thumb is stable for
//              the whole gesture and the emitted pair always satisfies
//              lo <= hi. The thumb stops; the finger keeps going; bring it
//              back and the thumb resumes. That is what every native range
//              control does.
//
//  `minGap` makes the stop happen early — a range that must span at least
//  something (a price band, a zoom window). Default 0, so the thumbs may meet
//  but never cross.
// ════════════════════════════════════════════════════════════════════════

/** Which thumb a pointer at `value` should grab. Returns 'lo' or 'hi'.
 *
 *  Pure, and exported, because this is the rule the component exists to own —
 *  a rule that lives only inside a pointerdown handler is a rule nobody can
 *  test and every consumer re-invents. */
export function pickThumb({ value, lo, hi, min = -Infinity, max = Infinity, last = null }) {
  // Outside the pair: direction decides, and only one thumb can move that way.
  if (value < lo) return 'lo';
  if (value > hi) return 'hi';

  // Between them: nearest centre, by ABSOLUTE distance.
  //
  // Signed differences would also work here and would make the two guards above
  // dead code — `value - lo` is negative exactly when the tap is left of the
  // pair, so the comparison silently re-derives the direction rule. Mutation
  // found that: deleting both guards changed no test. That is a correctness
  // that depends on a sign property a reader has to notice, and it collapses
  // two stated rules into one accidental one. Absolute distance means
  // "nearest" means nearest, and the guards carry the outside case explicitly.
  const dLo = Math.abs(value - lo);
  const dHi = Math.abs(hi - value);
  if (dLo < dHi) return 'lo';
  if (dHi < dLo) return 'hi';

  // A genuine tie — equidistant, or the thumbs coincide and the tap is on them.
  if (last === 'lo' || last === 'hi') return last;
  // Prefer the thumb that is not pinned: at the bottom the lower cannot move
  // down, at the top the upper cannot move up.
  if (lo <= min) return 'hi';
  if (hi >= max) return 'lo';
  return 'lo';
}

/** Where a thumb lands when dragged to `value`. Clamps; never crosses.
 *
 *  Returns the whole pair so a caller cannot apply half of it. */
export function moveThumb({ thumb, value, lo, hi, min, max, minGap = 0 }) {
  const at = (v) => Math.min(max, Math.max(min, v));
  if (thumb === 'lo') {
    return { lo: Math.min(at(value), hi - minGap), hi };
  }
  return { lo, hi: Math.max(at(value), lo + minGap) };
}

/** The bounds a thumb should ANNOUNCE, which are not the track's bounds.
 *
 *  The ticket's own ask, and the part that makes the constraint audible rather
 *  than merely enforced: the low thumb's aria-valuemax is where the high thumb
 *  is, so a screen reader says "maximum 40" instead of letting someone push
 *  against an invisible wall. */
export function thumbBounds({ thumb, lo, hi, min, max, minGap = 0 }) {
  return thumb === 'lo' ? { min, max: hi - minGap } : { min: lo + minGap, max };
}

/** Is this pair legal? Used by the guards, and cheap enough for an assert. */
export function isValidRange({ lo, hi, min, max, minGap = 0 }) {
  return lo >= min && hi <= max && hi - lo >= minGap;
}

/** The percentage a `--juno-range-*` custom property wants. */
export function percentOf(value, min, max) {
  if (!(max > min)) return '0%';
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return `${(frac * 100).toFixed(3)}%`;
}

const num = (el, attr, fallback) => {
  const v = Number(el.getAttribute(attr));
  return Number.isFinite(v) ? v : fallback;
};

/**
 * Wire the keyboard model onto one thumb.
 *
 * Stateless: emits `juno-range-change` with the whole `{ lo, hi }` pair and the
 * thumb that moved. Never writes the attributes, because whether a range is
 * acceptable is the app's question.
 */
export function enhanceRange(root, { step = 1, pageStep = 10, minGap = 0 } = {}) {
  const thumbs = {
    lo: root.querySelector('.juno-range__thumb--lo'),
    hi: root.querySelector('.juno-range__thumb--hi'),
  };

  const read = () => ({
    lo: num(thumbs.lo, 'aria-valuenow', 0),
    hi: num(thumbs.hi, 'aria-valuenow', 0),
    min: num(root, 'data-juno-min', 0),
    max: num(root, 'data-juno-max', 100),
  });

  const emit = (thumb, next) =>
    root.dispatchEvent(
      new CustomEvent('juno-range-change', { bubbles: true, detail: { ...next, thumb } }),
    );

  const onKey = (e) => {
    const thumb = e.currentTarget === thumbs.lo ? 'lo' : 'hi';
    const { lo, hi, min, max } = read();
    const delta =
      { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key] ??
      { PageUp: pageStep, PageDown: -pageStep }[e.key];
    let target;
    if (Number.isFinite(delta)) target = (thumb === 'lo' ? lo : hi) + delta;
    else if (e.key === 'Home') target = min;
    else if (e.key === 'End') target = max;
    else return; // not ours
    e.preventDefault();
    const next = moveThumb({ thumb, value: target, lo, hi, min, max, minGap });
    if (next.lo === lo && next.hi === hi) return;
    emit(thumb, next);
  };

  for (const el of [thumbs.lo, thumbs.hi]) el?.addEventListener('keydown', onKey);
  return () => {
    for (const el of [thumbs.lo, thumbs.hi]) el?.removeEventListener('keydown', onKey);
  };
}
