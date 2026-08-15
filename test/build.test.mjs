// Build-integrity tests. Assumes `npm run build` has run (npm test does it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import postcss from 'postcss';
import { TOKENS, CORE, getTokens } from '../dist/js/tokens.js';
import { buildReference, REFERENCE_PATH } from '../scripts/gen-docs.mjs';

const PALETTES = ['standard', 'colorblind', 'soft'];
const MODES = ['dark', 'light'];
const ROLES = [
  'nominal',
  'active',
  'target',
  'caution',
  'warning',
  'data',
  'data-dim',
  'label',
  'muted',
  'border',
  'border-strong',
  's0',
  's1',
  's2',
  's3',
];

test('every platform output exists and is non-empty', () => {
  const outputs = [
    'dist/css/juno.css',
    'dist/css/juno-tokens.css',
    'dist/scss/_juno-tokens.scss',
    'dist/js/tokens.js',
    'dist/js/tokens.d.ts',
    'dist/json/tokens.json',
    'dist/android/colors.xml',
    'dist/android/dimens.xml',
    'dist/ios/JunoTokens.swift',
    'dist/flutter/juno_tokens.dart',
  ];
  for (const f of outputs) {
    assert.ok(existsSync(f), `missing ${f}`);
    assert.ok(readFileSync(f, 'utf8').trim().length > 0, `empty ${f}`);
  }
});

test('every package export resolves to a real file', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const [key, val] of Object.entries(pkg.exports)) {
    const f = typeof val === 'string' ? val : val.import;
    assert.ok(existsSync(f), `export "${key}" → ${f} missing`);
  }
});

test('JS token model has full palette × mode × role coverage', () => {
  for (const p of PALETTES) {
    for (const m of MODES) {
      for (const role of ROLES) {
        assert.ok(TOKENS[p][m][role], `TOKENS.${p}.${m}.${role} missing`);
      }
    }
  }
  assert.equal(getTokens('colorblind', 'light').warning, '#BA4300');
  assert.equal(CORE.space['16'], '16px');
  assert.equal(CORE.bp['2xl'], '1536px');
});

test('every var(--juno-*) used in src/css is defined in the token output', () => {
  const tokens = readFileSync('dist/css/juno-tokens.css', 'utf8');
  const defined = new Set([...tokens.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));
  // runtime / component-local props set in-component or by the consumer:
  const local = new Set([
    'juno-role',
    'juno-font-scale',
    'juno-icon-size',
    'juno-skeleton-h',
    'juno-avatar-size',
    'juno-stepper-marker',
    'juno-slider-pct',
    'juno-control-surface',
    'juno-control-edge',
    'juno-control-edge-strong',
    'juno-knob-edge',
    'juno-knob-face-hi',
    'juno-knob-face-lo',
    'juno-knob-grip',
    'juno-pad-control-block',
    'juno-pad-control-inline',
    'juno-pad-surface-block',
    'juno-pad-surface-inline',
    'juno-gap-control',
    'juno-tile-min',
    'juno-gap-content',
    'juno-gauge-value',
    'juno-gauge-size',
    'juno-gauge-width',
    'juno-rail-width',
    'juno-thumb-glyph',
    'juno-progress',
    'juno-arc-size',
    'juno-arc-width',
    'juno-beacon-size',
    'juno-beacon-fill-stop',
    'juno-measure',
    'juno-stack-space',
    'juno-cluster-align',
    'juno-cluster-space',
    'juno-grid-space',
    'juno-grid-min',
    'juno-sidebar-space',
    'juno-sidebar-width',
    'juno-sidebar-content-min',
    'juno-switcher-space',
    'juno-switcher-threshold',
    'juno-reel-space',
    'juno-table-fill',
    'juno-cell-max',
    'juno-app-shell-topbar-size',
    'juno-icon-loader-ring',
    'juno-icon-loader-ring-width',
    'juno-dock-clearance',
    'juno-dock-h',
    'juno-dock-clearance-scale',
    'juno-pillbar-h',
    'juno-pillbar-clearance',
    'juno-motion',
    'juno-motion-scale',
    'juno-thumb-ratio',
    'juno-skeleton-ratio',
    'juno-scroller-overflow',
    'juno-scroller-overscroll',
    'juno-scroller-snap',
    'juno-snap-align',
    'juno-sheet-h',
    'juno-sheet-max',
    'juno-dock-scale',
    'juno-dock-fold',
    'juno-fold-size',
    'juno-fold-gap',
    'juno-dock-fold-split',
    'juno-dock-fold-scale',
    'juno-dock-fold-shrink',
    'juno-dock-fold-slide',
    'juno-dock-fold-smoothing',
    'juno-dock-collapsed-size',
    'juno-dock-edge-gap',
    'juno-pillbar-item',
    'juno-pillbar-gap',
    'juno-pillbar-pad',
    'juno-pillbar-edge',
    'juno-touch-action',
    'juno-label-size',
    'juno-shimmer-dur',
  ]);
  const files = [
    'src/css/base.css',
    'src/css/utilities.css',
    'src/css/layout.css',
    ...readdirSync('src/css/components').map((f) => `src/css/components/${f}`),
  ];
  const used = new Set();
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/var\(--([\w-]+)/g)) used.add(m[1]);
  }
  const missing = [...used].filter((v) => !defined.has(v) && !local.has(v));
  assert.deepEqual(missing, [], `undefined vars: ${missing.join(', ')}`);
});

test('env() safe-area fallbacks inside calc() carry a length unit', () => {
  // Regression guard: a unitless `0` fallback is a <number>, not a <length>, so
  // `calc(... + env(safe-area-inset-*, 0))` is an invalid sum and the whole
  // DECLARATION is dropped (it does not evaluate to zero — the property simply
  // never applies). Fallbacks must be unit-bearing (0px). See 20260802-016.
  // Bare (non-calc) property values may keep a unitless 0.
  const files = [
    'src/css/base.css',
    'src/css/utilities.css',
    'src/css/layout.css',
    ...readdirSync('src/css/components').map((f) => `src/css/components/${f}`),
  ];
  const unitlessEnv = /env\(\s*safe-area-inset-[a-z]+\s*,\s*-?\d*\.?\d+\s*\)/g;
  const bad = [];
  for (const f of files) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!line.includes('calc(')) return;
        for (const m of line.matchAll(unitlessEnv)) bad.push(`${f}:${i + 1}  ${m[0].trim()}`);
      });
  }
  assert.deepEqual(bad, [], `unitless env() fallback inside calc():\n${bad.join('\n')}`);
});

test('every showcase page opts into the safe area with viewport-fit=cover', () => {
  // On iOS, `viewport-fit` defaults to `auto` and WebKit gates the safe-area
  // insets on `cover` — so without this meta EVERY env(safe-area-inset-*) in the
  // library resolves to 0 and the showcase silently stops demonstrating the
  // thing it exists to demonstrate. `contain` does NOT opt out; only `cover`.
  // See ticket 20260803-028 and docs/ios-conformance.md.
  // Recursive: showcase/device/ is the on-device harness, where a missing
  // viewport-fit would silently zero every inset it exists to measure.
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? walk(`${dir}/${e.name}`)
        : e.name.endsWith('.html')
          ? [`${dir}/${e.name}`]
          : [],
    );
  const pages = walk('showcase');
  assert.ok(pages.length > 0, 'no showcase pages found');
  const missing = pages.filter((p) => {
    const meta = readFileSync(p, 'utf8').match(/<meta\s+name="viewport"[^>]*>/i);
    return !meta || !/viewport-fit\s*=\s*cover/i.test(meta[0]);
  });
  assert.deepEqual(missing, [], `showcase pages missing viewport-fit=cover: ${missing.join(', ')}`);
});

test('every breakpoint literal in src/css comes from a breakpoint token', () => {
  // The point of emitting @custom-media (20260802-024): the breakpoint tokens
  // are only the source of truth if the literals actually agree with them.
  // Media queries can't read custom properties, so src/css must hardcode — this
  // asserts every hardcoded width matches a generated boundary, catching the
  // case where someone edits a token and leaves a stale literal behind (or
  // invents an off-scale breakpoint).
  const emitted = readFileSync('dist/css/juno-custom-media.css', 'utf8');
  const allowed = new Set([...emitted.matchAll(/width\s*[<>]=\s*([\d.]+px)/g)].map((m) => m[1]));
  assert.ok(allowed.size > 0, 'no breakpoints emitted');

  const files = [
    'src/css/base.css',
    'src/css/utilities.css',
    'src/css/layout.css',
    'src/css/density.css',
    ...readdirSync('src/css/components').map((f) => `src/css/components/${f}`),
  ];
  const stray = [];
  for (const f of files) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!line.includes('@media')) return;
        for (const m of line.matchAll(/\(\s*width\s*[<>]=\s*([\d.]+px)\s*\)/g)) {
          if (!allowed.has(m[1])) stray.push(`${f}:${i + 1}  ${m[1]}`);
        }
      });
  }
  assert.deepEqual(stray, [], `breakpoint literals not backed by a token:\n${stray.join('\n')}`);
});

test('every animation name used in src/css has a matching @keyframes', () => {
  // Keyframe references cross file boundaries (.juno-shimmer in load-state.css
  // reuses @keyframes juno-skeleton-shimmer from skeleton.css, deliberately, so
  // there is one shimmer definition). CSS resolves those silently: rename or
  // delete the keyframe and the animation just stops, with no error anywhere.
  // The bundle is the only place that sees every file at once, so check there.
  const bundle = readFileSync('dist/css/juno.css', 'utf8');
  const defined = new Set([...bundle.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  const used = new Set(
    [...bundle.matchAll(/animation(?:-name)?:\s*([^;]+);/g)]
      .flatMap((m) => m[1].split(/[,\s]+/))
      .filter((w) => /^juno-/.test(w)),
  );
  const missing = [...used].filter((n) => !defined.has(n));
  assert.deepEqual(missing, [], `animation without @keyframes: ${missing.join(', ')}`);
});

test('nothing after the popover fallback re-declares display on the surfaces it hides', () => {
  // base.css hides .juno-menu / .juno-popover / .juno-tooltip__bubble where the
  // Popover API is absent (Safari/iOS < 17.0). That is not cosmetic: without the
  // API there is also no UA rule hiding a closed popover, so those surfaces are
  // position:fixed, opacity:0, pointer-events unset — invisible 256-280px panels
  // parked over the page swallowing taps.
  //
  // The guard wins the cascade today only because nothing later in the bundle
  // declares `display` on those selectors. It is NOT protected by specificity:
  // `.juno-menu[popover]` and `.juno-menu:popover-open` are both (0,2,0), so a
  // later `display` declaration would beat it on order alone — and it would lose
  // exactly where it matters, on an engine none of us can test, with an
  // invisible tap-swallowing panel as the symptom rather than a visible bug.
  //
  // So: assert the property the guard actually depends on. Reviewed as
  // 20260815-009; filed as 20260815-013.
  const bundle = readFileSync('dist/css/juno.css', 'utf8');
  const guarded = ['juno-menu', 'juno-popover', 'juno-tooltip__bubble'];
  const at = bundle.indexOf('@supports not selector(:popover-open)');
  assert.ok(at > 0, 'popover fallback block missing from the bundle');

  // Everything after the guard block, rule by rule. A rule counts as a
  // violation when its selector list targets one of the guarded surfaces
  // (not a descendant like .juno-menu__item) and its body declares `display`.
  const after = bundle.slice(bundle.indexOf('}', bundle.indexOf('}', at) + 1) + 1);
  const offenders = [];
  for (const m of after.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selectors, body] = m;
    if (!/(^|[\s,>+~])display\s*:/.test(body)) continue;
    for (const sel of selectors.split(',')) {
      const t = sel.trim();
      for (const g of guarded) {
        // the surface itself, optionally qualified — but never a descendant
        // (`.juno-menu .x`) or a BEM child (`.juno-menu__item`)
        const re = new RegExp(`\\.${g}(?![\\w-])[^\\s,>+~]*$`);
        if (re.test(t)) offenders.push(`${t} { ${body.trim().slice(0, 60)} }`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'a rule after the popover fallback re-declares display on a guarded surface; ' +
      'the fallback loses on order there (both are (0,2,0)) — merge the declaration ' +
      `into the fallback or raise its specificity deliberately: ${offenders.join(' | ')}`,
  );
});

test('the published surface carries the consumer docs and none of the process docs', () => {
  // `files` includes "docs" wholesale, so every file added under docs/ reaches
  // every consumer. That is right for the manual and wrong for anything about
  // how this repo is run: docs/release-gate.md shipped 9.7 kB of internal
  // release process to consumers for exactly one merge before it was noticed
  // (20260815-020). The rule that replaced it is positional — docs/ IS the
  // published manual; contributor and process documents live at the root
  // beside CONTRIBUTING.md, which has never shipped — and this pins both
  // halves, because each fails silently in its own direction: an internal doc
  // added to docs/ leaks, and a consumer doc dropped from `files` disappears
  // from under a citation that expects it.
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const shipped = new Set(pkg.files);

  // Contributor/process documents, by name. Not a heuristic: a heuristic would
  // pass until someone names a file something unexpected.
  for (const f of ['RELEASING.md', 'CONTRIBUTING.md', 'CLAUDE.md']) {
    assert.ok(existsSync(f), `${f} moved or renamed — update this test with it`);
    assert.ok(
      !shipped.has(f),
      `${f} is a process document and must not ship to consumers (files: ${pkg.files.join(', ')})`,
    );
  }
  assert.ok(!existsSync('docs/release-gate.md'), 'the release gate doc belongs at ./RELEASING.md');

  // The other direction: consumers (and nexora's IOS_BASELINE.md, which cites
  // the copy inside the installed package) depend on these being present.
  assert.ok(shipped.has('docs'), '`files` must ship docs/ — consumer docs are cited from it');
  for (const f of [
    'docs/ios-conformance.md',
    'docs/browser-support.md',
    'docs/getting-started.md',
  ]) {
    assert.ok(existsSync(f), `${f} is cited by consumers and must exist`);
  }
});

test('the icon injector ships without the sprite it injects', () => {
  // A consumer that subsets (junoui/subset) needs the injection mechanism and
  // NOT the 66-symbol payload: importing junoui/icons/inline to get ~8 lines of
  // DOM work would drag 25 kB of icons it deliberately does not ship, which is
  // what made the two features mutually exclusive before (20260815-025).
  const install = readFileSync('dist/icons/install.js', 'utf8');
  assert.match(install, /export function installSprite/);
  assert.match(install, /JUNO_SPRITE_ID/);
  assert.ok(!install.includes('<symbol'), 'the injector must carry no sprite payload');
  assert.ok(install.length < 2048, `injector should stay tiny, got ${install.length} B`);

  // And one implementation of the hidden holder, not two that agree today.
  const inline = readFileSync('dist/icons/inline.js', 'utf8');
  assert.match(inline, /from '\.\/install\.js'/, 'inline must delegate to the injector');
  assert.ok(inline.includes('<symbol'), 'the inline module is the one that carries the payload');
});

test('the floating-nav clearances are derived from the controls they clear', () => {
  // These were constants (space-72 + space-20) whose own comment promised they
  // would "stay correct when the dock geometry changes". They could not: the
  // pill is 62px at the default 44px bubble, and past a 58px bubble the
  // constant reserved less than the pill's height plus its margin — content
  // hid under the dock, silently, on any consumer that took junoui's explicit
  // invitation to parameterize --juno-size-tap-comfortable (20260815-026).
  const base = readFileSync('src/css/base.css', 'utf8');
  for (const token of ['--juno-dock-h', '--juno-pillbar-h', '--juno-dock-clearance-scale']) {
    assert.ok(base.includes(token), `${token} must be published for consumers to read`);
  }
  const clearance = base.slice(base.indexOf('--juno-dock-clearance:'));
  assert.match(clearance, /var\(--juno-dock-h\)/, 'clearance must derive from the pill height');
  assert.match(
    clearance,
    /var\(--juno-dock-clearance-scale\)/,
    'clearance must honour the scale knob',
  );
  assert.ok(
    !/--juno-dock-clearance:\s*calc\(\s*var\(--juno-space-\d+\)\s*\+\s*var\(--juno-space-\d+\)/.test(
      base,
    ),
    'clearance must not go back to a sum of bare spacing constants',
  );
});

test('no gated rule is silently beaten by a later rule at equal-or-lower specificity', () => {
  // A @media / @supports block adds NO specificity, so a gate written before
  // the component it guards loses on source order alone — silently, since the
  // gate reads correctly in the file it lives in and nothing errors. Four
  // instances shipped before this test existed (2026-08-15): the 16px input
  // font floor that never applied on any touch device, the forced-colors
  // borders, and the Popover fallback that won only by luck. src/css/
  // overrides.css is the structural fix; this asserts it stayed true.
  //
  // EMPTY SET, no allowlist: an allowlist is where violations go to be
  // forgotten, and in two months nobody can tell a deliberate exception from
  // an unfixed bug.
  //
  // Parsed with postcss rather than matched with a regex. That is not a style
  // preference: the first version of this check was hand-rolled regex and
  // reported ZERO on a bundle that provably contained the .juno-input pair.
  const spec = (sel) => {
    const s = sel.replace(/::[\w-]+/g, '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const cls =
      (s.match(/\.[\w-]+/g) || []).length +
      (s.match(/\[[^\]]+\]/g) || []).length +
      (s.match(/:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;
    const el = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return [ids, cls, el];
  };
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

  const decls = [];
  let order = 0;
  postcss.parse(readFileSync('dist/css/juno.css', 'utf8')).walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    let gate = '';
    for (let p = rule.parent; p; p = p.parent) {
      if (p.type === 'atrule' && /^(media|supports)$/.test(p.name)) gate = `@${p.name} ${p.params}`;
    }
    for (const sel of rule.selectors) {
      rule.walkDecls((d) => {
        if (d.prop.startsWith('--')) return;
        decls.push({
          sel: sel.trim(),
          prop: d.prop,
          spec: spec(sel),
          gate,
          order: order++,
          line: d.source?.start?.line,
        });
      });
    }
  });

  const beaten = [];
  for (const g of decls.filter((d) => d.gate)) {
    for (const l of decls) {
      if (l.order <= g.order || l.gate || l.prop !== g.prop || l.sel !== g.sel) continue;
      if (cmp(l.spec, g.spec) <= 0) {
        beaten.push(`${g.gate} { ${g.sel} { ${g.prop} } } (line ${g.line}) lost to line ${l.line}`);
      }
    }
  }
  assert.deepEqual(
    [...new Set(beaten)],
    [],
    'a gate is inert: move the rule to src/css/overrides.css (bundled last) or raise its specificity deliberately',
  );
});

test('committed token reference is up to date', () => {
  const current = readFileSync(REFERENCE_PATH, 'utf8');
  assert.equal(current, buildReference(), 'run `npm run gen-docs` and commit');
});
