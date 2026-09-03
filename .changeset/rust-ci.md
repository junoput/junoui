---
'@junoput01/junoui': patch
---

CI compiles the generated Rust rules (`20260901-075`).

`dist/rust/juno_rules.rs` is generated and carries its own `#[test]` bodies, emitted from the same case table the JS tests run — but nothing ever compiled it. That gap was not theoretical: a mutation making the Rust `wants_compact_nav` diverge from its JS twin, dropping the `or short` term that is the landscape-phone hole, **survived the entire JS suite**. Node can check the table, the bounds as numbers and the generated-assertion count; it cannot check that a Rust body computes what the JS body computes.

The `build` job now runs `npm run test:rust` behind a toolchain action. Cheap by construction: no cargo, no crate, no registry access, no cache — one `rustc --test` over one generated file with no dependencies. The runner **refuses** rather than skips when `rustc` is absent, so the step cannot quietly pass on a runner without one.

`docs/painted-ui.md` said CI did not compile this file, and that had to change with it. The guard is now bidirectional — it ties the doc's claim to whether `ci.yml` actually runs the step, in both directions — because the previous version pinned the doc's _text_ and would have stayed green over a doc that had become false.
