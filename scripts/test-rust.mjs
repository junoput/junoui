#!/usr/bin/env node
// Compile and run the generated Rust rules.
//
// SEPARATE FROM `npm test` ON PURPOSE, and this is the honest part of
// 20260901-051: Node cannot verify Rust SEMANTICS. The JS suite can check that
// the generator emitted a case for every row of the shared table, that the two
// bounds agree as numbers, and that nothing restated the predicate — it cannot
// check that the Rust body computes what the JS body computes. Only rustc can,
// by running the generated #[test] bodies.
//
// CI runs this in the `build` job (20260901-075). Before that it had no Rust
// toolchain and nothing ever compiled the generated file, which is how a Rust
// body could diverge from its JS twin and survive the whole JS suite.
//
// Kept as a separate script rather than folded into `npm test` because it needs
// a toolchain the Node suite does not, and a consumer without rustc should
// still be able to run `npm test`.
//
// It REFUSES when rustc is absent rather than skipping. A guard that quietly
// does nothing and a guard that passes are the same object.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = 'dist/rust/juno_rules.rs';

try {
  execFileSync('rustc', ['--version'], { stdio: 'pipe' });
} catch {
  console.error(
    `cannot verify ${SRC}: rustc is not on PATH.\n` +
      '  This is a refusal, not a skip — the Rust half of the rules is unverified\n' +
      '  without it. Install a toolchain (https://rustup.rs) and re-run.',
  );
  process.exit(2);
}

const dir = mkdtempSync(join(tmpdir(), 'juno-rules-'));
copyFileSync(SRC, join(dir, 'juno_rules.rs'));
execFileSync(
  'rustc',
  ['--test', '--edition', '2021', '-o', join(dir, 'rt'), join(dir, 'juno_rules.rs')],
  {
    stdio: 'inherit',
  },
);
execFileSync(join(dir, 'rt'), { stdio: 'inherit' });
