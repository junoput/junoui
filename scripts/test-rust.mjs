#!/usr/bin/env node
// Compile and run EVERY generated Rust file in dist/rust/.
//
// SEPARATE FROM `npm test` ON PURPOSE, and this is the honest part of
// 20260901-051: Node cannot verify Rust SEMANTICS. The JS suite can check that
// the generator emitted a case for every row of the shared table, that the two
// bounds agree as numbers, and that nothing restated the predicate — it cannot
// check that the Rust body computes what the JS body computes. Only rustc can,
// by running the generated #[test] bodies (juno_rules.rs has them);
// juno_tokens.rs and juno_component_contract.rs have none, but "compiles" is
// still a real assertion for a file whose whole job is to type-check in a
// consumer's crate.
//
// CI runs this in the `build` job (20260901-075) — but until 20260908-080 it
// only ever compiled juno_rules.rs. juno_tokens.rs and
// juno_component_contract.rs were emitted, published, and compiled by
// NOTHING: dist/rust/juno_component_contract.rs shipped with `indent_step` as
// a bare &str where the struct declared Option<&str> — error[E0308] on the
// consumer's very first `cargo build` — because the one file this script knew
// about was never the one that broke. Compile every dist/rust/*.rs so a new
// Rust target does not have to be added here by hand to be covered.
//
// Kept as a separate script rather than folded into `npm test` because it needs
// a toolchain the Node suite does not, and a consumer without rustc should
// still be able to run `npm test`.
//
// It REFUSES when rustc is absent, or when dist/rust/ doesn't look built,
// rather than skipping. A guard that quietly does nothing and a guard that
// passes are the same object.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RUST_DIR = 'dist/rust';

try {
  execFileSync('rustc', ['--version'], { stdio: 'pipe' });
} catch {
  console.error(
    `cannot verify ${RUST_DIR}/*.rs: rustc is not on PATH.\n` +
      '  This is a refusal, not a skip — the Rust exports are unverified\n' +
      '  without it. Install a toolchain (https://rustup.rs) and re-run.',
  );
  process.exit(2);
}

const files = readdirSync(RUST_DIR)
  .filter((f) => f.endsWith('.rs'))
  .sort();

// Vacuity floor: an empty or missing dist/rust/ would otherwise make this
// script report success having verified nothing, exactly the shape
// fleet-operating-rules.md calls "a null that looked like an answer". Three
// targets exist today (juno_tokens.rs, juno_rules.rs,
// juno_component_contract.rs); run `npm run build` first if this fires.
if (files.length < 3) {
  console.error(
    `cannot verify ${RUST_DIR}/*.rs: only ${files.length} file(s) found (floor is 3).\n` +
      '  This is a refusal, not a skip — run `npm run build` first.',
  );
  process.exit(2);
}

for (const file of files) {
  const dir = mkdtempSync(join(tmpdir(), 'juno-rust-'));
  const src = join(dir, file);
  copyFileSync(join(RUST_DIR, file), src);
  console.log(`── ${file} ──`);
  execFileSync('rustc', ['--test', '--edition', '2021', '-o', join(dir, 'rt'), src], {
    stdio: 'inherit',
  });
  execFileSync(join(dir, 'rt'), { stdio: 'inherit' });
}
