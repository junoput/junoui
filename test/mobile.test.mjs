// Mobile primitive tests — the invariants the pill dock and the icon loader
// state in prose but nothing checked. Static analysis over src/css and the
// showcase markup, same shape as build.test.mjs (no DOM, no browser).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const COMPONENT_DIR = 'src/css/components';
const components = () => readdirSync(COMPONENT_DIR).map((f) => `${COMPONENT_DIR}/${f}`);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Text of the rule whose selector is exactly `selector`. Anchored to a rule
 * boundary: a bare `indexOf` would match the tail of a descendant selector
 * (`… :focus-visible .juno-dock__bubble {`) and read the wrong block.
 */
function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = stripComments(css).match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(m, `rule "${selector}" not found`);
  return m[1];
}

/** Value of `prop` declared inside `block`, trimmed, or undefined. */
function decl(block, prop) {
  const m = block.match(new RegExp(`(?:^|[;{])\\s*${prop}\\s*:([^;]+)`, 'm'));
  return m ? m[1].trim() : undefined;
}

test('the concentric ring is declared in exactly one place', () => {
  // icon-loader.css calls itself "the ONLY concentric-ring mechanism in
  // junoui" — a dock bubble or nav glyph composes it rather than re-rolling
  // the geometry. Only the component that DEFINES .juno-arc (loader.css) and
  // the one composition seam (icon-loader.css) may size a ring; a third file
  // setting --juno-arc-* means someone re-rolled it and the two will drift.
  const allowed = new Set([`${COMPONENT_DIR}/loader.css`, `${COMPONENT_DIR}/icon-loader.css`]);
  const offenders = [];
  // A colon after the name makes it a declaration; `var(--juno-arc-size)` and
  // `var(--juno-arc-size, 4px)` are reads and carry no colon. Deliberately not
  // anchored to line start — a one-line rule declares it mid-line.
  const declaresRing = /--juno-arc-(?:size|width)\s*:/;
  for (const f of components()) {
    if (allowed.has(f)) continue;
    stripComments(readFileSync(f, 'utf8'))
      .split('\n')
      .forEach((line, i) => {
        if (declaresRing.test(line)) offenders.push(`${f}:${i + 1} ${line.trim()}`);
      });
  }
  assert.deepEqual(
    offenders,
    [],
    `ring geometry re-rolled outside icon-loader:\n${offenders.join('\n')}`,
  );
});

test('the dock bubble box and the ring it hosts come from one token', () => {
  // The bubble is a definite box so that adding or removing the arc never
  // resizes it, and the ring diameter is set to that same box so the arc hugs
  // the edge instead of the glyph. Three declarations have to agree; if one
  // is changed alone the ring silently stops tracking the bubble.
  const block = ruleBlock(readFileSync(`${COMPONENT_DIR}/dock.css`, 'utf8'), '.juno-dock__bubble');
  const ring = decl(block, '--juno-icon-loader-ring');
  const inline = decl(block, 'inline-size');
  const blockSize = decl(block, 'block-size');
  assert.ok(ring, '.juno-dock__bubble must set --juno-icon-loader-ring');
  assert.equal(inline, ring, 'inline-size must equal the ring diameter');
  assert.equal(blockSize, ring, 'block-size must equal the ring diameter');
});

test('bubble and icon loader agree on a grid formatting context', () => {
  // They are composed on one element (class="juno-dock__bubble juno-icon-loader").
  // The stacking depends on children sharing one grid cell via grid-area: 1/1,
  // so both must establish a grid box — whichever wins the cascade. Switching
  // either to flex/block breaks the concentric stack with no CSS error.
  const bubble = ruleBlock(readFileSync(`${COMPONENT_DIR}/dock.css`, 'utf8'), '.juno-dock__bubble');
  const loader = ruleBlock(
    readFileSync(`${COMPONENT_DIR}/icon-loader.css`, 'utf8'),
    '.juno-icon-loader',
  );
  for (const [name, block] of [
    ['.juno-dock__bubble', bubble],
    ['.juno-icon-loader', loader],
  ]) {
    const display = decl(block, 'display');
    assert.match(display ?? '', /^(inline-)?grid$/, `${name} must be a grid box, got "${display}"`);
  }
});

test('every pill dock item in the showcase carries an accessible name', () => {
  // The pill variant hides .juno-dock__label, so the glyph alone is the whole
  // control — without aria-label on the <a>/<button> the item has no
  // accessible name at all. dock.css states this as a MUST; nothing enforced it.
  const html = readFileSync('showcase/mobile.html', 'utf8');
  const nav = html.slice(html.indexOf('juno-dock--pill'));
  const region = nav.slice(0, nav.indexOf('</nav>'));
  assert.ok(region.includes('juno-dock__item'), 'no pill dock items found in showcase/mobile.html');

  const unnamed = [...region.matchAll(/<(a|button)\b[^>]*juno-dock__item[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => !/aria-label\s*=\s*["'][^"']+["']/.test(tag));
  assert.deepEqual(unnamed, [], `pill dock item without aria-label:\n${unnamed.join('\n')}`);
});

// The guard that used to live here — "every class named in a `:where()` touch
// list exists" — is retired, and retired by succeeding. It was written for
// 20260826-024 (`.juno-seg__option` for `.juno-seg__opt`) and immediately found
// a second instance (`.juno-list__item` for `.juno-list__row`). Conformance-kit
// slice 2 then removed the class of defect instead of detecting it: the lists
// are GENERATED from src/css/touch-surfaces.mjs, so a member cannot be
// misspelled into silence.
//
// It failed on that change, correctly — it asserts base.css carries the lists,
// and base.css no longer does. Its replacement is
// test/classes.test.mjs::"every declared touch surface is a class some
// component defines", which asks the same question of the declared set and is
// non-circular about it (the manifest is built from the bundle, and the bundle
// now contains the generated lists, so a misspelled member would vouch for
// itself there).

test('the segmented pill holds a tap floor like every other control', () => {
  // The only interactive primitive that had none: it computed ~25px from its
  // padding, which meets WCAG 2.2 AA (2.5.8, 24px) by accident and misses the
  // 44px comfortable target on touch entirely. The floor goes on the painted
  // box — `input + span` / `button.juno-seg__opt` — because the label that
  // wraps it is a bare inline-flex taking its height from that box.
  const css = readFileSync(`${COMPONENT_DIR}/segmented.css`, 'utf8');
  const pill = ruleBlock(css, '.juno-seg__opt input + span,\nbutton.juno-seg__opt');
  assert.equal(decl(pill, 'min-block-size'), 'var(--juno-size-tap-min)');

  // ...and --sm does not take it away. Unlike .juno-btn--sm, whose whole
  // documented purpose is a sub-tap desktop control, a segmented row is often
  // the only control on a settings section (20260826-025).
  const sm = stripComments(css).slice(stripComments(css).indexOf('.juno-seg--sm'));
  assert.ok(!/min-block-size|min-height/.test(sm), '--sm must not restate or drop the tap floor');
});
