// Colour swatch + palette (X5 / 20260829-025).
//
// The claim worth guarding is not "there is a border". It is that a swatch
// showing an ARBITRARY colour keeps a visible edge — which is a property over
// the whole colour space, not a declaration. Same shape as the canvas-ink
// sweep: assert the property, not the value.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toHex } from '../scripts/color.mjs';

const css = readFileSync('dist/css/juno.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '\n');
const manifest = JSON.parse(readFileSync('dist/classes.json', 'utf8'));
const showcase = readFileSync('showcase/forms.html', 'utf8');

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(m, `no \`${selector}\` rule in the bundle`);
  return m[1];
};

// ── WCAG 2.2 relative luminance and contrast, written out ────────────────
// Same reason as the canvas-ink guard: this is the definition the claim rests
// on, and wrapping junoui's own colour code would be checking the build with
// the build.
function luminance([r, g, b]) {
  const lin = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Composite `over` (with alpha) onto `base`, both sRGB 0..255. */
const over = ([r, g, b, a], base) => [
  r * a + base[0] * (1 - a),
  g * a + base[1] * (1 - a),
  b * a + base[2] * (1 - a),
];

// The two rings as authored: an inset black at 45%, an outset white at 35%.
// Read from the stylesheet rather than retyped, so a retune fails here instead
// of quietly weakening the guarantee.
function rings(body) {
  const dark = /inset 0 0 0 [^,]*rgb\(0 0 0 \/ ([\d.]+)\)/.exec(body);
  const light = /\n?\s*0 0 0 [^,]*rgb\(255 255 255 \/ ([\d.]+)\)/.exec(body);
  assert.ok(dark, 'no inset dark ring');
  assert.ok(light, 'no outset light ring');
  return { dark: Number(dark[1]), light: Number(light[1]) };
}

const AA_NONTEXT = 3; // WCAG 2.2 1.4.11 — a border is non-text contrast

test('the stylesheet and the showcase are actually read', () => {
  assert.ok(css.length > 1000);
  assert.ok(showcase.includes('juno-swatch'), 'the showcase has no swatch');
});

// The panels a swatch actually sits on. Read from the token output, not
// remembered: if a surface is retuned the sweep has to follow it.
const tokens = JSON.parse(readFileSync('dist/json/tokens.json', 'utf8'));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

test('the swatch boundary stays visible on every colour, on every panel', () => {
  // THE PROPERTY, and it took two attempts to state. The first version asked
  // whether both rings contrast with the SWATCH and reported 145 failures —
  // wrong question: an outset box-shadow is outside the element, so it
  // composites over the PANEL. What has to hold is that the swatch's EDGE is
  // discernible, and it has three ways to be:
  //
  //   inset ring vs the swatch's own fill
  //   outset ring vs the panel behind it
  //   the swatch itself vs the panel
  //
  // Asked properly, the shipped 0.45/0.35 alphas still failed — 2.57:1 at a
  // mid grey on a light panel — which is why they are 0.65.
  const { dark, light } = rings(rule('.juno-swatch'));
  const panels = ['dark', 'light'].map((m) => hex(toHex(tokens.color.standard[m].s1.$value)));

  const failures = [];
  for (const panel of panels) {
    for (let v = 0; v <= 255; v++) {
      const swatch = [v, v, v];
      const best = Math.max(
        contrast(over([0, 0, 0, dark], swatch), swatch),
        contrast(over([255, 255, 255, light], panel), panel),
        contrast(swatch, panel),
      );
      if (best < AA_NONTEXT) {
        failures.push(
          `#${v.toString(16).padStart(2, '0').repeat(3)} on #${panel.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}: ${best.toFixed(2)}:1`,
        );
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    `${failures.length} swatch/panel pairs leave the boundary under ${AA_NONTEXT}:1`,
  );
});

test('the sweep registers the alphas this component shipped with first', () => {
  // THE CONTROL, and it is not hypothetical: 0.45 inset / 0.35 outset is what
  // this file was written with, and the sweep is what rejected it. Running the
  // same property at those values must still produce failures, or the guard has
  // stopped being able to fail and the number above is decoration.
  const panels = ['dark', 'light'].map((m) => hex(toHex(tokens.color.standard[m].s1.$value)));
  const failures = [];
  for (const panel of panels) {
    for (let v = 0; v <= 255; v++) {
      const swatch = [v, v, v];
      const best = Math.max(
        contrast(over([0, 0, 0, 0.45], swatch), swatch),
        contrast(over([255, 255, 255, 0.35], panel), panel),
        contrast(swatch, panel),
      );
      if (best < AA_NONTEXT) failures.push([v, best]);
    }
  }
  assert.ok(
    failures.length > 20,
    `the old alphas failed only ${failures.length} cases — the control is inert`,
  );
  // and the worst of them is the ~2.57:1 mid-grey-on-a-light-panel case the
  // component's own comment records
  const worst = Math.min(...failures.map(([, c]) => c));
  assert.ok(worst < 2.7, `the worst old case measured ${worst.toFixed(2)}:1`);
});

test('the rings are drawn as shadows, not as a border', () => {
  // A border eats into the colour area and changes the swatch's size with its
  // style; two swatches with different borders would then be different sizes.
  const body = rule('.juno-swatch');
  assert.match(body, /box-shadow:/);
  assert.match(body, /border:\s*none/);
});

test('focus rings sit OUTSIDE the swatch', () => {
  // Their contrast is then against the panel, a known surface, rather than
  // against a hue junoui cannot predict. A ring drawn on the swatch has the
  // same unsolvable problem as the border, and a thicker ring does not fix a
  // hue collision.
  const body = rule('.juno-swatch--button:focus-visible,\n.juno-palette__option:focus-visible');
  assert.match(body, /outline-offset:\s*var\(--juno-space-4\)/);
  assert.ok(!/outline-offset:\s*calc\(-1/.test(body), 'the focus ring is inset onto the swatch');
});

test('the swatch sizes off the control scale', () => {
  assert.match(rule('.juno-swatch'), /--juno-swatch-size:\s*var\(--juno-size-tap-min\)/);
});

test('every swatch and palette class is in the manifest and documented', () => {
  const g = manifest.all.filter((c) => /^juno-(swatch|palette)/.test(c));
  assert.ok(g.length >= 8, `only ${g.length} classes`);
  assert.deepEqual(
    g.filter((c) => !manifest.public.includes(c)),
    [],
  );
});

// ── colour is never the only signal ──────────────────────────────────────

test('the checked state carries a GLYPH, not only a hue', () => {
  // The rule a bare swatch violates. "The chosen one looks slightly different"
  // is invisible to anyone who cannot separate the two hues.
  assert.match(
    css,
    /\.juno-palette__option\[aria-(?:selected|checked)=['"]true['"]\][^{]*\.juno-palette__check/,
  );
  assert.match(rule('.juno-palette__check'), /display:\s*none/);
});

test('the check itself survives an arbitrary swatch', () => {
  // It sits on the colour, so it has the swatch's own problem: a white glyph
  // with a dark halo, which is the canvas-ink pair at glyph scale.
  const body = rule('.juno-palette__check');
  assert.match(body, /color:\s*#fff/i);
  // not `[^)]*` — that stops at the `)` of var(--juno-border-width-1)
  assert.match(body, /drop-shadow\([\s\S]*?rgb\(0 0 0/, 'the check has no dark halo');
});

test('the selected option has a second, non-glyph cue', () => {
  // A check inside a 24px square is small. The ring is drawn outside, where its
  // contrast is against the panel.
  const sel =
    /\.juno-palette__option\[aria-selected=['"]true['"]\],\s*\.juno-palette__option\[aria-checked=['"]true['"]\]\s*\{([^}]*)\}/.exec(
      css,
    );
  assert.ok(sel, 'no selected-option rule');
  assert.match(sel[1], /var\(--juno-active\)/);
});

test('"no colour" is a slash, not a grey', () => {
  // A consumer without this paints unset as a mid grey, and the user cannot
  // tell grey from none — a different thing to know.
  const body = rule('.juno-swatch--none,\n.juno-palette__option--none');
  assert.match(body, /linear-gradient/);
  assert.ok(!/^\s*background:\s*var\(--juno-muted\)/m.test(body));
});

test('every swatch in the showcase carries a name', () => {
  // A swatch that IS the information needs a name; colour is not one.
  const swatches = [...showcase.matchAll(/<(?:span|button) class="juno-swatch[^"]*"([^>]*)>/g)];
  assert.ok(swatches.length >= 5, `only ${swatches.length} swatches`);
  for (const [, attrs] of swatches) {
    assert.match(attrs, /aria-label="[^"]+"/, `swatch without a name: ${attrs.trim()}`);
  }
  const options = [...showcase.matchAll(/<button class="juno-palette__option"([^>]*)>/g)];
  assert.ok(options.length >= 6, `only ${options.length} palette options`);
  for (const [, attrs] of options) {
    assert.match(attrs, /aria-label="[^"]+"/);
    assert.match(attrs, /role="option"/);
    assert.match(attrs, /aria-selected="(true|false)"/);
  }
});

test('the palette is a listbox with a name', () => {
  const grid = /<div class="juno-palette"([^>]*)>/.exec(showcase)?.[1] ?? '';
  assert.match(grid, /role="listbox"/);
  assert.match(grid, /aria-label="[^"]+"/);
});
