// ════════════════════════════════════════════════════════════════════════
//  junoui/scrubber — the keyboard and announcement half of a transport
// ════════════════════════════════════════════════════════════════════════
//  Same boundary as junoui/splitter: no playback state here, no pointer
//  capture, no seeking. What this ships is the part consumers omit and that is
//  identical in every app with a timeline — the ARIA slider keyboard model,
//  and the announcement.
//
//    import { enhanceScrubber, formatTime } from 'junoui/scrubber';
//    const stop = enhanceScrubber(el, { step: 5, pageStep: 30 });
//    el.addEventListener('juno-scrubber-seek', (e) => player.seek(e.detail.value));
//
//  STATELESS. The position lives in `aria-valuenow`, which the app owns and the
//  screen reader reads. This computes a REQUESTED value and asks; it never
//  writes the attribute, because whether a seek lands is a question only the
//  player can answer.
//
//  THE ANNOUNCEMENT IS THE POINT. A screen reader reading "0.42" for a playhead
//  is useless, and it is what `role="slider"` gives you by default — the UA
//  announces valuenow, or valuenow as a percentage of the range. A scrubber's
//  value is a TIME, so `aria-valuetext` has to carry one. `formatTime` and
//  `valueText` exist so a consumer does not hand-roll that and get "87" again.
// ════════════════════════════════════════════════════════════════════════

const num = (el, attr, fallback) => {
  const v = Number(el.getAttribute(attr));
  return Number.isFinite(v) ? v : fallback;
};

/**
 * Seconds as a clock, the way a transport shows one.
 *
 * `h:mm:ss` past an hour, `m:ss` below it — never `0:04:07`, which reads as a
 * duration nobody wrote. Negative and non-finite inputs clamp to zero rather
 * than producing `-1:-5`: a scrubber whose announcement is nonsense is worse
 * than one that is briefly wrong, because a screen reader will say it.
 */
export function formatTime(seconds) {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * The string `aria-valuetext` should carry.
 *
 * "1:27 of 3:32", not "87". Position first because that is what changes and
 * what a listener is waiting for; the duration is context and comes second.
 */
export function valueText(now, max) {
  return `${formatTime(now)} of ${formatTime(max)}`;
}

/**
 * Clamp a requested position into the declared range.
 *
 * Pure and exported so the arithmetic is testable without a DOM. A scrubber
 * whose value can leave [min, max] announces a time the player will refuse.
 */
export function nextValue({ now, min, max, delta }) {
  const target = now + delta;
  if (!Number.isFinite(target)) return now;
  return Math.min(max, Math.max(min, target));
}

/**
 * How far a key moves the playhead.
 *
 * Arrows step by `step`, PageUp/PageDown by `pageStep`, Home/End jump to the
 * ends. Returns `null` for a key this component does not own, so the caller can
 * tell "no movement" from "not mine" — swallowing an unhandled key is how a
 * scrubber ends up eating Tab.
 */
export function keyDelta(key, { step, pageStep, now, min, max }) {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return step;
    case 'ArrowLeft':
    case 'ArrowDown':
      return -step;
    case 'PageUp':
      return pageStep;
    case 'PageDown':
      return -pageStep;
    case 'Home':
      return min - now;
    case 'End':
      return max - now;
    default:
      return null;
  }
}

/**
 * Where a pointer at `clientX` sits on the track, as a value.
 *
 * Pure over a rect so it is testable without a browser, and so the direction
 * logic is visible: in a right-to-left document the start of the track is its
 * RIGHT edge, and a scrubber that ignores that seeks backwards for half the
 * world. `rtl` is passed in rather than read off the element, because the
 * caller already knows its own direction.
 */
export function valueAtPointer({ clientX, rect, min, max, rtl = false }) {
  if (!rect.width) return min;
  const raw = (clientX - rect.left) / rect.width;
  const frac = Math.min(1, Math.max(0, rtl ? 1 - raw : raw));
  return min + frac * (max - min);
}

/** The percentage a `--juno-scrubber-*` custom property wants. */
export function percentOf(value, min, max) {
  if (!(max > min)) return '0%';
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return `${(frac * 100).toFixed(3)}%`;
}

/**
 * Wire the keyboard model onto one scrubber.
 *
 * Returns a teardown. Emits `juno-scrubber-seek` with `{ value, reason }`;
 * `reason` is `'key'` or `'pointer'` so an app can throttle scrub-drags without
 * throttling arrow keys.
 */
export function enhanceScrubber(el, { step = 5, pageStep = 30 } = {}) {
  const onKey = (e) => {
    const min = num(el, 'aria-valuemin', 0);
    const max = num(el, 'aria-valuemax', 100);
    const now = num(el, 'aria-valuenow', min);
    const delta = keyDelta(e.key, { step, pageStep, now, min, max });
    if (delta === null) return; // not ours — let it through
    e.preventDefault();
    const value = nextValue({ now, min, max, delta });
    if (value === now) return;
    el.dispatchEvent(
      new CustomEvent('juno-scrubber-seek', { bubbles: true, detail: { value, reason: 'key' } }),
    );
  };

  const onPointer = (e) => {
    if (el.getAttribute('aria-disabled') === 'true') return;
    const min = num(el, 'aria-valuemin', 0);
    const max = num(el, 'aria-valuemax', 100);
    const rtl = getComputedStyle(el).direction === 'rtl';
    const value = valueAtPointer({
      clientX: e.clientX,
      rect: el.getBoundingClientRect(),
      min,
      max,
      rtl,
    });
    el.dispatchEvent(
      new CustomEvent('juno-scrubber-seek', {
        bubbles: true,
        detail: { value, reason: 'pointer' },
      }),
    );
  };

  el.addEventListener('keydown', onKey);
  el.addEventListener('pointerdown', onPointer);
  return () => {
    el.removeEventListener('keydown', onKey);
    el.removeEventListener('pointerdown', onPointer);
  };
}
