// Every scrollable region in the showcase either has a tab stop or a reason.
//
// A region that scrolls and contains nothing focusable cannot be scrolled by a
// keyboard-only user — there is no element to Tab to (WCAG 2.1.1). The rule and
// its boundaries live in docs/accessibility.md#scrollable-regions; this holds
// junoui's own showcase to it.
//
// WHY THE SHOWCASE SPECIFICALLY. junoui ships CSS, not markup, so no test can
// force a consumer to do this. But the showcase is the thing people copy, and
// an unguarded reference implementation teaches the omission — which is exactly
// how six regions came to be keyboard-unreachable (20260909-086).
//
// AND IT MISSED A SEVENTH. That sweep enumerated pages BY HAND — data-display,
// layout, device/layout, device/buttons — and device/media was not on the list,
// so its reel stayed unreachable (350px of horizontal scroll at 390px wide,
// zero focusable children). The measurement was right for every page measured;
// the POPULATION was wrong. This walks the directory instead, which is the
// difference between a list someone maintains and one the filesystem answers.
//
// NO HTML PARSING. The check keys on the OPENING TAG text, so there is no
// nesting logic and no homemade parser — the class of instrument that has
// produced confident false results repeatedly in this repo. It cannot tell
// whether a region contains focusable children, which is why the exceptions
// below carry that fact as a MEASURED, declared reason rather than a computed
// one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SHOWCASE = 'showcase';
const DOCS = 'docs';
const SCROLLERS =
  /<[a-z]+[^>]*class="[^"]*\b(juno-table-scroll|juno-reel|juno-scroller)\b[^"]*"[^>]*>/g;

/**
 * Containers that legitimately have no tab stop, keyed by file and by the exact
 * opening tag. Every reason below was MEASURED in a browser at 1280x900 and
 * 390x844, not argued.
 *
 * Keying on the exact tag means editing the markup breaks the entry loudly.
 * That is correct rather than annoying: changing the markup can change whether
 * the region scrolls, and the reason on file was measured against the old
 * markup.
 */
const NO_TABSTOP_NEEDED = {
  'showcase/tables.html': [
    // scrolls at 390 (505px horizontal) but holds 9 focusable children, so
    // tabbing already carries a keyboard user through the content
    ['<div class="juno-table-scroll">', 'holds 9 focusable children'],
    // never overflows at either viewport — a tab stop here would be a
    // redundant, unlabelled stop in front of content already fully visible
    [
      '<div class="juno-table-scroll" style="container-type:inline-size;max-block-size:none;">',
      'never overflows at 1280 or 390',
    ],
    [
      '<div class="juno-table-scroll" style="container-type:inline-size;max-block-size:none;padding:12px;">',
      'never overflows at 1280 or 390',
    ],
  ],
  // Generic examples with placeholder content. Blanket-adding a tab stop here
  // would teach "always add one", which the rule explicitly forbids — so these
  // carry an HTML comment naming the CONDITION instead, immediately above the
  // tag. Verified by eye: the comment is there in both cases.
  'docs/layout.md': [
    [
      '<div\n  class="juno-scroller juno-scroller--x juno-scroller--bare"\n  style="--juno-scroller-snap: x proximity;"\n>',
      'generic example; condition stated in the comment above it',
    ],
    [
      '<div class="juno-reel" style="--juno-scroller-snap: inline proximity;">',
      'generic example; condition stated in the comment above it',
    ],
  ],
  'showcase/device/table.html': [
    // scrolls at 390 but holds 8 focusable children
    ['<div class="juno-table-scroll" style="max-block-size:50dvh;">', 'holds 8 focusable children'],
    // 7px of horizontal scroll at 390 — a rounding artefact, not a scroll
    ['<div class="juno-table-scroll">', '7px at 390 is a rounding artefact'],
  ],
};

/**
 * Every showcase page and every doc, walked rather than listed.
 *
 * DOCS ARE THE SHIPPED COPY. `showcase/` is not in package.json's `files`;
 * `docs/` is. So a consumer receives the markup in docs/ and never sees the
 * showcase — guarding only the showcase would guard the copy nobody gets,
 * which is the defect this file exists to stop (20260909-091).
 */
function pages() {
  const out = [];
  const walk = (dir, ext) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, ext);
      else if (e.name.endsWith(ext)) out.push(p);
    }
  };
  walk(SHOWCASE, '.html');
  walk(DOCS, '.md');
  return out;
}

const FOUND = [];
for (const file of pages()) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(SCROLLERS)) FOUND.push({ file, tag: m[0] });
}

test('the showcase was really walked and scroll regions were really found (vacuity floor)', () => {
  // Without this, a renamed directory or a regex that stopped matching makes
  // every assertion below iterate an empty list and pass — which is how the
  // sweep this test exists to replace went wrong in the first place.
  assert.ok(pages().length >= 20, `only ${pages().length} showcase pages walked`);
  assert.ok(FOUND.length >= 18, `only ${FOUND.length} scroll regions found`);
});

test('every scrollable region has a tab stop, or a measured reason not to', () => {
  const missing = [];
  for (const { file, tag } of FOUND) {
    if (/tabindex=/.test(tag)) continue;
    const allowed = (NO_TABSTOP_NEEDED[file] ?? []).some(([t]) => t === tag);
    if (!allowed) missing.push(`${file}\n    ${tag}`);
  }
  assert.deepEqual(
    missing,
    [],
    'a scrollable region has no tab stop and no declared reason — see ' +
      'docs/accessibility.md#scrollable-regions, and measure before adding one: ' +
      'a region that never scrolls, or that holds its own focusable children, ' +
      'must NOT get a redundant stop',
  );
});

test('every declared exception still matches a container that exists', () => {
  // The half nobody writes. When markup changes, a stale exception silently
  // stops applying to anything and the entry becomes a claim about nothing.
  const stale = [];
  for (const [file, entries] of Object.entries(NO_TABSTOP_NEEDED)) {
    for (const [tag] of entries) {
      if (!FOUND.some((f) => f.file === file && f.tag === tag)) stale.push(`${file}: ${tag}`);
    }
  }
  assert.deepEqual(stale, [], 'a declared exception names a container that is no longer there');
});

test('every declared exception carries a reason', () => {
  const empty = Object.entries(NO_TABSTOP_NEEDED).flatMap(([file, entries]) =>
    entries.filter(([, why]) => !why || why.trim().length < 10).map(([t]) => `${file}: ${t}`),
  );
  assert.deepEqual(empty, [], 'an exception is declared with no reason');
});
