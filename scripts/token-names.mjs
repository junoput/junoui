// ════════════════════════════════════════════════════════════════════════
//  junoui — token naming + value classification, shared
// ════════════════════════════════════════════════════════════════════════
//  Imported by style-dictionary.config.mjs (which generates) and by the
//  test suite (which checks the generated output against the DTCG source).
//  Both sides therefore derive names and kinds the same way by construction,
//  rather than by two implementations agreeing today — which is the whole
//  defect class this org keeps paying for.
//
//  It is a module of its own rather than exports from the config because the
//  config BUILDS on import (`await sd.buildAllPlatforms()` at its foot), so a
//  test importing it would rebuild dist/ as a side effect of asking what a
//  token is called.
// ════════════════════════════════════════════════════════════════════════

/** The semantic color roles, in the order a theme declares them.
 *
 *  One list. It drives the CSS custom properties, the Rust `Palette` struct's
 *  fields and the per-theme constants that fill it — a role added here appears
 *  in all of them or in none, never in some. */
export const ROLES = [
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

/** camelCase identifier: ['standard','dark','data-dim'] → standardDarkDataDim.
 *  Hyphens inside a segment are word breaks so native identifiers stay valid. */
export const camel = (parts) =>
  parts
    .flatMap((p) => String(p).split('-'))
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');

/** snake_case identifier: ['data-dim'] → data_dim. Rust field names. */
export const snake = (parts) =>
  parts
    .flatMap((p) => String(p).split('-'))
    .join('_')
    .toLowerCase();

/** SCREAMING_SNAKE identifier: ['size','tap','comfortable'] → SIZE_TAP_COMFORTABLE.
 *  Rust constant names. */
export const screamingSnake = (parts) => snake(parts).toUpperCase();

/**
 * What kind of value a token carries, decided by its FORM rather than by which
 * file it came from.
 *
 * Group membership is the wrong question: `size.tap.min` is `"24px"` and
 * `z.raised` is `100`, both "core" tokens, and a new group tomorrow carries
 * whatever it carries. The form is what a target has to be able to emit.
 *
 *   px    "24px"    → a length; f32 in Rust
 *   ms    "160ms"   → a duration; f32 milliseconds
 *   int   100       → i32 (z-index, font weight)
 *   float 0.45      → f32 (opacity, ratios)
 *   text  the rest  → &str, verbatim (CSS shadows, font stacks)
 */
export function classify(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  const s = String(value).trim();
  if (/^-?\d+(\.\d+)?px$/.test(s)) return 'px';
  if (/^-?\d+(\.\d+)?ms$/.test(s)) return 'ms';
  if (/^-?\d+$/.test(s)) return 'int';
  if (/^-?\d*\.\d+$/.test(s)) return 'float';
  return 'text';
}

/** The numeric part of a px/ms value, or the number itself. */
export const numeric = (value) => parseFloat(String(value));

/** A Rust `f32` literal — always with a decimal point, or `24` is an integer
 *  and will not compile where an f32 is expected. */
export const f32Literal = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));
