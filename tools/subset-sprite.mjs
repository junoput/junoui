// ════════════════════════════════════════════════════════════════════════
//  junoui — icon sprite subsetter (build tooling for consumers)
// ════════════════════════════════════════════════════════════════════════
//  The sprite ships every icon junoui has (65 and growing). An app that
//  inlines it — which is what Safari's flaky external-<use> rendering forces
//  (see scripts/build-icons.mjs) — therefore ships every icon in its main
//  bundle, not the ~20 it draws. This module is the missing half: a pure,
//  dependency-free subsetter a consumer's build step (Vite/webpack plugin,
//  npm script) runs over the shipped sprite.
//
//  Node-only tooling, deliberately NOT part of the browser CSS/JS surface:
//  subsetting at runtime would defeat the point.
//
//      import { subsetSprite, spriteSymbolNames } from '@junoput01/junoui/subset';
//      const svg = subsetSprite(readFileSync(spritePath, 'utf8'), ['gear', 'x']);
//
//  Contract: names are bare icon names ('gear'), never prefixed ids. The
//  result keeps the sprite's banner and wrapper attributes verbatim, so the
//  license notice travels with every subset (the icons are MIT Phosphor and
//  the notice is a condition of redistribution).
// ════════════════════════════════════════════════════════════════════════

const SYMBOL_RE = /<symbol\s+id="juno-i-([^"]+)"[\s\S]*?<\/symbol>/g;

/** Every icon name the sprite defines, in document order. */
export function spriteSymbolNames(sprite) {
  return [...sprite.matchAll(SYMBOL_RE)].map((m) => m[1]);
}

/**
 * The same sprite carrying only `names`.
 *
 * Throws on a name the sprite does not define: a silently dropped icon
 * renders as an empty <svg> in the consuming app — visible to nobody until a
 * user reports a blank space — so an unknown name is a build failure, not a
 * warning. Unused names in the sprite are simply omitted; order follows the
 * sprite, not the request, so the output is stable under a reordered list.
 */
export function subsetSprite(sprite, names) {
  const wanted = new Set(names);
  const have = new Set(spriteSymbolNames(sprite));
  const missing = [...wanted].filter((n) => !have.has(n));
  if (missing.length) {
    throw new Error(
      `subsetSprite: the sprite defines no icon named ${missing.map((n) => `'${n}'`).join(', ')} — ` +
        `available: ${[...have].join(', ')}`,
    );
  }
  const kept = [];
  for (const m of sprite.matchAll(SYMBOL_RE)) if (wanted.has(m[1])) kept.push(m[0]);
  // Keep everything outside the symbols verbatim (banner + <svg> open/close),
  // so the license notice and the wrapper's fill/display attributes survive.
  const head = sprite.slice(0, sprite.indexOf('<symbol'));
  const tail = sprite.slice(sprite.lastIndexOf('</symbol>') + '</symbol>'.length);
  return `${head}${kept.join('\n')}${tail}`;
}
