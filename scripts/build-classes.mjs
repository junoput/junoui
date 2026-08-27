// ════════════════════════════════════════════════════════════════════════
//  junoui — class manifest
// ════════════════════════════════════════════════════════════════════════
//  Emits dist/classes.json: which `juno-*` class names this build actually
//  defines a rule for, and which of those a consumer is meant to author.
//
//  WHY. A class name is a string that has to match something in another
//  artifact, and nothing checks it. A consumer named eleven classes junoui
//  does not ship (`juno-modal-body`, `juno-row`, …); every one compiled, the
//  tests passed, and the sheet rendered as unstyled UA defaults — which on a
//  phone put a dialog's APPLY button off the bottom of the screen with no way
//  to reach it. junoui had the same defect pointing the other way:
//  `.juno-seg__option` sat in a `touch-action` list that has never matched
//  anything, because the shipped class is `.juno-seg__opt`.
//
//  Read off the BUILT bundle, not src/: the bundle is what a consumer loads,
//  and it is the artifact whose selectors decide what exists.
//
//  Run as part of `npm run build` (after build:css). See docs/conformance-kit.md.
// ════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BUNDLE = 'dist/css/juno.css';
const DOCS = 'docs';
const OUT = 'dist/classes.json';

/** `juno-` or the role form `juno--`, then BEM segments.
 *  The leading boundary keeps `--juno-warning` out: a custom property is
 *  always preceded by a hyphen and a class never is. */
const CLASS_RE = /(?<![-\w])juno-{1,2}[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)*/g;

const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

/**
 * Class names appearing in SELECTOR position in `css`.
 *
 * Preludes only, and never at-rule preludes: a name inside a declaration
 * (`content: '.juno-x'`) is not a rule, and a doc comment's usage example is
 * documentation for something that may not exist. Counting either would make
 * the manifest vouch for a class with no rules — the exact failure it is
 * written to detect.
 */
export function definedClasses(css) {
  const src = stripCssComments(css);
  const found = new Set();
  let prelude = '';
  let depth = 0;
  for (const ch of src) {
    if (ch === '{') {
      if (depth === 0) {
        const p = prelude.trim();
        // `@media`/`@supports` preludes carry conditions, not selectors; their
        // nested rules are reached on the next iteration because depth only
        // suppresses collection at depth > 1.
        if (!p.startsWith('@')) for (const m of p.matchAll(CLASS_RE)) found.add(m[0]);
      } else if (depth === 1) {
        const p = prelude.trim();
        if (!p.startsWith('@')) for (const m of p.matchAll(CLASS_RE)) found.add(m[0]);
      }
      depth++;
      prelude = '';
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
      prelude = '';
    } else if (depth <= 1) {
      prelude += ch;
    }
  }
  return found;
}

/**
 * Class names the docs show a consumer writing.
 *
 * The `public` subset is derived from documentation rather than declared in a
 * list, so "document the class" is the gate rather than "remember to add it
 * twice". A class with rules but no mention anywhere in docs/ is internal by
 * construction — which is a claim `test/classes.test.mjs` checks against every
 * component's own usage example, so a genuinely public class cannot go missing
 * by someone forgetting to write it up.
 */
export function documentedClasses(docsDir) {
  const found = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.md')) {
        for (const m of readFileSync(p, 'utf8').matchAll(CLASS_RE)) found.add(m[0]);
      }
    }
  };
  walk(docsDir);
  return found;
}

/** Group flat names into block / elements / modifiers, BEM-wise. */
export function groupByComponent(all) {
  const components = {};
  for (const name of all) {
    // `juno--warning` is a role utility, not a component; it has no block.
    if (name.startsWith('juno--')) continue;
    const bare = name.slice('juno-'.length);
    const block = 'juno-' + bare.split(/__|--/)[0];
    const key = block.slice('juno-'.length);
    components[key] ??= { block, elements: [], modifiers: [] };
    if (name.includes('__')) components[key].elements.push(name);
    else if (name.includes('--')) components[key].modifiers.push(name);
  }
  for (const c of Object.values(components)) {
    c.elements.sort();
    c.modifiers.sort();
  }
  return components;
}

/** `@keyframes juno-*` names the bundle defines. */
export function keyframeNames(css) {
  const found = new Set();
  for (const m of stripCssComments(css).matchAll(/@keyframes\s+(juno-[a-z0-9-]+)/g))
    found.add(m[1]);
  return found;
}

/** `--juno-*` custom properties, WITHOUT the leading dashes.
 *
 *  A consumer writes the bare name as a string more often than you would
 *  expect — `junoPx('juno-pillbar-gap')` prepends the dashes itself — and that
 *  string is indistinguishable from a class by any regex. Shipping the token
 *  names is what lets the guard say "junoui ships nothing by this name"
 *  instead of "this is not a class", which is the claim it can actually make. */
export function tokenNames(tokensCss) {
  const found = new Set();
  for (const m of tokensCss.matchAll(/--(juno-[a-z0-9-]+)\s*:/g)) found.add(m[1]);
  return found;
}

/** `<symbol id="juno-i-*">` ids in the sprite, plus the namespace itself.
 *
 *  `juno-i` is in the set on purpose and is not a symbol: an icon reference is
 *  written `#juno-i-${name}`, and a matcher scanning source text stops at the
 *  interpolation, yielding the literal `juno-i`. That is a predictable
 *  artifact of the sprite's own documented usage, not a consumer error. */
export function iconIds(spriteSvg) {
  const found = new Set(['juno-i']);
  for (const m of spriteSvg.matchAll(/id="(juno-i-[a-z0-9-]+)"/g)) found.add(m[1]);
  return found;
}

export function buildManifest({ css, docs, version, tokensCss = '', spriteSvg = '' }) {
  const all = [...definedClasses(css)].sort();
  const documented = documentedClasses(docs);
  const roles = all.filter((n) => n.startsWith('juno--'));
  return {
    version,
    // every class this build defines a rule for
    all,
    // the subset the docs show a consumer authoring. NOT the helper's
    // default — see tools/testing.mjs for why 'all' is.
    public: all.filter((n) => documented.has(n)),
    // `.juno--<role>` utilities, always public: they are the color contract
    roles,
    components: groupByComponent(all),
    // Other `juno-*` namespaces this build ships. Not classes — but a name
    // matching one of these EXISTS, and a guard that reported it would be
    // telling a consumer to fix something that is correct.
    keyframes: [...keyframeNames(css)].sort(),
    // BOTH sheets: the generated token file carries the global scale, but a
    // component declares its own (`--juno-pillbar-gap` lives in
    // `.juno-pillbar`, not in juno-tokens.css) and those are just as much
    // names junoui ships. Reading only the token file reported three of them
    // against a consumer that was using them correctly.
    tokens: [...tokenNames(tokensCss + '\n' + css)].sort(),
    icons: [...iconIds(spriteSvg)].sort(),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(BUNDLE)) {
    console.error(`✗ ${BUNDLE} missing — run "npm run build:css" first.`);
    process.exit(1);
  }
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const readIf = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
  const manifest = buildManifest({
    css: readFileSync(BUNDLE, 'utf8'),
    docs: DOCS,
    version,
    tokensCss: readIf('dist/css/juno-tokens.css'),
    spriteSvg: readIf('dist/icons/juno-icons.svg'),
  });
  mkdirSync('dist', { recursive: true });
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `✓ classes: ${manifest.all.length} defined, ${manifest.public.length} public, ` +
      `+${manifest.tokens.length} tokens / ${manifest.keyframes.length} keyframes / ` +
      `${manifest.icons.length} icon ids → ${OUT}`,
  );
}
