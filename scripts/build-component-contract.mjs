#!/usr/bin/env node
// Emit dist/json/component-contract.json (+ dist/rust/juno_component_contract.rs)
// from src/css/components/*.css — a per-component slot order / states / tap
// floor a non-browser target can consume without re-deriving it from the CSS,
// the same reason scripts/build-rules.mjs exists so a painted consumer does
// not re-derive tap_min. 20260906-056 is why this matters: a native target
// silently dropped seven colours nothing here would have caught, because
// nothing asserted the targets agreed. This does the analogous thing for
// component STRUCTURE.
//
// FOLLOWS build-rules.mjs's design, not just its subject:
//   - it does not restate a value: every field here is extracted from the
//     component's own CSS file — its selectors AND its own `Usage:`
//     doc-comment example, which is the artifact a maintainer actually edits
//     when the markup contract changes, not a second document about it.
//   - a component is COVERED only when that extraction can be trusted, never
//     when a human would have to type the answer in. "the CSS doesn't
//     obviously reorder these, so DOM order is probably fine" is a judgement
//     call, not something this file is willing to assert — docs/CHARTER.md's
//     own line about a token's classification following its own declaration,
//     not a naming coincidence, applies here too: a "probably fixed" is
//     exactly the coincidence that stopped being true for ink.
//
// WHAT COUNTS AS "FIXED", MECHANICALLY, AND WHY IT IS NARROWER THAN THE
// CENSUS'S 23:
//   docs/inventory-elements.md calls a component "fixed" when a human reading
//   the file concludes DOM order is the only order — either because a
//   sibling combinator requires it, or because nothing in the file reorders
//   normal flow. The second half of that is a judgement about an ABSENCE
//   (no `order`, no reordering) applied to a WHOLE file, and absence is not
//   something this script is willing to certify — the switch component's own
//   `__input` sets `position: absolute` for the ordinary
//   visually-hidden-input pattern (1px, opacity 0), which is not a reorder
//   mechanism in the sense that matters, but a script cannot tell that
//   apart from one that is without judgement. So this generator certifies
//   ONLY components whose part sequence is anchored by BOTH:
//     1. a `Usage:` example in the file whose classes cover every BEM part
//        the CSS itself declares (so the exported order is not guessing at
//        an incomplete example), and
//     2. no explicit CSS reorder mechanism among the component's own rules —
//        narrowed to the unambiguous ones only: `order:`, an explicit
//        `grid-row`/`grid-column` placement, or a reversed `flex-direction`
//        on the component's own root. `position: absolute` is deliberately
//        NOT treated as disqualifying on its own — see switch above — so a
//        component that genuinely uses absolute positioning to reorder
//        VISIBLE content is not caught by this narrower check. That is a
//        real gap, stated here rather than silently: this export can have
//        false negatives (excludes something a human would call fixed) but
//        is built not to have false positives (never certifies an order that
//        isn't the one the CSS's own selectors and example agree on).
//   A component with an explicit sibling/child combinator between two of its
//   own parts (`A + B`, `A ~ B`, `A > B`) gets that recorded as supporting
//   evidence and cross-checked against the Usage order — a genuine
//   disagreement between the two is a build-time refusal, not a silent
//   downgrade, because that is exactly the shape of drift 20260906-056 was.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const DIR = 'src/css/components';
const OUT_JSON = 'dist/json/component-contract.json';
const OUT_RUST = 'dist/rust/juno_component_contract.rs';

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.css'))
  .sort();

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '\n');
const modBase = (part) => part.split('--')[0];

// ── namespace + parts, from the CSS rules themselves (not the doc comment) ─
function findNamespace(css) {
  const roots = new Map(); // root -> Set(partBase)
  const re = /\.juno-([a-z][a-zA-Z0-9-]*?)__([a-zA-Z0-9-]+)/g;
  let m;
  while ((m = re.exec(css))) {
    const [, root, part] = m;
    const set = roots.get(root) ?? new Set();
    set.add(modBase(part));
    roots.set(root, set);
  }
  return roots;
}

// ── the file's own `Usage:` example, raw (with markup) ──────────────────
function extractUsageBlock(raw) {
  const headerMatch = /^\/\*[\s\S]*?\*\//.exec(raw);
  if (!headerMatch) return null;
  const header = headerMatch[0];
  const idx = header.search(/\bUsage\b/);
  if (idx === -1) return null;
  return header
    .slice(idx)
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, ''))
    .join('\n');
}

function usageOrder(usageText, root) {
  if (!usageText) return null;
  const seen = [];
  const re = new RegExp(`\\bjuno-${root}__([a-zA-Z0-9-]+)`, 'g');
  let m;
  while ((m = re.exec(usageText))) {
    const base = modBase(m[1]);
    if (!seen.includes(base)) seen.push(base);
  }
  return seen;
}

// ── the component's OWN rule blocks — selector genuinely belongs to this
//    component, used to scope every other extraction to it and not to a
//    sibling one the file happens to reference (e.g. .juno-icon inside
//    .juno-tree's row) OR to an unrelated class that merely shares a text
//    prefix (.juno-toast-stack is its own top-level class, not a `toast`
//    part — matching on `.juno-toast-` would have pulled its rules in).
//    ".juno-<root>" itself, "__part", or "--modifier" only; a literal "-"
//    continuing into more identifier characters is a DIFFERENT class.
function ownRuleBlocks(css, root) {
  const blocks = [];
  const own = new RegExp(`\\.juno-${root}(?:__[\\w-]+|--[\\w-]+)?(?![\\w-])`);
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selector = m[1].trim();
    if (own.test(selector)) blocks.push({ selector, body: m[2] });
  }
  return blocks;
}

// Position properties that, when driven by a custom property the component's
// OWN Usage example sets INLINE (per instance, via style="--juno-<root>-x:
// ..."), mean that part's visual placement is app/data-supplied rather than
// DOM-order-derived — the gizmo's `__mark` rotated by `--juno-gizmo-at`
// (set per mark in real use), the range's `__thumb` offset by
// `--juno-range-lo`/`--juno-range-hi` (set on the root in the example).
// Deliberately narrower than "any component-local custom property in a
// position property": the stepper's connector line centres itself on
// `calc(var(--juno-stepper-marker) / 2)`, and that property is never set
// inline anywhere in the file's own example — it is a fixed geometric
// constant (the marker's own size), not per-instance data, and flagging it
// produced a false exclusion until this check required proof that the
// value is actually app-assigned, not merely component-local.
const POSITION_PROP =
  /(?:^|;)\s*(top|left|right|bottom|inset(?:-inline(?:-start|-end)?|-block(?:-start|-end)?)?|transform)\s*:\s*[^;]*/g;

function inlineAssignedVars(usageText, root) {
  const set = new Set();
  if (!usageText) return set;
  const re = new RegExp(`--juno-${root}-[\\w-]+(?=\\s*:)`, 'g');
  for (const styleAttr of usageText.matchAll(/style="([^"]*)"/g)) {
    for (const m of styleAttr[1].matchAll(re)) set.add(m[0]);
  }
  return set;
}

function reorderMechanisms(blocks, root, appSuppliedVars) {
  const found = [];
  const localPositionVar = new RegExp(`var\\((--juno-${root}-[\\w-]+)`);
  for (const { selector, body } of blocks) {
    if (/\border:\s*-?\d/.test(body)) found.push(`${selector} sets order:`);
    if (/\bgrid-(row|column):\s*\d/.test(body))
      found.push(`${selector} places itself on an explicit grid track`);
    // only the component's own root/base rule — a reversed flex-direction on
    // a PART would just flip that part's own children, not the sibling order
    // this contract is about.
    if (selector === `.juno-${root}` && /flex-direction:\s*(row|column)-reverse/.test(body)) {
      found.push(`${selector} sets a reversed flex-direction`);
    }
    for (const m of body.matchAll(POSITION_PROP)) {
      const varMatch = localPositionVar.exec(m[0]);
      if (varMatch && appSuppliedVars.has(varMatch[1])) {
        found.push(
          `${selector} positions itself via ${varMatch[1]}, which the component's own Usage example sets per instance (${m[1]})`,
        );
      }
    }
  }
  return found;
}

// A + B / A ~ B (sibling order) and A > B (containment) between two of the
// component's OWN parts — informational, and cross-checked against the
// Usage order below.
function combinatorEvidence(css, root, parts) {
  const evidence = [];
  const partAlt = [...parts].sort((a, b) => b.length - a.length).join('|');
  if (!partAlt) return evidence;
  const re = new RegExp(
    `\\.juno-${root}__(${partAlt})(?:--[a-zA-Z0-9-]+)?(?:\\[[^\\]]*\\]|:[a-zA-Z-]+(?:\\([^)]*\\))?)*\\s*([+>~])\\s*\\.juno-${root}__(${partAlt})`,
    'g',
  );
  const seen = new Set();
  let m;
  while ((m = re.exec(css))) {
    const [, a, combinator, b] = m;
    if (a === b) continue; // same-part sibling rule (e.g. row+row hairline), not a cross-part order fact
    const key = `${a} ${combinator} ${b}`;
    if (seen.has(key)) continue; // the same pair, restated per pseudo-class/attribute variant
    seen.add(key);
    evidence.push({ before: a, combinator, after: b });
  }
  return evidence;
}

// Every A+B/A~B pair must have `before` appear earlier than `after` in the
// resolved order for the contract to certify it; A>B (containment) is not an
// order claim, so it is recorded but not checked here.
function combinatorsAgreeWithOrder(evidence, order) {
  for (const e of evidence) {
    if (e.combinator === '>') continue;
    const bi = order.indexOf(e.before);
    const ai = order.indexOf(e.after);
    if (bi === -1 || ai === -1 || bi >= ai) return e;
  }
  return null;
}

const STATE_RE = /(:[a-zA-Z-]+(?:\([^)]*\))?|\[[a-zA-Z-]+(?:=[^\]]*)?\])/g;
const STATE_ALLOW =
  /^:(hover|focus|focus-visible|active|disabled|checked|not|empty|only-child|last-child|first-child)|^\[(aria-|data-juno-|open\b|disabled\b|readonly\b)/;
function findStates(blocks) {
  const set = new Set();
  for (const { selector } of blocks) {
    const matches = selector.match(STATE_RE) ?? [];
    for (const s of matches) if (STATE_ALLOW.test(s)) set.add(s);
  }
  return [...set].sort();
}

function findTapFloor(blocks) {
  const set = new Set();
  for (const { body } of blocks) {
    for (const m of body.matchAll(/var\(--juno-size-tap-(min|comfortable)\)/g)) {
      set.add(`--juno-size-tap-${m[1]}`);
    }
  }
  return [...set].sort();
}

function findIndentStep(blocks) {
  for (const { body } of blocks) {
    const m = /(--juno-[a-z0-9-]*indent[a-z0-9-]*)\s*:/.exec(body);
    if (m) return m[1];
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════
const covered = {};
const excluded = {};
const byReason = {};

function exclude(name, reason, detail) {
  excluded[name] = { reason, detail };
  byReason[reason] = (byReason[reason] ?? 0) + 1;
}

for (const file of files) {
  const name = file.replace(/\.css$/, '');
  const raw = readFileSync(`${DIR}/${file}`, 'utf8');
  const css = stripComments(raw);

  const roots = findNamespace(css);
  if (roots.size === 0) {
    exclude(name, 'zero-parts', 'no `.juno-<x>__<part>` class declared anywhere in the file');
    continue;
  }
  if (roots.size > 1) {
    exclude(
      name,
      'multi-namespace',
      `file declares parts under ${roots.size} independent component prefixes (${[...roots.keys()].join(', ')}) — no single slot order to export`,
    );
    continue;
  }
  const [root] = roots.keys();
  const parts = roots.get(root);

  const usageText = extractUsageBlock(raw);
  if (!usageText) {
    exclude(
      name,
      'no-usage-example',
      "no `Usage` example in the file's LEADING doc comment (this generator only reads that one, scoped that way deliberately — a file documenting several variants further down, one Usage block per variant, has no single canonical order to certify without picking one, which would be exactly the judgement call this file refuses to make)",
    );
    continue;
  }
  const order = usageOrder(usageText, root);
  const missing = [...parts].filter((p) => !order.includes(p));
  const extra = order.filter((p) => !parts.has(p));
  if (missing.length || extra.length) {
    exclude(
      name,
      'usage-incomplete',
      `Usage example and CSS parts disagree — missing from example: [${missing.join(', ')}]; in example but not a CSS part: [${extra.join(', ')}]`,
    );
    continue;
  }

  const blocks = ownRuleBlocks(css, root);
  const appSuppliedVars = inlineAssignedVars(usageText, root);
  const mechanisms = reorderMechanisms(blocks, root, appSuppliedVars);
  if (mechanisms.length) {
    exclude(name, 'reorder-mechanism', mechanisms.join('; '));
    continue;
  }

  const evidence = combinatorEvidence(css, root, parts);
  const disagreement = combinatorsAgreeWithOrder(evidence, order);
  if (disagreement) {
    exclude(
      name,
      'combinator-disagrees',
      `CSS requires \`${disagreement.before}\` before \`${disagreement.after}\` (\`${disagreement.combinator}\` combinator) but the Usage example orders them the other way`,
    );
    continue;
  }

  covered[name] = {
    root,
    order,
    combinatorEvidence: evidence,
    states: findStates(blocks),
    tapFloor: findTapFloor(blocks),
    indentStep: findIndentStep(blocks),
  };
}

const REASON_MEANING = {
  'zero-parts': 'no `__part` class declared at all — nothing to order',
  'multi-namespace':
    'file bundles two or more independent component prefixes — no single order to certify',
  'no-usage-example': "no Usage example in the file's leading doc comment to derive an order from",
  'usage-incomplete': "the Usage example doesn't show every part the CSS declares",
  'reorder-mechanism':
    'an explicit CSS reorder mechanism (order, grid placement, or an app-supplied position) was found',
  'combinator-disagrees':
    'a sibling/child combinator contradicts the order the Usage example shows',
};

const total = files.length;
const coveredCount = Object.keys(covered).length;
const excludedCount = Object.keys(excluded).length;
const reasonSummary = Object.entries(byReason)
  .sort((a, b) => b[1] - a[1])
  .map(([reason, n]) => `${reason} (${n}, ${REASON_MEANING[reason]})`)
  .join('; ');

const contract = {
  $comment: `junoui component contract — generated; do not edit. Covers ${coveredCount} of ${total} component files: a slot order is exported only when a Usage: example in the file's leading doc comment covers every declared BEM part, that order is cross-checked against any sibling/child combinator between those parts, and no explicit CSS reorder mechanism was found. The other ${excludedCount} are EXCLUDED, not silently omitted — every one has a reason in the \`excluded\` object below, drawn from this vocabulary: ${reasonSummary}. See scripts/build-component-contract.mjs for why this is narrower than docs/inventory-elements.md's hand-read fixed-23 (it does not certify "normal flow, nothing obviously reorders it" — only what a Usage example and the selectors themselves prove).`,
  totalComponentFiles: total,
  covered,
  excluded,
  counts: {
    total,
    covered: coveredCount,
    excluded: excludedCount,
    byExclusionReason: byReason,
  },
};

mkdirSync('dist/json', { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(contract, null, 2) + '\n');

// ── Rust target — flat, mirroring juno_rules.rs's shape ─────────────────
const rustIdent = (s) => s.replace(/-/g, '_');
const rustStrArr = (arr) => `&[${arr.map((s) => JSON.stringify(s)).join(', ')}]`;
const coveredNames = Object.keys(covered).sort();
const rustEntries = coveredNames
  .map((name) => {
    const c = covered[name];
    return `    ComponentContract {
        name: "${name}",
        order: ${rustStrArr(c.order)},
        states: ${rustStrArr(c.states)},
        tap_floor: ${rustStrArr(c.tapFloor)},
        indent_step: ${c.indentStep ? JSON.stringify(c.indentStep) : 'None'},
    },`;
  })
  .join('\n');

const rustSrc = `// junoui component contract — Rust. Generated; do not edit.
//
// Regenerate with \`npm run build\` in the junoui repo. See
// scripts/build-component-contract.mjs for what "covered" means and why
// only ${coveredNames.length} of ${total} component files qualify — a
// component not listed here does not have a slot order this generator is
// willing to certify from its CSS alone; see the JSON export
// (junoui/component-contract.json) for the excluded set and reasons.
#![allow(dead_code)]

/// One component's provable structural contract — the part sequence a
/// non-CSS implementation must reproduce, its state hooks, and which tap
/// floor token(s) it reads, if any.
#[derive(Clone, Copy, Debug)]
pub struct ComponentContract {
    pub name: &'static str,
    pub order: &'static [&'static str],
    pub states: &'static [&'static str],
    pub tap_floor: &'static [&'static str],
    pub indent_step: Option<&'static str>,
}

pub const COMPONENTS: &[ComponentContract] = &[
${rustEntries}
];
`;

mkdirSync('dist/rust', { recursive: true });
writeFileSync(OUT_RUST, rustSrc);

console.log(
  `component-contract: ${OUT_JSON}, ${OUT_RUST} — ${Object.keys(covered).length} of ${total} covered (${JSON.stringify(byReason)})`,
);
