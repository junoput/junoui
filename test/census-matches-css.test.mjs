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
//
// WHY THOSE COLUMNS ARE NOT CHECKED HERE, measured rather than assumed. A naive
// extension was tried on 2026-09-08 and produced 28 mismatches, ALL of them the
// checker's fault:
//
//   BEM parts — assuming a component's class prefix equals its filename is
//   wrong. `toggle-button.css` declares `.juno-toggle-btn__*` (6 parts, exactly
//   what the census says); `loader.css` is multi-namespace, declaring
//   `.juno-arc__`, `.juno-bar__` and `.juno-beacon__` and none named for the
//   file. That assumption reported 0 parts for 7 components that have them.
//
//   State hooks — a fixed pseudo-class list undercounts. `tree.css` also uses
//   `:not()` and pseudo-elements, so a list of the obvious hooks reported 6
//   where the census says 8. Every one of the 21 state mismatches ran the same
//   direction, which is the signature of a lossy extractor rather than 21 bad
//   rows.
//
// So checking those columns requires reimplementing the census's own extraction
// rules, not a regex over a naming convention — and a naive attempt yields
// confident false positives, which is worse than the gap. The two columns above
// are checked precisely because they are binary presence tests (`@container` /
// `@media`, and the seven density hooks) with no naming assumptions in them.
//
// ── State hooks, added 2026-09-14 (20260914-091) ────────────────────────────
//
// The paragraph above is now half out of date and the half that changed is
// worth reading, because the reason the first attempt failed was not that the
// column is underivable.
//
// The 2026-09-08 attempt undercounted with a FIXED LIST of pseudo-classes, so
// anything not on the list vanished and all 21 mismatches ran the same
// direction — the signature of a lossy extractor. This one inverts that: it
// takes EVERY pseudo-class and attribute selector it finds and then removes a
// DECLARED, REASONED exclusion set. A hook nobody anticipated is therefore
// reported rather than dropped, which is the direction an extractor should
// fail in.
//
// WHY IT WAS WORTH DOING. The census's checkbox row read
// `:disabled, :has(), :checked` while `checkbox.css` had styled
// `:indeterminate` since 2026-06-29 — the FIFTH place that state was
// invisible, after the component doc, the ARIA contract, every showcase page
// and every visual baseline. A census that says of itself "measured from the
// CSS itself" was the last of the five a reader could have checked.
//
// CALIBRATED BEFORE BEING TRUSTED: run against the 44 rows the census already
// gets right, it reports nothing. Two independent derivations — juno-w1a's and
// mine, written separately — produced the same eight differing rows, and each
// was then verified by hand against the stylesheet. That is a different
// instrument agreeing, not the same regex run twice.
//
// WHAT IT STILL DOES NOT CHECK, so this is not read as more coverage than it
// is: `Tokens read` and `Local custom properties` remain unguarded. Three
// methods gave three different answers for `dock`'s local count (18, 19, 21)
// because the census's own declared-vs-read definition needs pinning down
// first. Writing any of those numbers into a shipped document today would be
// the defect this ticket is about, committed while fixing it. Still open.
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

/**
 * Pseudo-classes that are NOT a component state, with the reason each is out.
 *
 * A DECLARED exclusion set rather than a fixed inclusion list, and that is the
 * whole difference from the 2026-09-08 attempt: anything unanticipated is
 * REPORTED, not silently dropped.
 */
const NOT_A_STATE = new Set([
  // logical combinators — what they wrap is the hook, and it is counted
  // separately. `:not([aria-expanded])` in tree.css and
  // `:not(.juno-btn--dense)` in button.css are an attribute and a class.
  // `:has()` is NOT here: the census counts it, and rightly — reacting to your
  // own content is a state.
  'not',
  'is',
  'where',
  // document scoping, not a component state — table.css's
  // `:root[data-juno-mode='light']`, whose attribute IS counted.
  'root',
  // DOM position, not interaction — table.css's zebra striping.
  'first-child',
  'last-child',
  'only-child',
  'nth-child',
  'nth-of-type',
  'first-of-type',
  'last-of-type',
]);

/** The hooks a census row claims, normalised for comparison. */
function parseHooks(text) {
  if (text.trim() === '_none_') return [];
  return text
    .split(',')
    .map((t) => t.trim().replace(/`/g, '').replace(/\(\)$/, ''))
    .filter(Boolean)
    .sort();
}

/**
 * The hooks a stylesheet actually carries.
 *
 * Selector spans only: `([^{}]+)\{` captures every run of text ending at an
 * opening brace, which is a selector or an at-rule prelude and never a
 * declaration body (those end in `}`). That handles nested `@media`/`@container`
 * without tracking depth, and is a regex rather than a CSS parser deliberately —
 * this file's own header records why a homemade parser is the wrong trade here.
 *
 * `(?<!:):` excludes pseudo-ELEMENTS, which are never a state.
 */
function cssHooks(css) {
  const out = new Set();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)) {
    const sel = m[1];
    if (sel.trim().startsWith('@')) continue;
    for (const p of sel.matchAll(/(?<!:):([a-z-]+)/g)) {
      if (!NOT_A_STATE.has(p[1])) out.add(':' + p[1]);
    }
    for (const a of sel.matchAll(/\[([a-zA-Z-]+)[\]=~|^$*]/g)) out.add('[' + a[1] + ']');
  }
  return [...out].sort();
}

/** The token names a census row claims. */
function parseTokens(text) {
  if (text.trim() === '_none_') return [];
  return [...text.matchAll(/(--juno-[A-Za-z0-9-]+)/g)].map((m) => m[1]).sort();
}

/**
 * Every `--juno-*` name a stylesheet reads through `var()`, comments stripped.
 *
 * `[A-Za-z0-9-]`, NOT `[a-z0-9-]`. The token set contains camelCase names —
 * `--juno-font-lineHeight-relaxed` — and a lowercase-only class truncates them
 * at the capital letter, silently merging two distinct names into one stem. That
 * cost a wrong count while this ticket was being scoped: `alert` was reported as
 * 19 against a census row of 20, and the census was right (20260914-104).
 */
function cssTokens(css) {
  return [
    ...new Set(
      [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/var\((--juno-[A-Za-z0-9-]+)/g)].map(
        (m) => m[1],
      ),
    ),
  ].sort();
}

/** Every `### \`name\`` block that has a matching stylesheet. */
function rows() {
  const out = [];
  for (const block of md.split(/^### /m).slice(1)) {
    const name = block.split('\n')[0].replace(/`/g, '').trim();
    const file = `src/css/components/${name}.css`;
    if (!existsSync(file)) continue;
    const resp = /\*\*Responsive mechanism\*\*:\s*([^\n—]+)/.exec(block);
    const dens = /\*\*Density-aware\*\*:\s*(\w+)/.exec(block);
    const hooks = /\*\*States\/hooks\*\*\s*\(\d+\):\s*([^\n]*)/.exec(block);
    const toks = /\*\*Tokens read\*\*\s*\(\d+\):\s*([^\n]*)/.exec(block);
    out.push({
      name,
      css: readFileSync(file, 'utf8'),
      claimedResponsive: resp ? resp[1].trim().replace(/`/g, '') : null,
      claimedDensity: dens ? dens[1] : null,
      claimedHooks: hooks ? parseHooks(hooks[1]) : null,
      claimedTokens: toks ? parseTokens(toks[1]) : null,
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

test('every row claims a States/hooks field (vacuity floor for the check below)', () => {
  // A row whose field stopped parsing would compare `null` and be skipped
  // silently, which is the shape this suite exists to refuse.
  const missing = ROWS.filter((r) => r.claimedHooks === null).map((r) => r.name);
  assert.deepEqual(missing, [], 'a census row has no States/hooks field to check');
});

test('the extractor finds hooks where the census says there are hooks (calibration)', () => {
  // Before believing any MISMATCH, confirm the extractor works on the rows that
  // already agree. A regex that matched nothing would report every row as
  // "census claims hooks, CSS has none" — a confident, uniform, wrong answer,
  // and every mismatch running the same direction is exactly the signature the
  // 2026-09-08 attempt produced.
  const withHooks = ROWS.filter((r) => r.claimedHooks.length > 0);
  assert.ok(withHooks.length >= 30, `only ${withHooks.length} rows claim any hook`);
  const foundNothing = withHooks.filter((r) => cssHooks(r.css).length === 0).map((r) => r.name);
  assert.deepEqual(
    foundNothing,
    [],
    'the extractor found no hooks in a stylesheet the census says has some — ' +
      'suspect the extractor before the census',
  );
});

test('every States/hooks row lists what its stylesheet actually carries', () => {
  const wrong = [];
  for (const r of ROWS) {
    const actual = cssHooks(r.css);
    const missing = actual.filter((a) => !r.claimedHooks.includes(a));
    const extra = r.claimedHooks.filter((c) => !actual.includes(c));
    if (missing.length || extra.length) {
      wrong.push(
        `${r.name}: ${missing.length ? `CSS has ${missing.join(' ')} and the row does not` : ''}` +
          `${missing.length && extra.length ? '; ' : ''}` +
          `${extra.length ? `the row claims ${extra.join(' ')} and the CSS does not` : ''}`,
      );
    }
  }
  assert.deepEqual(
    wrong,
    [],
    'a States/hooks row disagrees with its stylesheet. The census says of itself ' +
      '"measured from the CSS itself" — that has to keep being true, or it becomes ' +
      'the last place a reader checks and the fifth place a state is invisible. ' +
      'If a hook is genuinely not a state, add it to NOT_A_STATE with the reason ' +
      'rather than editing the row to match.',
  );
});

// ── Tokens read, added 2026-09-14 (20260914-104) ────────────────────────────
//
// The LAST of the census's five columns to be guarded, and the one that turned
// out to need no judgement at all. `Local custom properties` stays hand-derived
// because deciding what belongs in it means deciding who OWNS a name, and two
// counter-cases showed no mechanical rule is right. This column only has to
// answer what a file's own text SAYS, and a file's own text is not in dispute:
// no allowlist, no ownership filter, no cross-cutting exclusions, no chain of
// definitions to walk.
//
// It had no stated method at all until today — every other column had one — and
// it drifted in exactly the places that would be expected: three rows, all
// undercounts, all from changes that landed hours earlier and updated the
// sibling column while leaving this one.
//
// A counter-case was looked for specifically rather than assumed absent: a token
// mentioned only in a comment (a real requirement, handled by stripping, and not
// an ownership question); a token in an `@media`/`@supports`/`@container style()`
// prelude (zero occurrences in this codebase, named here as a future blind spot);
// and an indirect read through another property's definition (the proposed
// example dissolved on inspection — `--juno-dock-avail` is declared in
// `dock.css` itself — and the method never has to answer it, because it asks
// what the file's text contains rather than what it transitively depends on).

test('every row claims a Tokens read field (vacuity floor for the check below)', () => {
  const missing = ROWS.filter((r) => r.claimedTokens === null).map((r) => r.name);
  assert.deepEqual(missing, [], 'a census row has no Tokens read field to check');
});

test('the token extractor finds tokens where the census says there are some (calibration)', () => {
  // Same guard as the hooks calibration above, and for the same reason: an
  // extractor that silently matched nothing would report every row as wrong in
  // one direction, which is a confident uniform false answer rather than a
  // visible failure.
  const withTokens = ROWS.filter((r) => r.claimedTokens.length > 0);
  assert.ok(withTokens.length >= 40, `only ${withTokens.length} rows claim any token`);
  const foundNothing = withTokens.filter((r) => cssTokens(r.css).length === 0).map((r) => r.name);
  assert.deepEqual(
    foundNothing,
    [],
    'the extractor found no var() reads in a stylesheet the census says has some — ' +
      'suspect the extractor before the census',
  );
});

test('the token extractor keeps camelCase names whole', () => {
  // The specific bug that produced a wrong count while this was being scoped.
  // Without this, a character class narrowed back to [a-z0-9-] passes every row
  // by truncating the same names the census would also have to truncate.
  const sample = cssTokens('a{font:var(--juno-font-lineHeight-relaxed) var(--juno-s1)}');
  assert.deepEqual(sample, ['--juno-font-lineHeight-relaxed', '--juno-s1']);
});

test('every Tokens read row lists what its stylesheet actually reads', () => {
  const wrong = [];
  for (const r of ROWS) {
    const actual = cssTokens(r.css);
    const missing = actual.filter((a) => !r.claimedTokens.includes(a));
    const extra = r.claimedTokens.filter((c) => !actual.includes(c));
    if (missing.length || extra.length) {
      wrong.push(
        `${r.name}: ${missing.length ? `reads ${missing.join(' ')} and the row does not list it` : ''}` +
          `${missing.length && extra.length ? '; ' : ''}` +
          `${extra.length ? `the row lists ${extra.join(' ')} and the CSS does not read it` : ''}`,
      );
    }
  }
  assert.deepEqual(
    wrong,
    [],
    'a Tokens read row disagrees with its stylesheet. The rule is every --juno-* ' +
      'name inside a var() call in the live CSS, comments stripped, with no ' +
      'exclusions — see the Method notes. A name only DECLARED and never read ' +
      'back belongs in Local custom properties instead.',
  );
});
