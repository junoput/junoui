// docs/inventory-elements.md's PER-COMPONENT rows, checked against the CSS.
//
// test/inventory-elements.test.mjs checks the census's PROSE against its own
// ROWS — a real guard, and a different one. Nothing has ever checked the rows
// against `src/css`, which is the surface the census actually describes.
//
// That gap bit on 2026-09-08 and it bit silently. Three landed changes in one
// session added container queries — 20260908-005 (rail auto-collapse) and
// 20260908-034 (list/tree chevron-drop rung) — and every one of them left the
// census's `Responsive mechanism` row stating the pre-change answer:
//
//     list   census "neither"              CSS had a container query
//     rail   census "viewport media query" CSS had both
//     tree   census "viewport media query" CSS had both
//
// Nothing went red, because nothing looked. The census is cited by
// docs/sidebar-behaviour.md and was used to rank W7 candidates, so a stale row
// is not cosmetic — it is an input to decisions.
//
// SCOPE, stated so this is not read as more coverage than it is: this checks
// two columns, `Responsive mechanism` and `Density-aware`, because both are
// mechanically derivable from the stylesheet. The token lists, modifiers, BEM
// parts and state hooks are NOT checked here and remain guarded by nothing but
// the census author's script and five hand spot-checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const CENSUS = 'docs/inventory-elements.md';
const md = readFileSync(CENSUS, 'utf8');

// The seven density-layer hooks src/css/density.css exposes, plus the attribute
// itself — the same list the census's own Method notes name.
const DENSITY_HOOKS = [
  '--juno-pad-control-',
  '--juno-pad-surface-',
  '--juno-gap-control',
  '--juno-gap-content',
  '--juno-tile-min',
  '[data-juno-density]',
];

/** Every `### \`name\`` block that has a matching stylesheet. */
function rows() {
  const out = [];
  for (const block of md.split(/^### /m).slice(1)) {
    const name = block.split('\n')[0].replace(/`/g, '').trim();
    const file = `src/css/components/${name}.css`;
    if (!existsSync(file)) continue;
    const resp = /\*\*Responsive mechanism\*\*:\s*([^\n—]+)/.exec(block);
    const dens = /\*\*Density-aware\*\*:\s*(\w+)/.exec(block);
    out.push({
      name,
      css: readFileSync(file, 'utf8'),
      claimedResponsive: resp ? resp[1].trim().replace(/`/g, '') : null,
      claimedDensity: dens ? dens[1] : null,
    });
  }
  return out;
}

const ROWS = rows();

test('the census was really read and really matched to stylesheets (vacuity floor)', () => {
  // Without this, a regex that stopped matching would make every assertion
  // below iterate an empty list and pass — the shape this whole suite exists
  // to refuse. 45 is the same floor the census's own extraction uses.
  assert.ok(ROWS.length >= 45, `only ${ROWS.length} census rows matched a stylesheet`);
  assert.ok(
    ROWS.every((r) => r.claimedResponsive),
    'a row has no Responsive mechanism field',
  );
  assert.ok(
    ROWS.every((r) => r.claimedDensity),
    'a row has no Density-aware field',
  );
});

test('every Responsive mechanism row states what its stylesheet actually contains', () => {
  const wrong = [];
  for (const r of ROWS) {
    const hasContainer = /@container/.test(r.css);
    const hasMedia = /@media/.test(r.css);
    const actual =
      hasContainer && hasMedia
        ? 'both'
        : hasContainer
          ? 'container query'
          : hasMedia
            ? 'viewport media query'
            : 'neither';
    // The row may append a dash and prose; only the verdict is asserted.
    if (!r.claimedResponsive.startsWith(actual)) {
      wrong.push(`${r.name}: census says "${r.claimedResponsive}", CSS has "${actual}"`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('every Density-aware row states what its stylesheet actually contains', () => {
  const wrong = [];
  for (const r of ROWS) {
    const actual = DENSITY_HOOKS.some((h) => r.css.includes(h)) ? 'yes' : 'no';
    if (r.claimedDensity !== actual) {
      wrong.push(`${r.name}: census says ${r.claimedDensity}, CSS says ${actual}`);
    }
  }
  assert.deepEqual(wrong, []);
});
